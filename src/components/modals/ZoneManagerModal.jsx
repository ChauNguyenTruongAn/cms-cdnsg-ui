import React, { useState, useEffect } from "react";
import { X, Plus, Edit2, Trash2, Map, Loader2, Save } from "lucide-react";
import { waterImportService } from "../../services/waterImportService";
import { useToast } from "../../context/ToastContext";

export default function ZoneManagerModal({ isOpen, onClose, onChange }) {
  const { showToast } = useToast();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Input fields
  const [zoneInput, setZoneInput] = useState({ id: null, name: "", description: "" });

  useEffect(() => {
    if (isOpen) {
      fetchZones();
      setZoneInput({ id: null, name: "", description: "" });
    }
  }, [isOpen]);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await waterImportService.getZones();
      setZones(res.data || []);
    } catch (e) {
      showToast("Lỗi tải danh sách Khu vực", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!zoneInput.name.trim()) {
      return showToast("Vui lòng nhập tên khu vực!", "error");
    }
    setIsSaving(true);
    try {
      if (zoneInput.id) {
        await waterImportService.updateZone(zoneInput.id, {
          name: zoneInput.name.trim(),
          description: zoneInput.description.trim(),
        });
        showToast("Đã cập nhật Khu vực!");
      } else {
        await waterImportService.createZone({
          name: zoneInput.name.trim(),
          description: zoneInput.description.trim(),
        });
        showToast("Đã thêm Khu vực mới!");
      }
      setZoneInput({ id: null, name: "", description: "" });
      fetchZones();
      if (onChange) onChange(); // Notify parent of modifications
    } catch (e) {
      showToast("Lỗi khi lưu Khu vực", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khu vực này? Dữ liệu nhập nước liên quan có thể bị ảnh hưởng.")) {
      try {
        await waterImportService.deleteZone(id);
        fetchZones();
        showToast("Đã xóa Khu vực");
        if (onChange) onChange(); // Notify parent of modifications
      } catch (e) {
        showToast("Không thể xóa: Khu vực này đang chứa dữ liệu!", "error");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <Map size={20} className="mr-2 text-indigo-600" /> Quản lý Khu Vực (Kho lưu trữ)
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          {/* Form */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wide">
              {zoneInput.id ? "Cập nhật khu vực" : "Thêm khu vực mới"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Tên khu vực *</label>
                <input
                  type="text"
                  placeholder="VD: Kho A, Văn phòng lầu 2..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                  value={zoneInput.name}
                  onChange={(e) => setZoneInput({ ...zoneInput, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Mô tả thêm</label>
                <input
                  type="text"
                  placeholder="Mô tả vị trí hoặc ghi chú..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                  value={zoneInput.description}
                  onChange={(e) => setZoneInput({ ...zoneInput, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {zoneInput.id && (
                <button
                  onClick={() => setZoneInput({ id: null, name: "", description: "" })}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 text-sm hover:bg-slate-50 font-semibold"
                >
                  Hủy sửa
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-75 flex items-center gap-1 shadow"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : zoneInput.id ? (
                  <Save size={16} />
                ) : (
                  <Plus size={16} />
                )}
                {zoneInput.id ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>

          {/* List Zones */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50/50 border-b border-slate-100 font-bold text-xs text-slate-500 uppercase tracking-wide">
              Danh sách khu vực hiện có
            </div>
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {loading && zones.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <Loader2 size={24} className="animate-spin mx-auto text-indigo-600 mb-2" />
                  Đang tải danh sách khu vực...
                </div>
              ) : zones.length === 0 ? (
                <div className="p-6 text-center text-slate-400 italic text-sm">
                  Chưa có khu vực nào được cấu hình.
                </div>
              ) : (
                zones.map((z) => (
                  <div key={z.id} className="flex justify-between items-center p-3.5 hover:bg-slate-50/50 transition-colors">
                    <div>
                      <span className="font-bold text-slate-700 text-sm">{z.name}</span>
                      {z.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{z.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => setZoneInput(z)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(z.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-100 transition-colors text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
