import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, PackageSearch } from "lucide-react";
import { materialService } from "../../services/materialService";
import { receiptService } from "../../services/receiptService";
import { useToast } from "../../context/ToastContext";

import SearchableSelect from "../common/SearchableSelect"; // Thêm dòng này

export default function CreateReceiptModal({
  isOpen,
  onClose,
  type,
  onSuccess,
}) {
  const { showToast } = useToast();

  const [materials, setMaterials] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [receiptData, setReceiptData] = useState({
    date: new Date().toISOString().split("T")[0], // Mặc định hôm nay YYYY-MM-DD
    note: "",
    department: "",
    recipient: "",
  });

  // Items State (Danh sách vật tư mảng động)
  const [items, setItems] = useState([{ materialId: "", quantity: 1 }]);

  useEffect(() => {
    if (isOpen) {
      // Tải danh sách vật tư không phân trang (size lớn) để làm Dropdown
      materialService
        .getAllMaterials(0, 1000)
        .then((res) => {
          setMaterials(res.content || []);
        })
        .catch((e) => console.error("Lỗi lấy vật tư", e));

      // Reset form mỗi khi mở lại
      setItems([{ materialId: "", quantity: 1 }]);
      setReceiptData({
        date: new Date().toISOString().split("T")[0],
        note: "",
        department: "",
        recipient: "",
      });
    }
  }, [isOpen]);

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSave = async () => {
    // Validate
    if (!receiptData.date) return showToast("Vui lòng chọn ngày!", "error");
    if (items.some((i) => !i.materialId || i.quantity <= 0)) {
      return showToast(
        "Vui lòng chọn vật tư và nhập số lượng > 0 cho tất cả các dòng!",
        "error",
      );
    }

    setIsSaving(true);
    try {
      // Map JSON khớp hoàn toàn với API Backend
      const payload = {
        note: receiptData.note,
      };

      if (type === "import") {
        payload.importDate = receiptData.date;
        payload.importItemRequests = items.map((i) => ({
          materialId: parseInt(i.materialId),
          quantity: parseInt(i.quantity),
        }));
        await receiptService.createImport(payload);
      } else {
        payload.exportDate = receiptData.date;
        payload.department = receiptData.department;
        payload.recipient = receiptData.recipient;
        payload.exportItemRequests = items.map((i) => ({
          materialId: parseInt(i.materialId),
          quantity: parseInt(i.quantity),
        }));
        await receiptService.createExport(payload);
      }

      showToast(`Tạo phiếu ${type === "import" ? "Nhập" : "Xuất"} thành công!`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      showToast(
        error.response?.data?.message || "Có lỗi xảy ra khi lưu phiếu!",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;
  const isImport = type === "import";

  const materialOptions = materials.map((m) => ({
    value: m.id,
    label: `${m.name} (Tồn kho: ${m.inventory} ${m.unit?.name || ""})`,
  }));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`p-6 border-b flex items-center justify-between text-white rounded-t-2xl ${isImport ? "bg-[#1a237e]" : "bg-amber-600"}`}
        >
          <h3 className="text-xl font-bold">
            {isImport ? "Tạo Phiếu Nhập Kho" : "Tạo Phiếu Xuất Kho"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/20 rounded-lg hover:bg-white/40 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50 flex-1">
          {/* Thông tin chung */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm uppercase flex items-center border-b border-slate-100 pb-2">
              Thông tin phiếu
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Ngày {isImport ? "nhập" : "xuất"} *
                </label>
                <input
                  type="date"
                  className="w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#1a237e] outline-none"
                  value={receiptData.date}
                  onChange={(e) =>
                    setReceiptData({ ...receiptData, date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Ghi chú
                </label>
                <input
                  type="text"
                  placeholder="Lý do..."
                  className="w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#1a237e] outline-none"
                  value={receiptData.note}
                  onChange={(e) =>
                    setReceiptData({ ...receiptData, note: e.target.value })
                  }
                />
              </div>

              {!isImport && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">
                      Phòng ban yêu cầu
                    </label>
                    <input
                      type="text"
                      placeholder="VD: P. Đào tạo"
                      className="w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 outline-none"
                      value={receiptData.department}
                      onChange={(e) =>
                        setReceiptData({
                          ...receiptData,
                          department: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">
                      Người nhận
                    </label>
                    <input
                      type="text"
                      placeholder="Tên người nhận..."
                      className="w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 outline-none"
                      value={receiptData.recipient}
                      onChange={(e) =>
                        setReceiptData({
                          ...receiptData,
                          recipient: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Danh sách vật tư (Master - Detail) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm uppercase flex items-center border-b border-slate-100 pb-2">
              Danh sách vật tư giao dịch
            </h4>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row gap-3 items-end bg-slate-50 p-3 rounded-lg border border-slate-100"
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
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-center"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", e.target.value)
                      }
                    />
                  </div>
                  <div className="w-full sm:w-auto flex justify-end">
                    <button
                      onClick={() =>
                        setItems(items.filter((_, i) => i !== index))
                      }
                      disabled={items.length === 1}
                      className="p-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 disabled:opacity-50 transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() =>
                setItems([...items, { materialId: "", quantity: 1 }])
              }
              className={`text-sm font-bold flex items-center hover:underline ${isImport ? "text-[#1a237e]" : "text-amber-600"}`}
            >
              <Plus size={16} className="mr-1" /> Thêm dòng vật tư
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-white rounded-b-2xl flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-1 py-3.5 text-white rounded-xl font-bold shadow-lg flex justify-center items-center disabled:opacity-70 transition-all ${isImport ? "bg-[#1a237e] hover:bg-[#0d145e]" : "bg-amber-600 hover:bg-amber-700"}`}
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <PackageSearch size={18} className="mr-2" />
            )}
            {isSaving ? "Đang xử lý..." : "Lưu Phiếu"}
          </button>
        </div>
      </div>
    </div>
  );
}
