import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Loader2,
  PackageSearch,
  FileText,
  ArrowRightLeft,
} from "lucide-react";
import { materialService } from "../../services/materialService";
import { receiptService } from "../../services/receiptService";
import { useToast } from "../../context/ToastContext";
import SearchableSelect from "../common/SearchableSelect";

export default function CreateReceiptModal({
  isOpen,
  onClose,
  type,
  onSuccess,
}) {
  const { showToast } = useToast();
  const isImport = type === "import";

  const [materials, setMaterials] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [receiptData, setReceiptData] = useState({
    date: new Date().toISOString().split("T")[0],
    invoiceCode: "", // TRƯỜNG MÃ HÓA ĐƠN SỬ DỤNG CHUNG
    note: "",
    department: "",
    recipient: "",
  });

  // Items State (Danh sách vật tư mảng động)
  const [items, setItems] = useState([{ materialId: "", quantity: 1 }]);

  useEffect(() => {
    if (isOpen) {
      materialService
        .getAllMaterials(0, 1000)
        .then((res) => {
          setMaterials(res.data.content || []);
        })
        .catch((e) => console.log(e));
    } else {
      // Reset form khi đóng
      setReceiptData({
        date: new Date().toISOString().split("T")[0],
        invoiceCode: "",
        note: "",
        department: "",
        recipient: "",
      });
      setItems([{ materialId: "", quantity: 1 }]);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!receiptData.date) return showToast("Vui lòng chọn ngày!", "error");
    if (!isImport && (!receiptData.department || !receiptData.recipient)) {
      return showToast("Vui lòng nhập Phòng ban và Người nhận!", "error");
    }

    const invalidItems = items.some(
      (item) => !item.materialId || item.quantity <= 0,
    );
    if (invalidItems)
      return showToast(
        "Vui lòng chọn vật tư và số lượng > 0 cho tất cả các dòng!",
        "error",
      );

    setIsSaving(true);
    try {
      const payload = isImport
        ? {
            importDate: receiptData.date,
            invoiceCode: receiptData.invoiceCode, // GỬI MÃ HÓA ĐƠN CHO PHIẾU NHẬP
            note: receiptData.note,
            importItemRequests: items.map((i) => ({
              materialId: parseInt(i.materialId),
              quantity: parseInt(i.quantity),
            })),
          }
        : {
            exportDate: receiptData.date,
            invoiceCode: receiptData.invoiceCode, // GỬI MÃ HÓA ĐƠN CHO PHIẾU XUẤT
            note: receiptData.note,
            department: receiptData.department,
            recipient: receiptData.recipient,
            exportItemRequests: items.map((i) => ({
              materialId: parseInt(i.materialId),
              quantity: parseInt(i.quantity),
            })),
          };

      if (isImport) await receiptService.createImport(payload);
      else await receiptService.createExport(payload);

      showToast(
        isImport ? "Tạo phiếu nhập thành công!" : "Tạo phiếu xuất thành công!",
      );
      onSuccess();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi lưu phiếu", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const materialOptions = materials.map((m) => ({
    value: m.id,
    label: `${m.name} (Kho: ${m.inventory} ${m.unit?.name || ""})`,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div
          className={`p-6 border-b flex justify-between items-center text-white ${
            isImport ? "bg-[#1a237e]" : "bg-amber-600"
          }`}
        >
          <h3 className="font-bold text-xl flex items-center">
            {isImport ? (
              <PackageSearch className="mr-2" size={24} />
            ) : (
              <ArrowRightLeft className="mr-2" size={24} />
            )}
            {isImport ? "Tạo Phiếu Nhập Kho" : "Tạo Phiếu Xuất Kho"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {/* Thông tin chung */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm uppercase flex items-center mb-4">
              <FileText size={16} className="mr-2 text-slate-400" /> Thông tin
              phiếu
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Ngày chứng từ *
                </label>
                <input
                  type="date"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  value={receiptData.date}
                  onChange={(e) =>
                    setReceiptData({ ...receiptData, date: e.target.value })
                  }
                />
              </div>

              {/* Ô MÃ HÓA ĐƠN HIỂN THỊ CHUNG CHO CẢ NHẬP VÀ XUẤT */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Mã Phiếu / Hóa đơn (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: PX-001..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  value={receiptData.invoiceCode}
                  onChange={(e) =>
                    setReceiptData({
                      ...receiptData,
                      invoiceCode: e.target.value,
                    })
                  }
                />
              </div>

              {!isImport && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Phòng ban yêu cầu *
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
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
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Người nhận *
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
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

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">
                Ghi chú thêm
              </label>
              <textarea
                rows="2"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                value={receiptData.note}
                onChange={(e) =>
                  setReceiptData({ ...receiptData, note: e.target.value })
                }
                placeholder="Nhập lý do xuất/nhập, thông tin liên quan..."
              />
            </div>
          </div>

          {/* Danh sách vật tư */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-800 text-sm uppercase flex items-center mb-4">
              <PackageSearch size={16} className="mr-2 text-slate-400" /> Danh
              sách vật tư
            </h4>
            <div className="space-y-3 mb-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl"
                >
                  <div className="flex-1 w-full relative z-50">
                    <SearchableSelect
                      options={materialOptions}
                      value={item.materialId}
                      onChange={(val) => {
                        const newItems = [...items];
                        newItems[index].materialId = val;
                        setItems(newItems);
                      }}
                      placeholder="Tìm chọn vật tư..."
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="number"
                      min="1"
                      className={`w-24 p-2.5 border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-2 ${
                        isImport
                          ? "focus:ring-indigo-500/50"
                          : "focus:ring-amber-500/50"
                      }`}
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].quantity =
                          parseInt(e.target.value) || 1;
                        setItems(newItems);
                      }}
                    />
                    <button
                      onClick={() =>
                        setItems(items.filter((_, i) => i !== index))
                      }
                      disabled={items.length === 1}
                      className="p-2.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
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
              className={`text-sm font-bold flex items-center px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors ${
                isImport ? "text-[#1a237e]" : "text-amber-600"
              }`}
            >
              <Plus size={16} className="mr-2" /> THÊM DÒNG VẬT TƯ
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-white rounded-b-3xl flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-1 py-3.5 text-white rounded-xl font-bold shadow-lg flex justify-center items-center disabled:opacity-70 transition-all ${
              isImport
                ? "bg-[#1a237e] hover:bg-[#0d145e] shadow-indigo-200"
                : "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
            }`}
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              "Xác nhận lưu phiếu"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
