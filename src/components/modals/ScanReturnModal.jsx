// src/components/modals/ScanReturnModal.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Camera,
  ChevronDown,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useToast } from "../../context/ToastContext";
import { borrowReturnService } from "../../services/borrowReturnService";

export default function ScanReturnModal({ onClose, onReload }) {
  const { showToast } = useToast();

  // States xử lý dữ liệu phiếu
  const [ticketInfo, setTicketInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnough, setIsEnough] = useState(true);
  const [note, setNote] = useState("");

  // States quản lý Camera Custom UI
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState("");
  const [camError, setCamError] = useState(null);
  const scannerRef = useRef(null);

  // 1. Lấy danh sách Camera khi mở Modal
  useEffect(() => {
    if (ticketInfo) return; // Không lấy cam nếu đã quét xong

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Ưu tiên chọn camera sau (môi trường mobile)
          const backCam = devices.find((c) =>
            c.label.toLowerCase().includes("back"),
          );
          setActiveCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setCamError("Không tìm thấy Camera nào trên thiết bị của bạn.");
        }
      })
      .catch((err) => {
        setCamError(
          "Vui lòng cho phép quyền truy cập Camera trên trình duyệt để quét mã.",
        );
      });
  }, [ticketInfo]);

  // 2. Bật Camera khi activeCameraId thay đổi
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
          aspectRatio: 1.0, // Ép video vuông vắn
        },
        async (decodedText) => {
          // QUÉT THÀNH CÔNG -> Tắt camera ngay lập tức
          if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop();
            scannerRef.current.clear();
          }

          // Gọi API lấy thông tin
          try {
            const res =
              await borrowReturnService.getReturnTicketInfo(decodedText);
            setTicketInfo(res);
          } catch (e) {
            showToast("Mã trả đồ không hợp lệ!", "error");
            onClose();
          }
        },
        (errorMessage) => {
          // Bỏ qua các frame không có mã QR
        },
      )
      .catch((err) => {
        setCamError("Không thể khởi động Camera. Vui lòng thử lại.");
      });

    // Cleanup khi đóng Modal hoặc đổi Camera
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current.clear();
          })
          .catch((e) => console.log("Lỗi dừng cam:", e));
      }
    };
  }, [activeCameraId, ticketInfo, onClose, showToast]);

  const handleConfirmReturn = async () => {
    if (!isEnough && !note)
      return showToast("Vui lòng nhập ghi chú nếu trả thiếu/hỏng", "error");
    setIsProcessing(true);
    try {
      await borrowReturnService.confirmReturn({
        returnCode: ticketInfo.returnCode,
        isEnough,
        note: isEnough ? "" : note,
      });
      showToast("Đã hoàn tất thủ tục nhận đồ!");
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        {/* Header Modal */}
        <div className="p-5 flex justify-between items-center bg-slate-800 text-white">
          <h3 className="font-bold text-lg flex items-center">
            <ScanLine className="mr-2" /> Quét Mã Trả Đồ
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {!ticketInfo ? (
          // GIAO DIỆN QUÉT CAMERA MỚI TÙY CHỈNH
          <div className="p-6 bg-slate-900 flex flex-col items-center">
            {/* Lỗi cấp quyền Camera */}
            {camError ? (
              <div className="w-full bg-red-500/10 border border-red-500/50 p-4 rounded-2xl text-center space-y-2">
                <AlertTriangle size={32} className="mx-auto text-red-400" />
                <p className="text-sm font-medium text-red-200">{camError}</p>
              </div>
            ) : (
              <>
                {/* Select Camera Custom (Sắc nét, không bị mờ) */}
                {cameras.length > 1 && (
                  <div className="w-full relative group mb-4">
                    <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-400 pointer-events-none transition-colors">
                      <Camera size={18} />
                    </div>
                    <select
                      className="w-full appearance-none pl-10 pr-10 p-3 bg-slate-800 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold cursor-pointer shadow-sm transition-all"
                      value={activeCameraId}
                      onChange={(e) => setActiveCameraId(e.target.value)}
                    >
                      {cameras.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label || `Camera ${c.id.substring(0, 5)}`}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 text-slate-400 pointer-events-none group-hover:text-indigo-400 transition-colors">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                )}

                {/* Khung Video Camera (Bo góc mượt mà) */}
                <div
                  id="custom-qr-reader"
                  className="w-full overflow-hidden rounded-2xl border-2 border-slate-700 bg-black shadow-inner relative"
                  style={{ minHeight: "250px" }}
                >
                  {/* Chỉ hiện chữ này khi camera chưa kịp load lên */}
                  {!activeCameraId && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                      Đang tải camera...
                    </div>
                  )}
                </div>

                <p className="mt-5 text-slate-400 text-sm font-medium">
                  Đưa mã QR trên email người mượn vào khung hình
                </p>
              </>
            )}
          </div>
        ) : (
          // GIAO DIỆN KIỂM TRA THÔNG TIN (Giữ nguyên)
          <div className="p-6 bg-slate-50 space-y-4">
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <h4 className="text-sm font-bold text-slate-500 uppercase mb-3 border-b pb-2">
                Thông tin vật tư mượn
              </h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-slate-500">Vật tư:</span>{" "}
                <span className="font-bold">{ticketInfo.material.name}</span>
                <span className="text-slate-500">Số lượng:</span>{" "}
                <span className="font-bold text-amber-600">
                  {ticketInfo.quantity}
                </span>
                <span className="text-slate-500">Người mượn:</span>{" "}
                <span className="font-bold">{ticketInfo.borrowerName}</span>
                <span className="text-slate-500">Phòng ban:</span>{" "}
                <span className="font-bold">{ticketInfo.department}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center p-3 bg-white border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  className="w-5 h-5 text-indigo-600"
                  name="status"
                  checked={isEnough}
                  onChange={() => setIsEnough(true)}
                />
                <span className="ml-3 font-bold text-green-600 flex items-center">
                  <CheckCircle2 className="mr-1" size={18} /> Đã nhận Đủ &
                  Nguyên vẹn
                </span>
              </label>
              <label className="flex items-center p-3 bg-white border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  className="w-5 h-5 text-red-600"
                  name="status"
                  checked={!isEnough}
                  onChange={() => setIsEnough(false)}
                />
                <span className="ml-3 font-bold text-red-500 flex items-center">
                  <AlertTriangle className="mr-1" size={18} /> Bị Thiếu / Hư
                  hỏng
                </span>
              </label>
            </div>

            {!isEnough && (
              <textarea
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                placeholder="Nhập ghi chú chi tiết tình trạng..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}

            <button
              onClick={handleConfirmReturn}
              disabled={isProcessing}
              className="w-full py-3.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 mt-4 flex justify-center shadow-md active:scale-[0.98] transition-all"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" />
              ) : (
                "XÁC NHẬN NHẬN ĐỒ"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
