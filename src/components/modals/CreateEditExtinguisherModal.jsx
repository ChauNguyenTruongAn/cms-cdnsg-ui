import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  MapPin,
  Shirt,
  Hash,
  Weight,
  LayoutDashboard,
  Loader2,
  StickyNote,
  Box,
} from "lucide-react";
import { fireExtinguisherService } from "../../services/fireExtinguisherService";
import { useToast } from "../../context/ToastContext";

export default function CreateEditExtinguisherModal({
  isOpen,
  onClose,
  onSuccess,
  editData,
}) {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [zones, setZones] = useState([]);
  const [locations, setLocations] = useState([]);

  // Bổ sung zoneId vào state để UI điều khiển Dropdown, nhưng formData gửi lên backend chỉ cần locationId
  const [zoneId, setZoneId] = useState("");
  const [formData, setFormData] = useState({
    locationId: "",
    type: "",
    weight: "",
    quantity: 1,
    unit: "Bình",
    note: "",
  });

  // 1. Load Zones khi mở modal
  useEffect(() => {
    if (isOpen) {
      fireExtinguisherService
        .getZones()
        .then((res) => setZones(res.data || []))
        .catch(() => showToast("Lỗi tải danh sách Khu vực", "error"));
    }
  }, [isOpen]);

  // 2. Load Locations khi zoneId thay đổi
  useEffect(() => {
    if (zoneId) {
      fireExtinguisherService
        .getLocationsByZone(zoneId)
        .then((res) => setLocations(res.data || []))
        .catch(() => showToast("Lỗi tải danh sách Vị trí", "error"));
    } else {
      setLocations([]);
    }
  }, [zoneId]);

  // 3. Khởi tạo dữ liệu khi mở form (Phân biệt Thêm/Sửa)
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setZoneId(editData.zoneId); // Sẽ trigger useEffect số 2 để load locations
        setFormData({
          locationId: editData.locationId,
          type: editData.type,
          weight: editData.weight || "",
          quantity: editData.quantity,
          unit: editData.unit || "Bình",
          note: editData.note || "",
        });
      } else {
        setZoneId("");
        setFormData({
          locationId: "",
          type: "",
          weight: "",
          quantity: 1,
          unit: "Bình",
          note: "",
        });
      }
    }
  }, [isOpen, editData]);

  const handleSave = async () => {
    if (!formData.locationId || !formData.type)
      return showToast("Vui lòng chọn Vị trí và nhập Loại bình!", "error");
    if (formData.quantity < 1)
      return showToast("Số lượng phải lớn hơn 0!", "error");

    setIsSaving(true);
    try {
      if (editData) {
        await fireExtinguisherService.update(editData.id, formData);
        showToast("Cập nhật PCCC thành công!");
      } else {
        await fireExtinguisherService.create(formData);
        showToast("Thêm mới PCCC thành công!");
      }
      onSuccess();
      onClose();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Lỗi khi lưu dữ liệu!",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 my-8">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-xl font-bold text-slate-800">
            {editData ? "Cập nhật bình chữa cháy" : "Thêm bình chữa cháy mới"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 bg-slate-50">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center">
                <LayoutDashboard size={14} className="mr-1.5" /> Chọn Khu Vực *
              </label>
              <select
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={zoneId}
                onChange={(e) => {
                  setZoneId(e.target.value);
                  setFormData({ ...formData, locationId: "" }); // Reset vị trí khi đổi khu
                }}
              >
                <option value="">-- Chọn Khu vực --</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center">
                <MapPin size={14} className="mr-1.5" /> Vị trí cụ thể *
              </label>
              <select
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                value={formData.locationId}
                onChange={(e) =>
                  setFormData({ ...formData, locationId: e.target.value })
                }
                disabled={!zoneId}
              >
                <option value="">-- Chọn Vị trí --</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center">
                <Shirt size={14} className="mr-1.5" /> Loại bình *
              </label>
              <input
                type="text"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                placeholder="VD: CO2 MT3, Bột BC..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center">
                <Weight size={14} className="mr-1.5" /> Trọng lượng
              </label>
              <input
                type="text"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: e.target.value })
                }
                placeholder="VD: 3kg, 8kg..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center">
                <Hash size={14} className="mr-1.5" /> Số lượng *
              </label>
              <input
                type="number"
                min="1"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center">
                <Box size={14} className="mr-1.5" /> Đơn vị tính
              </label>
              <input
                type="text"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                placeholder="VD: Bình, Quả..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center">
              <StickyNote size={14} className="mr-1.5" /> Ghi chú
            </label>
            <input
              type="text"
              className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              placeholder="Ghi chú thêm (nếu có)"
            />
          </div>
        </div>

        <div className="p-5 border-t bg-white rounded-b-2xl flex space-x-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex justify-center items-center shadow-lg shadow-indigo-100 disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <Save size={18} className="mr-2" />
            )}
            {editData ? "Cập nhật dữ liệu" : "Lưu vị trí mới"}
          </button>
        </div>
      </div>
    </div>
  );
}
