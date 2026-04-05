import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Calendar,
  CalendarClock,
  StickyNote,
  Loader2,
} from "lucide-react";
import { fireExtinguisherService } from "../../services/fireExtinguisherService";
import { useToast } from "../../context/ToastContext";

export default function RechargeExtinguisherModal({
  isOpen,
  onClose,
  onSuccess,
  target,
}) {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // target = { type: 'single', id: 1, name: 'Bình CO2...' }
  // HOẶC target = { type: 'zone', id: 1, name: 'Khu A...' }

  const [formData, setFormData] = useState({
    rechargeDate: new Date().toISOString().split("T")[0],
    nextRechargeDate: "",
    note: "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        rechargeDate: new Date().toISOString().split("T")[0],
        nextRechargeDate: "",
        note: "",
      });
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!formData.rechargeDate)
      return showToast("Vui lòng chọn ngày nạp thực tế!", "error");

    setIsSaving(true);
    try {
      const payload = {
        rechargeDate: formData.rechargeDate,
        nextRechargeDate: formData.nextRechargeDate || null,
        note: formData.note,
      };

      if (target.type === "single") {
        await fireExtinguisherService.recharge(target.id, payload);
        showToast("Đã ghi nhận nạp bình thành công!");
      } else if (target.type === "zone") {
        await fireExtinguisherService.rechargeByZone(target.id, payload);
        showToast(`Đã nạp toàn bộ bình trong ${target.name} thành công!`);
      }
      onSuccess();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi khi nạp bình!", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !target) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
        <div className="p-6 border-b flex justify-between items-center bg-indigo-50/50 rounded-t-2xl">
          <h3 className="text-xl font-bold text-slate-800">
            {target.type === "zone"
              ? "Nạp hàng loạt theo Khu"
              : "Ghi nhận nạp bình"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 rounded-lg border"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-100">
            Mục tiêu: <strong>{target.name}</strong>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center">
              <Calendar size={14} className="mr-1.5" /> Ngày nạp thực tế *
            </label>
            <input
              type="date"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.rechargeDate}
              onChange={(e) =>
                setFormData({ ...formData, rechargeDate: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center">
              <CalendarClock size={14} className="mr-1.5" /> Hạn nạp tiếp theo
              (Tùy chọn)
            </label>
            <input
              type="date"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.nextRechargeDate}
              onChange={(e) =>
                setFormData({ ...formData, nextRechargeDate: e.target.value })
              }
            />
            <p className="text-[11px] text-slate-400 mt-1 italic">
              *Bỏ trống hệ thống sẽ tự cộng thêm 6 tháng
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center">
              <StickyNote size={14} className="mr-1.5" /> Ghi chú
            </label>
            <input
              type="text"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              placeholder="VD: Nạp định kỳ, thay van..."
            />
          </div>
        </div>

        <div className="p-5 border-t bg-slate-50 rounded-b-2xl flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border text-slate-600 rounded-xl font-bold hover:bg-slate-50"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 flex justify-center items-center shadow-lg shadow-emerald-100 disabled:opacity-70 transition-all"
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <Save size={18} className="mr-2" />
            )}
            Xác nhận nạp
          </button>
        </div>
      </div>
    </div>
  );
}
