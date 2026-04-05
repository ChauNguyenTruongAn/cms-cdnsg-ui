import React, { useState, useEffect } from "react";
import {
  X,
  BarChart3,
  Loader2,
  CalendarClock,
  ShieldAlert,
} from "lucide-react";
import { fireExtinguisherService } from "../../services/fireExtinguisherService";
import { useToast } from "../../context/ToastContext";

export default function AdvancedStatsModal({ isOpen, onClose }) {
  const { showToast } = useToast();
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAdvancedStats();
    }
  }, [isOpen]);

  const fetchAdvancedStats = async () => {
    setLoading(true);
    try {
      const res = await fireExtinguisherService.getAdvancedStats();
      setStatsData(res || []);
    } catch (e) {
      showToast("Lỗi tải dữ liệu thống kê", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-in zoom-in-95 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-indigo-50/50 rounded-t-2xl">
          <h3 className="text-xl font-bold text-slate-800 flex items-center">
            <BarChart3 size={24} className="mr-3 text-indigo-600" />
            Thống kê chi tiết theo Khu vực
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-white border hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Loader2
                size={32}
                className="animate-spin text-indigo-500 mb-2"
              />
              <p>Đang tổng hợp số liệu...</p>
            </div>
          ) : statsData.length === 0 ? (
            <div className="text-center py-16 text-slate-400 italic bg-white rounded-xl border">
              Chưa có dữ liệu thống kê.
            </div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-4 border-b border-slate-200">
                      Khu vực
                    </th>
                    <th className="px-5 py-4 border-b border-slate-200">
                      Loại bình
                    </th>
                    <th className="px-5 py-4 border-b border-slate-200 text-center">
                      Tổng số lượng
                    </th>
                    <th className="px-5 py-4 border-b border-slate-200">
                      Ngày nạp gần nhất
                    </th>
                    <th className="px-5 py-4 border-b border-slate-200">
                      Hạn nạp tới (Sớm nhất)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statsData.map((item, idx) => {
                    // Logic kiểm tra xem hạn nạp tới có đang bị quá hạn không (so với ngày hôm nay)
                    const isExpired =
                      item.minNextRechargeDate &&
                      new Date(item.minNextRechargeDate) < new Date();

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-5 py-4 font-bold text-slate-800 border-r border-slate-50 bg-slate-50/50">
                          {item.zoneName}
                        </td>
                        <td className="px-5 py-4 font-semibold text-indigo-700">
                          {item.type}
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-center text-lg text-slate-700">
                          {item.totalQuantity}
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {item.maxLastRechargeDate || "---"}
                        </td>
                        <td className="px-5 py-4">
                          {item.minNextRechargeDate ? (
                            <span
                              className={`inline-flex items-center font-bold ${isExpired ? "text-red-600" : "text-emerald-600"}`}
                            >
                              {isExpired ? (
                                <ShieldAlert size={14} className="mr-1.5" />
                              ) : (
                                <CalendarClock size={14} className="mr-1.5" />
                              )}
                              {item.minNextRechargeDate}
                            </span>
                          ) : (
                            <span className="text-slate-400">---</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            Đóng bảng thống kê
          </button>
        </div>
      </div>
    </div>
  );
}
