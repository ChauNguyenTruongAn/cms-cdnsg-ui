import React, { useState } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "../../context/ToastContext";
import { borrowReturnService } from "../../services/borrowReturnService";

export default function CreateBorrowModal({ onClose, onReload }) {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState(null);

  const [formData, setFormData] = useState({
    items: [{ itemName: "", quantity: 1 }], // Mảng chứa nhiều vật phẩm
    borrowerName: "",
    department: "",
  });

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: "", quantity: 1 }],
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSave = async () => {
    const isItemsValid = formData.items.every(
      (item) => item.itemName.trim() !== "" && item.quantity > 0,
    );
    if (!isItemsValid || !formData.borrowerName || !formData.department) {
      return showToast("Vui lòng điền đầy đủ thông tin", "error");
    }

    setIsSaving(true);
    try {
      const res = await borrowReturnService.createTicket(formData);
      setGeneratedTicket(res);
      onReload();
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi tạo phiếu", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="p-5 border-b flex justify-between items-center bg-[#1a237e] text-white">
          <h3 className="font-bold text-lg">
            {generatedTicket ? "Quét mã để Xác nhận" : "Tạo Phiếu Mượn"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-xl"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 bg-slate-50 flex-1 overflow-y-auto max-h-[70vh]">
          {generatedTicket ? (
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm inline-block border-2 border-indigo-100">
                <QRCodeSVG
                  value={`${window.location.origin}/scan-borrow?code=${generatedTicket.borrowCode}`}
                  size={220}
                  level="H"
                />
              </div>
              <p className="text-slate-600 font-medium">
                Yêu cầu người mượn quét mã này.
              </p>
              <div className="pt-4 border-t border-slate-200">
                <p className="font-bold text-2xl text-[#1a237e]">
                  {generatedTicket.borrowCode}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Danh sách vật phẩm *
                  </label>
                  <button
                    onClick={handleAddItem}
                    className="flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Plus size={14} className="mr-1" /> Thêm món
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-2 animate-in slide-in-from-right-2"
                    >
                      <input
                        type="text"
                        placeholder="Tên vật phẩm..."
                        className="flex-1 p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50"
                        value={item.itemName}
                        onChange={(e) =>
                          handleItemChange(index, "itemName", e.target.value)
                        }
                      />
                      <input
                        type="number"
                        min="1"
                        className="w-20 p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-center"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 1,
                          )
                        }
                      />
                      <button
                        onClick={() => handleRemoveItem(index)}
                        disabled={formData.items.length === 1}
                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl disabled:opacity-0 transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Phòng ban *
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Người mượn *
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={formData.borrowerName}
                    onChange={(e) =>
                      setFormData({ ...formData, borrowerName: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {!generatedTicket && (
          <div className="p-4 border-t bg-white flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 bg-[#1a237e] text-white font-bold rounded-xl flex justify-center items-center hover:bg-[#0d145e] transition-colors disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : "Tạo Mã QR"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
