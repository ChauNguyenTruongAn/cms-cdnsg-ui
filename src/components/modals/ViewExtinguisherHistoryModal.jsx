import React, { useState, useEffect } from "react";
import {
  X,
  RefreshCw,
  Loader2,
  CalendarClock,
  Target,
  StickyNote,
} from "lucide-react";
import { fireExtinguisherService } from "../../services/fireExtinguisherService";
import { useToast } from "../../context/ToastContext";

export default function ViewExtinguisherHistoryModal({
  isOpen,
  onClose,
  extinguisherId,
  locationName,
}) {
  const { showToast } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Khi modal mở, gọi API lấy lịch sử nạp của bình này
  useEffect(() => {
    if (isOpen && extinguisherId) {
      setLoading(true);
      fireExtinguisherService
        .getHistory(extinguisherId)
        .then((res) => setHistory(res || []))
        .catch(() => showToast("Lỗi tải lịch sử nạp bình", "error"))
        .finally(() => setLoading(false));
    }
  }, [isOpen, extinguisherId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-indigo-50/50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <RefreshCw size={24} className="text-emerald-500" />
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                Lịch sử nạp bình PCCC
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Vị trí:{" "}
                <span className="font-bold text-indigo-700">
                  {locationName}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/50 hover:bg-white text-slate-500 rounded-lg transition-colors border"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body - Bảng lịch sử dữ liệu từ ExtinguisherHistory.java */}
        <div className="p-6 overflow-y-auto max-h-[60vh] bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Loader2
                size={32}
                className="animate-spin text-indigo-500 mb-2"
              />
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 text-slate-400 italic bg-white rounded-xl border">
              Chưa có ghi nhận lịch sử nạp bình nào cho vị trí này.
            </div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3 border-b border-slate-100 text-center">
                      STT
                    </th>
                    <th className="px-5 py-3 border-b border-slate-100">
                      {/* Di chuyển flex vào một div bên trong th để giữ cấu trúc bảng */}
                      <div className="flex items-center">
                        <CalendarClock
                          size={12}
                          className="mr-1.5 text-slate-400"
                        />{" "}
                        Ngày thực hiện
                      </div>
                    </th>
                    <th className="px-5 py-3 border-b border-slate-100">
                      <div className="flex items-center">
                        <Target size={12} className="mr-1.5 text-slate-400" />{" "}
                        Hạn nạp tới
                      </div>
                    </th>
                    <th className="px-5 py-3 border-b border-slate-100">
                      <div className="flex items-center">
                        <StickyNote
                          size={12}
                          className="mr-1.5 text-slate-400"
                        />{" "}
                        Ghi chú
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-4 text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {item.rechargeDate}
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-600">
                        {item.nextRechargeDate}
                      </td>
                      <td className="px-5 py-4 text-slate-600 italic">
                        {item.note || "Nạp định kỳ"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white rounded-b-2xl flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}
