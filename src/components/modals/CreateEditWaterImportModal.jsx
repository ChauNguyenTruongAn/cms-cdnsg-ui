import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, Save } from "lucide-react";
import { waterImportService } from "../../services/waterImportService";
import { useToast } from "../../context/ToastContext";
import SearchableSelect from "../common/SearchableSelect";

export default function CreateEditWaterImportModal({
  isOpen,
  onClose,
  importData,
  onSuccess,
}) {
  const { showToast } = useToast();
  const [zones, setZones] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    importDate: new Date().toISOString().split("T")[0],
    productionDate: "",
    shellQuantity: 0,
  });

  const [items, setItems] = useState([{ zoneId: "", quantity: 1 }]);

  useEffect(() => {
    if (isOpen) {
      // Load zones
      waterImportService
        .getZones()
        .then((res) => setZones(res.data || []))
        .catch(() => showToast("Không tải được danh sách khu vực!", "error"));

      if (importData) {
        // Edit mode: populate form
        setFormData({
          importDate: importData.importDate || "",
          productionDate: importData.productionDate || "",
          shellQuantity: importData.shellQuantity || 0,
        });

        const oldItems = importData.details || [];
        if (oldItems.length > 0) {
          setItems(
            oldItems.map((i) => ({
              zoneId: i.zoneId || "",
              quantity: i.quantity || 1,
            }))
          );
        } else {
          setItems([{ zoneId: "", quantity: 1 }]);
        }
      } else {
        // Create mode: reset form
        setFormData({
          importDate: new Date().toISOString().split("T")[0],
          productionDate: "",
          shellQuantity: 0,
        });
        setItems([{ zoneId: "", quantity: 1 }]);
      }
    }
  }, [isOpen, importData]);

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!formData.importDate)
      return showToast("Vui lòng chọn ngày nhập nước!", "error");
    if (items.some((i) => !i.zoneId || i.quantity <= 0))
      return showToast("Vui lòng kiểm tra lại danh sách khu vực và số lượng!", "error");

    setIsSaving(true);
    try {
      const totalQuantity = items.reduce((acc, curr) => acc + parseInt(curr.quantity || 0), 0);

      const payload = {
        importDate: formData.importDate,
        productionDate: formData.productionDate || null,
        shellQuantity: parseInt(formData.shellQuantity || 0),
        quantity: totalQuantity,
        details: items.map((i) => ({
          zoneId: parseInt(i.zoneId),
          quantity: parseInt(i.quantity),
        })),
      };

      if (importData) {
        await waterImportService.updateImport(importData.id, payload);
        showToast("Cập nhật phiếu nhập nước thành công!");
      } else {
        await waterImportService.createImport(payload);
        showToast("Thêm phiếu nhập nước thành công!");
      }

      onSuccess();
      onClose();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Lỗi khi lưu phiếu nhập nước!",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const zoneOptions = zones.map((z) => ({
    value: z.id,
    label: z.name,
  }));

  const computedTotal = items.reduce((acc, curr) => acc + parseInt(curr.quantity || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95">
        <div className="p-6 border-b bg-[#1a237e] text-white rounded-t-2xl flex justify-between items-center">
          <h3 className="text-xl font-bold uppercase tracking-tight">
            {importData ? `Cập Nhật Phiếu Nhập Nước #${importData.id}` : "Ghi Nhận Nhập Nước Về"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/20 rounded-lg hover:bg-white/40"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50 flex-1">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                Ngày nhập nước *
              </label>
              <input
                type="date"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.importDate}
                onChange={(e) =>
                  setFormData({ ...formData, importDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                Ngày sản xuất
              </label>
              <input
                type="date"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.productionDate}
                onChange={(e) =>
                  setFormData({ ...formData, productionDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                Số lượng vỏ bình trả lại/lưu
              </label>
              <input
                type="number"
                min="0"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                value={formData.shellQuantity}
                onChange={(e) =>
                  setFormData({ ...formData, shellQuantity: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase">
                Danh sách khu vực lưu trữ & Phân bổ số lượng
              </h4>
              <div className="text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                Tổng số lượng nhập: {computedTotal} bình
              </div>
            </div>
            {items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-3 items-end bg-slate-50 p-3 rounded-lg border border-slate-100"
              >
                <div className="flex-1 w-full relative z-[50]">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
                    Chọn khu vực lưu trữ (Kho/Khu vực)
                  </label>
                  <SearchableSelect
                    options={zoneOptions}
                    value={item.zoneId}
                    onChange={(val) => updateItem(index, "zoneId", val)}
                    placeholder="-- Chọn khu vực --"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
                    Số lượng bình
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-center font-bold"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, "quantity", parseInt(e.target.value) || 1)
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
                setItems([...items, { zoneId: "", quantity: 1 }])
              }
              className="text-sm font-bold text-indigo-600 flex items-center hover:underline"
            >
              <Plus size={16} className="mr-1" /> Thêm khu vực lưu trữ khác
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
            className="flex-1 py-3 bg-[#1a237e] text-white rounded-xl font-bold shadow-lg hover:bg-[#0d145e] flex justify-center items-center disabled:opacity-70 transition-all"
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <Save size={18} className="mr-2" />
            )}{" "}
            Lưu Thông Tin
          </button>
        </div>
      </div>
    </div>
  );
}
