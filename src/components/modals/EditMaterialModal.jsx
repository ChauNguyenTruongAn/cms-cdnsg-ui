// src/components/modals/EditMaterialModal.jsx
import React, { useState, useEffect } from "react";
import { X, Edit, Loader2 } from "lucide-react";
import { materialService } from "../../services/materialService";
import { useToast } from "../../context/ToastContext";

export default function EditMaterialModal({
  isOpen,
  onClose,
  material,
  units,
  onSave,
}) {
  const { showToast } = useToast();

  // State quản lý form nội bộ
  const [formData, setFormData] = useState({ name: "", unit_id: "" });
  const [isSaving, setIsSaving] = useState(false);

  // useEffect này cực kỳ quan trọng:
  // Mỗi khi prop `material` thay đổi (khi người dùng ấn nút Sửa ở dòng khác),
  // chúng ta cần cập nhật lại dữ liệu vào form state.
  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name || "",
        unit_id: material.unit?.id || "", // Lấy ID của đơn vị hiện tại
      });
    }
  }, [material]);

  const handleSaveChanges = async () => {
    // Validate cơ bản
    if (!formData.name || !formData.unit_id) {
      showToast("Tên và đơn vị không được để trống!", "error");
      return;
    }

    setIsSaving(true);
    try {
      // Gọi API cập nhật từ service
      await materialService.updateMaterial(material.id, {
        name: formData.name,
        unit_id: parseInt(formData.unit_id), // Đảm bảo chuyển về kiểu Number
      });

      showToast("Cập nhật thông tin vật tư thành công!");
      onSave(); // Báo cho component cha biết để fetchData lại
      onClose(); // Đóng modal
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      showToast(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật!",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Nếu modal không được mở, không render gì cả
  if (!isOpen || !material) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      {/* Container Modal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 flex items-center">
            <Edit className="mr-3 text-amber-500" size={22} />
            Chỉnh sửa Vật tư
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Modal - Form */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
              ID Vật tư
            </label>
            <input
              type="text"
              className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-mono text-sm"
              value={material.id}
              disabled
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
              Tên vật tư <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Nhập tên vật tư..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all text-slate-800"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
              Đơn vị tính <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all appearance-none text-slate-800"
                value={formData.unit_id}
                onChange={(e) =>
                  setFormData({ ...formData, unit_id: e.target.value })
                }
              >
                <option value="" disabled>
                  -- Chọn đơn vị tính --
                </option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              {/* Icon mũi tên custom cho select */}
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-sm flex items-start">
            <AlertCircle size={18} className="mr-2.5 mt-0.5 shrink-0" />
            <p>
              Lưu ý: Chỉ có thể chỉnh sửa Tên và Đơn vị. Số lượng tồn kho (
              {material.inventory}) được quản lý qua phiếu nhập/xuất.
            </p>
          </div>
        </div>

        {/* Footer Modal - Buttons */}
        <div className="p-6 border-t border-slate-100 flex space-x-3 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-3.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors disabled:opacity-60"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="flex-1 px-4 py-3.5 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all transform active:scale-95 flex justify-center items-center disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Thêm icon phụ cho thông báo
const AlertCircle = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
