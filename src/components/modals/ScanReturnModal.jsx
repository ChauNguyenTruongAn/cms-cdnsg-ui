import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Camera,
  ChevronDown,
  PackageCheck
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useToast } from "../../context/ToastContext";
import { borrowReturnService } from "../../services/borrowReturnService";

export default function ScanReturnModal({ onClose, onReload, initialTicket = null }) {
  const { showToast } = useToast();

  const [ticketInfo, setTicketInfo] = useState(initialTicket);
  const [isProcessing, setIsProcessing] = useState(false);

  // States cho Form trả đồ nhiều món
  const [itemForms, setItemForms] = useState([]);
  const [generalNote, setGeneralNote] = useState("");

  // States quản lý Camera Custom UI
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState("");
  const [camError, setCamError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (ticketInfo && ticketInfo.items) {
      setItemForms(
        ticketInfo.items.map(item => ({
          itemId: item.itemId || item.id,
          itemName: item.itemName,
          borrowedQuantity: item.quantity,
          returnedQuantity: item.quantity, // Default to all returned
          brokenQuantity: 0,
          conditionNote: ""
        }))
      );
    }
  }, [ticketInfo]);

  // Lấy danh sách Camera
  useEffect(() => {
    if (ticketInfo) return; 
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find((c) => c.label.toLowerCase().includes("back"));
          setActiveCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setCamError("Không tìm thấy Camera nào trên thiết bị của bạn.");
        }
      })
      .catch((err) => {
        setCamError("Vui lòng cho phép quyền truy cập Camera trên trình duyệt để quét mã.");
      });
  }, [ticketInfo]);

  // Bật Camera
  useEffect(() => {
    if (!activeCameraId || ticketInfo) return;

    const html5QrCode = new Html5Qrcode("custom-qr-reader");
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        activeCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop();
            scannerRef.current.clear();
          }
          try {
            const res = await borrowReturnService.getReturnTicketInfo(decodedText);
            setTicketInfo(res.data || res);
          } catch (e) {
            showToast("Mã trả đồ không hợp lệ!", "error");
            onClose();
          }
        },
        (errorMessage) => {}
      )
      .catch((err) => {
        setCamError("Không thể khởi động Camera. Vui lòng thử lại.");
      });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(console.log);
      }
    };
  }, [activeCameraId, ticketInfo, onClose, showToast]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...itemForms];
    newItems[index][field] = value;
    
    // Auto adjust based on logic: returned + broken <= borrowed
    if (field === "returnedQuantity") {
       if (value + newItems[index].brokenQuantity > newItems[index].borrowedQuantity) {
         newItems[index].brokenQuantity = newItems[index].borrowedQuantity - value;
       }
    } else if (field === "brokenQuantity") {
       if (value + newItems[index].returnedQuantity > newItems[index].borrowedQuantity) {
         newItems[index].returnedQuantity = newItems[index].borrowedQuantity - value;
       }
    }

    setItemForms(newItems);
  };

  const handleConfirmReturn = async () => {
    setIsProcessing(true);
    try {
      const payloadItems = itemForms.map(i => ({
        itemId: i.itemId,
        returnedQuantity: i.returnedQuantity,
        brokenQuantity: i.brokenQuantity,
        conditionNote: i.conditionNote
      }));

      if (initialTicket) {
        // Manual return
        await borrowReturnService.confirmReturnManual(initialTicket.id, {
          generalNote,
          items: payloadItems
        });
      } else {
        // QR return
        await borrowReturnService.confirmReturn({
          returnCode: ticketInfo.returnCode,
          generalNote,
          items: payloadItems
        });
      }

      showToast("Đã hoàn tất thủ tục nhận đồ!", "success");
      onReload();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi xác nhận", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        <div className="p-5 flex justify-between items-center bg-[#1a237e] text-white shrink-0">
          <h3 className="font-bold text-lg flex items-center">
            {initialTicket ? <PackageCheck className="mr-2" /> : <ScanLine className="mr-2" />} 
            {initialTicket ? "Xác Nhận Thu Hồi (Thủ Công)" : "Quét Mã Trả Đồ"}
          </h3>
          <button onClick={onClose} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 bg-slate-50">
          {!ticketInfo ? (
            <div className="flex flex-col items-center">
              {camError ? (
                <div className="w-full bg-red-500/10 border border-red-500/50 p-4 rounded-2xl text-center space-y-2">
                  <AlertTriangle size={32} className="mx-auto text-red-400" />
                  <p className="text-sm font-medium text-red-600">{camError}</p>
                </div>
              ) : (
                <>
                  {cameras.length > 1 && (
                    <div className="w-full relative group mb-4">
                      <div className="absolute left-3 top-3 text-slate-400">
                        <Camera size={18} />
                      </div>
                      <select
                        className="w-full pl-10 pr-10 p-3 bg-white border border-slate-200 text-slate-800 rounded-xl outline-none font-semibold cursor-pointer shadow-sm"
                        value={activeCameraId}
                        onChange={(e) => setActiveCameraId(e.target.value)}
                      >
                        {cameras.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label || `Camera ${c.id.substring(0, 5)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div
                    id="custom-qr-reader"
                    className="w-full overflow-hidden rounded-2xl border-2 border-[#1a237e] bg-black shadow-inner relative"
                    style={{ minHeight: "250px" }}
                  >
                    {!activeCameraId && (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                        Đang tải camera...
                      </div>
                    )}
                  </div>
                  <p className="mt-5 text-slate-500 text-sm font-medium">
                    Đưa mã QR trên email người mượn vào khung hình
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-sm font-bold text-slate-500 uppercase mb-3 border-b pb-2">
                  Thông tin Phiếu Mượn
                </h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-slate-500">Mã phiếu:</span>
                  <span className="font-bold text-[#1a237e]">{ticketInfo.borrowCode}</span>
                  <span className="text-slate-500">Người mượn:</span>
                  <span className="font-bold">{ticketInfo.borrowerName}</span>
                  <span className="text-slate-500">Phòng ban:</span>
                  <span className="font-bold">{ticketInfo.department}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Tình trạng vật phẩm</h4>
                <div className="space-y-3">
                  {itemForms.map((item, index) => (
                    <div key={index} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <div className="font-bold text-[#1a237e] mb-2">{item.itemName} (Mượn: {item.borrowedQuantity})</div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Trả tốt</label>
                          <input
                            type="number"
                            min="0"
                            max={item.borrowedQuantity}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-green-500 text-green-600 font-bold"
                            value={item.returnedQuantity}
                            onChange={(e) => handleItemChange(index, "returnedQuantity", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Hư hỏng/Thiếu</label>
                          <input
                            type="number"
                            min="0"
                            max={item.borrowedQuantity}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500 text-red-600 font-bold"
                            value={item.brokenQuantity}
                            onChange={(e) => handleItemChange(index, "brokenQuantity", parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Ghi chú tình trạng (nếu có)..."
                        className="w-full p-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#1a237e]/30"
                        value={item.conditionNote}
                        onChange={(e) => handleItemChange(index, "conditionNote", e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Ghi chú chung</h4>
                <textarea
                  className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1a237e]/30 transition-all resize-none h-20 shadow-sm"
                  placeholder="Người mượn làm rơi balo, nộp phạt..."
                  value={generalNote}
                  onChange={(e) => setGeneralNote(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {ticketInfo && (
          <div className="p-5 border-t border-slate-100 bg-white shrink-0">
            <button
              onClick={handleConfirmReturn}
              disabled={isProcessing}
              className="w-full py-3.5 bg-[#1a237e] text-white font-bold rounded-xl hover:bg-[#0d145e] flex justify-center items-center shadow-md active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
              XÁC NHẬN THU HỒI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
