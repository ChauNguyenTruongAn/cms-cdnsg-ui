import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, Scaling } from "lucide-react";
import { materialService } from "../../services/materialService";
import { useToast } from "../../context/ToastContext";

export default function UnitManagerModal({ isOpen, onClose }) {
  const { showToast } = useToast();
  const [units, setUnits] = useState([]);
  const [newUnitName, setNewUnitName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) fetchUnits();
  }, [isOpen]);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await materialService.getAllUnits();
      setUnits(res || []);
    } catch (error) {
      showToast("Lỗi tải danh sách Đơn vị tính", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) return;
    setIsSaving(true);
    try {
      await materialService.createUnit({ name: newUnitName });
      showToast("Đã thêm Đơn vị tính mới!");
      setNewUnitName("");
      fetchUnits();
    } catch (error) {
      showToast("Đơn vị này đã tồn tại hoặc có lỗi xảy ra", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUnit = async (id) => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa đơn vị tính này? (Sẽ lỗi nếu đang có Vật tư dùng đơn vị này)",
      )
    ) {
      try {
        await materialService.deleteUnit(id);
        showToast("Đã xóa Đơn vị tính!");
        fetchUnits();
      } catch (error) {
        showToast(
          "Không thể xóa do đang có Vật tư sử dụng đơn vị này!",
          "error",
        );
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center">
            <Scaling className="mr-2 text-indigo-600" /> Quản lý Đơn Vị Tính
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-white border hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              placeholder="Nhập đơn vị mới (Cái, Chiếc, Bộ...)"
              className="flex-1 p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
            />
            <button
              onClick={handleAddUnit}
              disabled={isSaving || !newUnitName.trim()}
              className="bg-indigo-600 text-white px-5 rounded-xl font-bold hover:bg-indigo-700 flex items-center disabled:opacity-50 transition-colors shadow-md"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Plus size={18} />
              )}
            </button>
          </div>

          <div className="mt-4 border border-slate-100 rounded-xl max-h-60 overflow-y-auto">
            {loading ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={24} />
              </div>
            ) : (
              units.map((u) => (
                <div
                  key={u.id}
                  className="flex justify-between items-center p-3 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-700 text-sm">
                    {u.name}
                  </span>
                  <button
                    onClick={() => handleDeleteUnit(u.id)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    title="Xóa đơn vị"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
            {!loading && units.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-6">
                Chưa có đơn vị tính nào.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
