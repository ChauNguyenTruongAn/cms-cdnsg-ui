import React, { useState, useEffect } from "react";
import { X, Save, Trash2, Loader2, Plus } from "lucide-react";
import { materialService } from "../../services/materialService";
import { receiptService } from "../../services/receiptService";
import { useToast } from "../../context/ToastContext";
import SearchableSelect from "../common/SearchableSelect"; // Thêm dòng này

export default function EditReceiptModal({
  isOpen,
  onClose,
  type,
  receiptData,
  onSuccess,
}) {
  const { showToast } = useToast();

  const [materials, setMaterials] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    date: "",
    note: "",
    department: "",
    recipient: "",
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (isOpen && receiptData) {
      // Load danh sách vật tư cho dropdown
      materialService
        .getAllMaterials(0, 1000)
        .then((res) => setMaterials(res.content || []));

      // Đổ dữ liệu phiếu cũ vào Form
      const isImport = type === "import";
      setFormData({
        date: isImport ? receiptData.importDate : receiptData.exportDate,
        note: receiptData.note || "",
        department: receiptData.department || "",
        recipient: receiptData.recipient || "",
      });

      // Đổ danh sách vật tư cũ vào Form
      const existingItems =
        (isImport ? receiptData.importItems : receiptData.exportItems) || [];
      setItems(
        existingItems.map((item) => ({
          materialId: item.material.id,
          quantity: item.quantity,
        })),
      );
    }
  }, [isOpen, receiptData]);

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!formData.date) return showToast("Vui lòng chọn ngày!", "error");
    if (items.some((i) => !i.materialId || i.quantity <= 0)) {
      return showToast("Vui lòng chọn vật tư và nhập số lượng > 0!", "error");
    }

    setIsSaving(true);
    try {
      const payload = { note: formData.note };

      if (type === "import") {
        payload.importDate = formData.date;
        payload.importItemRequests = items.map((i) => ({
          materialId: parseInt(i.materialId),
          quantity: parseInt(i.quantity),
        }));
        await receiptService.updateImport(receiptData.id, payload);
      } else {
        payload.exportDate = formData.date;
        payload.department = formData.department;
        payload.recipient = formData.recipient;
        payload.exportItemRequests = items.map((i) => ({
          materialId: parseInt(i.materialId),
          quantity: parseInt(i.quantity),
        }));
        await receiptService.updateExport(receiptData.id, payload);
      }

      showToast(
        `Cập nhật phiếu ${type === "import" ? "Nhập" : "Xuất"} thành công!`,
      );
      onSuccess();
      onClose();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Lỗi cập nhật phiếu!",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !receiptData) return null;
  const isImport = type === "import";

  // Map dữ liệu materials thành mảng { value, label } cho SearchableSelect
  const materialOptions = materials.map((m) => ({
    value: m.id,
    label: `${m.name} (Tồn kho: ${m.inventory} ${m.unit?.name || ""})`,
  }));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95">
        <div
          className={`p-6 border-b flex justify-between text-white rounded-t-2xl ${isImport ? "bg-[#1a237e]" : "bg-amber-600"}`}
        >
          <h3 className="font-bold">
            Chỉnh sửa Phiếu {isImport ? "Nhập" : "Xuất"} #{receiptData.id}
          </h3>
          <button onClick={onClose} className="p-1.5 bg-white/20 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50 flex-1">
          {/* Thông tin chung */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Ngày *
                </label>
                <input
                  type="date"
                  className="w-full p-3 bg-slate-50 border rounded-lg outline-none"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Ghi chú
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-50 border rounded-lg outline-none"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                />
              </div>
              {!isImport && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">
                      Phòng ban
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 bg-slate-50 border rounded-lg outline-none"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">
                      Người nhận
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 bg-slate-50 border rounded-lg outline-none"
                      value={formData.recipient}
                      onChange={(e) =>
                        setFormData({ ...formData, recipient: e.target.value })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Danh sách vật tư */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-3 items-end bg-slate-50 p-3 rounded-lg border"
              >
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 mb-2">
                    Tên vật tư
                  </label>
                  <SearchableSelect
                    options={materialOptions}
                    value={item.materialId}
                    onChange={(val) => updateItem(index, "materialId", val)}
                    placeholder="-- Tìm và chọn vật tư --"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-xs font-bold text-slate-500 mb-2">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full p-3 bg-white border rounded-lg outline-none text-center"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, "quantity", e.target.value)
                    }
                  />
                </div>
                <button
                  onClick={() => setItems(items.filter((_, i) => i !== index))}
                  disabled={items.length === 1}
                  className="p-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 disabled:opacity-50 mb-[1px]"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setItems([...items, { materialId: "", quantity: 1 }])
              }
              className={`text-sm font-bold flex items-center hover:underline ${isImport ? "text-[#1a237e]" : "text-amber-600"}`}
            >
              <Plus size={16} className="mr-1" /> Thêm vật tư
            </button>
          </div>
        </div>

        <div className="p-6 border-t bg-white rounded-b-2xl flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-1 py-3.5 text-white rounded-xl font-bold flex justify-center items-center ${isImport ? "bg-[#1a237e]" : "bg-amber-600"}`}
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <Save size={18} className="mr-2" />
            )}
            Lưu Thay Đổi
          </button>
        </div>
      </div>
    </div>
  );
}
