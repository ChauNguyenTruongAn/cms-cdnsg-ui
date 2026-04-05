import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, Save } from "lucide-react";
import { uniformService } from "../../services/uniformService";
import { useToast } from "../../context/ToastContext";
import SearchableSelect from "../common/SearchableSelect";

export default function CreateUniformImportModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  const { showToast } = useToast();
  const [uniforms, setUniforms] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    nameResponse: "",
    note: "",
  });

  const [items, setItems] = useState([{ uniformId: "", quantity: 1 }]);

  useEffect(() => {
    if (isOpen) {
      uniformService
        .getAllUniforms(0, 1000)
        .then((res) => setUniforms(res.content || []))
        .catch(() => showToast("Không thể tải danh sách đồng phục", "error"));

      setItems([{ uniformId: "", quantity: 1 }]);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        nameResponse: "",
        note: "",
      });
    }
  }, [isOpen]);

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!formData.nameResponse)
      return showToast("Vui lòng nhập tên người giao/NCC!", "error");
    if (items.some((i) => !i.uniformId || i.quantity <= 0))
      return showToast("Vui lòng chọn đầy đủ đồng phục và số lượng!", "error");

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        details: items.map((i) => ({
          uniformId: parseInt(i.uniformId),
          quantity: parseInt(i.quantity),
        })),
      };
      await uniformService.createImport(payload); //
      showToast("Tạo phiếu nhập kho thành công!");
      onSuccess();
      onClose();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Lỗi khi tạo phiếu nhập!",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const uniformOptions = uniforms.map((u) => ({
    value: u.id,
    label: `${u.type} - Size: ${u.size} (Tồn: ${u.stock})`,
  }));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95">
        <div className="p-6 border-b bg-emerald-600 text-white rounded-t-2xl flex justify-between items-center">
          <h3 className="text-xl font-bold">Tạo Phiếu Nhập Kho Đồng Phục</h3>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/20 rounded-lg hover:bg-white/40"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50 flex-1">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase border-b pb-2 mb-2">
                Thông tin chung
              </h4>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                Ngày nhập *
              </label>
              <input
                type="date"
                className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                Người giao / Nhà cung cấp *
              </label>
              <input
                type="text"
                className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Nhập tên..."
                value={formData.nameResponse}
                onChange={(e) =>
                  setFormData({ ...formData, nameResponse: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-2">
                Ghi chú phiếu nhập
              </label>
              <input
                type="text"
                className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Lý do nhập kho..."
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
              />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase border-b pb-2">
              Danh sách mặt hàng nhập
            </h4>
            {items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-3 items-end bg-slate-50 p-3 rounded-lg border border-slate-100"
              >
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
                    Loại đồng phục & Size
                  </label>
                  <SearchableSelect
                    options={uniformOptions}
                    value={item.uniformId}
                    onChange={(val) => updateItem(index, "uniformId", val)}
                    placeholder="-- Chọn đồng phục --"
                  />
                </div>
                <div className="w-full sm:w-28">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full p-2.5 bg-white border rounded-lg outline-none text-center"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, "quantity", e.target.value)
                    }
                  />
                </div>
                <button
                  onClick={() => setItems(items.filter((_, i) => i !== index))}
                  disabled={items.length === 1}
                  className="p-2.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 disabled:opacity-30"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setItems([...items, { uniformId: "", quantity: 1 }])
              }
              className="text-sm font-bold text-emerald-600 flex items-center hover:underline"
            >
              <Plus size={16} className="mr-1" /> Thêm dòng mới
            </button>
          </div>
        </div>

        <div className="p-6 border-t bg-white rounded-b-2xl flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 flex justify-center items-center disabled:opacity-70 transition-all"
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <Save size={18} className="mr-2" />
            )}{" "}
            Lưu Phiếu Nhập
          </button>
        </div>
      </div>
    </div>
  );
}
