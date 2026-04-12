import React, { useState } from "react";
import { X, Loader2, Save, ChevronDown } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { borrowReturnService } from "../../services/borrowReturnService";

export default function EditBorrowModal({ ticket, onClose, onReload }) {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    borrowerName: ticket.borrowerName || "",
    department: ticket.department || "",
    status: ticket.status,
    note: ticket.note || "",
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await borrowReturnService.updateTicket(ticket.id, formData);
      showToast("Cập nhật phiếu thành công!");
      onReload();
      onClose();
    } catch (error) {
      showToast("Lỗi khi cập nhật phiếu", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="p-5 border-b flex justify-between items-center bg-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center">
            Chỉnh sửa phiếu {ticket.borrowCode}
            <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium">
              {ticket.itemName}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-xl"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 bg-white space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Người mượn
            </label>
            <input
              type="text"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50"
              value={formData.borrowerName}
              onChange={(e) =>
                setFormData({ ...formData, borrowerName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Phòng ban
            </label>
            <input
              type="text"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Trạng thái
            </label>
            <div className="relative group">
              <select
                className="w-full appearance-none p-3.5 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-semibold cursor-pointer transition-all hover:bg-slate-100/50 shadow-sm"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="NEW" className="font-medium text-slate-700">
                  Chờ xác nhận
                </option>
                <option value="BORROWED" className="font-medium text-slate-700">
                  Đang mượn
                </option>
                <option
                  value="COMPLETED"
                  className="font-medium text-slate-700"
                >
                  Đã trả đủ
                </option>
                <option
                  value="INCOMPLETE"
                  className="font-medium text-slate-700"
                >
                  Trả thiếu
                </option>
              </select>

              {/* Icon mũi tên custom thay thế cho mũi tên mặc định của trình duyệt */}
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-600 transition-colors">
                <ChevronDown size={20} strokeWidth={2.5} />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Ghi chú (Nội bộ)
            </label>
            <textarea
              rows="2"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50"
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
            />
          </div>
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#1a237e] text-white font-bold rounded-xl flex items-center hover:bg-[#0d145e]"
          >
            {isSaving ? (
              <Loader2 className="animate-spin mr-2" size={18} />
            ) : (
              <Save className="mr-2" size={18} />
            )}{" "}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
