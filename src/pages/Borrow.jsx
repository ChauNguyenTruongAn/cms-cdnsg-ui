import React, { useState } from "react";
import {
  Wand2,
  FileText,
  Trash2,
  Plus,
  QrCode,
  CheckCircle,
} from "lucide-react";

export default function Borrow() {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [borrower, setBorrower] = useState("");
  const [items, setItems] = useState([{ name: "", qty: 1 }]);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrConfirmed, setQrConfirmed] = useState(false);

  const handleSuggest = async () => {
    if (!aiInput.trim()) {
      alert("Vui lòng nhập nhu cầu của bạn!");
      return;
    }
    setIsAiLoading(true);
    const prompt = `Người dùng có nhu cầu: "${aiInput}". Hãy suy luận logic và đề xuất danh sách thiết bị cần thiết từ kho (ví dụ: máy chiếu, cáp nối, loa, micro, bảng vẽ, v.v.) và số lượng hợp lý. Trả về đúng định dạng JSON được yêu cầu.`;

    try {
      const response = await aiService.callGemini(prompt, true);
      if (response && response.items && response.items.length > 0) {
        setItems(response.items);
        alert("✨ AI đã hoàn tất gợi ý thiết bị!");
      } else {
        alert("Không tìm thấy gợi ý phù hợp.");
      }
    } catch (e) {
      alert("Lỗi kết nối AI. Vui lòng kiểm tra lại API Key.");
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerateQR = () => {
    setQrGenerated(true);
    setQrConfirmed(false);
  };

  const handleConfirm = () => {
    setQrConfirmed(true);
    alert("Đã xác nhận mượn vật tư thành công!");
    setTimeout(() => {
      setQrGenerated(false);
      setItems([{ name: "", qty: 1 }]);
      setBorrower("");
    }, 2000);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Khối AI Gợi ý */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center">
            <Wand2 size={16} className="mr-2 text-indigo-600" /> AI Gợi ý Thiết
            bị mượn
          </h3>
          <p className="text-xs text-indigo-700 mb-3">
            Mô tả nhu cầu công việc của bạn, AI sẽ tự động phân tích và đề xuất
            danh sách thiết bị cần mượn.
          </p>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              type="text"
              placeholder="VD: Tôi chuẩn bị báo cáo luận văn tốt nghiệp, cần thiết bị trình chiếu..."
              className="flex-1 p-3 text-sm bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSuggest()}
            />
            <button
              onClick={handleSuggest}
              disabled={isAiLoading}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:opacity-70 whitespace-nowrap"
            >
              {isAiLoading ? "Đang phân tích..." : "✨ Phân tích"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form Đăng ký */}
        <div className="flex-1 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center text-slate-800">
            <FileText size={20} className="mr-2 text-[#1a237e]" /> Đăng ký mượn
            thiết bị
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Người mượn
              </label> value: aiInput,
              <input
                type="text"
                placeholder="Nhập tên giáo viên/nhân viên..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                value={borrower}
                onChange={(e) => setBorrower(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Tên vật tư
                    </label>
                    <input
                      type="text"
                      className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a237e] ${item.name ? "border-indigo-200 bg-indigo-50/30" : ""}`}
                      value={item.name}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      SL
                    </label>
                    <input
                      type="number"
                      min="1"
                      className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a237e] text-center ${item.name ? "border-indigo-200 bg-indigo-50/30" : ""}`}
                      value={item.qty}
                      onChange={(e) =>
                        updateItem(idx, "qty", parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                  {items.length > 1 && (
                    <button
                      onClick={() =>
                        setItems(items.filter((_, i) => i !== idx))
                      }
                      className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mb-[1px]"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setItems([...items, { name: "", qty: 1 }])}
              className="text-sm text-[#1a237e] font-bold flex items-center hover:underline mt-2"
            >
              <Plus size={16} className="mr-1" /> Thêm vật tư khác
            </button>

            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={handleGenerateQR}
                className="w-full bg-[#1a237e] text-white font-bold py-4 rounded-lg hover:bg-[#0d145e] shadow-md transition-all flex justify-center items-center"
              >
                <QrCode size={20} className="mr-2" /> TẠO MÃ QR MƯỢN ĐỒ
              </button>
            </div>
          </div>
        </div>

        {/* Cột QR Result */}
        <div className="w-full lg:w-80 bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-sm font-bold text-slate-500 uppercase mb-4">
            Mã QR Định danh
          </p>
          <div className="w-48 h-48 border-4 border-slate-100 rounded-lg mb-6 flex items-center justify-center text-slate-300 relative bg-slate-50">
            {qrGenerated ? (
              <div className="absolute inset-0 bg-white p-2">
                <div
                  className="w-full h-full border border-slate-900"
                  style={{
                    background:
                      "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 20px 20px",
                  }}
                ></div>
              </div>
            ) : (
              <QrCode size={64} className="opacity-30" />
            )}

            {qrConfirmed && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center flex-col animate-in zoom-in">
                <CheckCircle size={48} className="text-green-500 mb-2" />
                <span className="font-bold text-green-700 text-sm">
                  Đã Mượn
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-6 px-4">
            Mã QR bao gồm dữ liệu mượn đồ. Người mượn chỉ cần quét và ấn xác
            nhận.
          </p>
          <button
            onClick={handleConfirm}
            disabled={!qrGenerated || qrConfirmed}
            className={`px-8 py-3 rounded-full font-bold text-sm w-full transition-colors ${
              qrGenerated && !qrConfirmed
                ? "bg-green-500 text-white hover:bg-green-600 shadow-lg"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {qrConfirmed ? "ĐÃ XÁC NHẬN" : "XÁC NHẬN MƯỢN"}
          </button>
        </div>
      </div>
    </div>
  );
}
