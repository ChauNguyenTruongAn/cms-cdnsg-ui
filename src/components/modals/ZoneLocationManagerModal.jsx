import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Map,
  MapPin,
  Loader2,
  Save,
} from "lucide-react";
import { fireExtinguisherService } from "../../services/fireExtinguisherService";
import { useToast } from "../../context/ToastContext";

export default function ZoneLocationManagerModal({ isOpen, onClose }) {
  const { showToast } = useToast();
  const [zones, setZones] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(false);

  // States cho Input Thêm/Sửa
  const [zoneInput, setZoneInput] = useState({ id: null, name: "" });
  const [locationInput, setLocationInput] = useState({ id: null, name: "" });

  useEffect(() => {
    if (isOpen) {
      fetchZones();
      setSelectedZone(null);
      setLocations([]);
    }
  }, [isOpen]);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await fireExtinguisherService.getZones();
      setZones(res || []);
    } catch (e) {
      showToast("Lỗi tải danh sách Khu vực", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async (zone) => {
    setSelectedZone(zone);
    setLocationInput({ id: null, name: "" });
    try {
      const res = await fireExtinguisherService.getLocationsByZone(zone.id);
      setLocations(res || []);
    } catch (e) {
      showToast("Lỗi tải danh sách Vị trí", "error");
    }
  };

  // --- XỬ LÝ ZONE ---
  const handleSaveZone = async () => {
    if (!zoneInput.name.trim()) return;
    try {
      if (zoneInput.id) {
        await fireExtinguisherService.updateZone(zoneInput.id, {
          name: zoneInput.name,
        });
        showToast("Đã cập nhật Khu vực!");
      } else {
        await fireExtinguisherService.createZone({
          name: zoneInput.name,
          description: "",
        });
        showToast("Đã thêm Khu vực mới!");
      }
      setZoneInput({ id: null, name: "" });
      fetchZones();
    } catch (e) {
      showToast("Lỗi khi lưu Khu vực", "error");
    }
  };

  const handleDeleteZone = async (id) => {
    if (
      window.confirm(
        "Xóa khu vực này sẽ lỗi nếu đang có Vị trí bên trong. Bạn chắc chứ?",
      )
    ) {
      try {
        await fireExtinguisherService.deleteZone(id);
        if (selectedZone?.id === id) setSelectedZone(null);
        fetchZones();
        showToast("Đã xóa Khu vực");
      } catch (e) {
        showToast("Không thể xóa: Khu vực này đang chứa dữ liệu!", "error");
      }
    }
  };

  // --- XỬ LÝ LOCATION ---
  const handleSaveLocation = async () => {
    if (!locationInput.name.trim() || !selectedZone) return;
    try {
      if (locationInput.id) {
        await fireExtinguisherService.updateLocation(locationInput.id, {
          name: locationInput.name,
          zone: { id: selectedZone.id },
        });
        showToast("Đã cập nhật Vị trí!");
      } else {
        await fireExtinguisherService.createLocation({
          name: locationInput.name,
          zone: { id: selectedZone.id },
        });
        showToast("Đã thêm Vị trí mới!");
      }
      setLocationInput({ id: null, name: "" });
      fetchLocations(selectedZone); // Reload danh sách vị trí
    } catch (e) {
      showToast("Lỗi khi lưu Vị trí", "error");
    }
  };

  const handleDeleteLocation = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa vị trí này?")) {
      try {
        await fireExtinguisherService.deleteLocation(id);
        fetchLocations(selectedZone);
        showToast("Đã xóa Vị trí");
      } catch (e) {
        showToast("Không thể xóa: Vị trí này đang có bình chữa cháy!", "error");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-in zoom-in-95 flex flex-col max-h-[85vh]">
        <div className="p-5 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h3 className="text-xl font-bold text-slate-800 flex items-center">
            <Map size={24} className="mr-2 text-indigo-600" /> Quản lý Khu vực &
            Vị trí
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-white border hover:bg-slate-100 text-slate-500 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* CỘT TRÁI: KHU VỰC */}
          <div className="w-1/2 border-r bg-white p-5 flex flex-col">
            <h4 className="font-bold text-slate-700 mb-4 uppercase text-sm">
              Danh sách Khu vực
            </h4>

            {/* Form nhập Zone */}
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                placeholder="Nhập tên khu vực mới..."
                className="flex-1 px-3 py-2 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500 text-sm"
                value={zoneInput.name}
                onChange={(e) =>
                  setZoneInput({ ...zoneInput, name: e.target.value })
                }
              />
              <button
                onClick={handleSaveZone}
                className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
              >
                {zoneInput.id ? <Save size={18} /> : <Plus size={18} />}
              </button>
              {zoneInput.id && (
                <button
                  onClick={() => setZoneInput({ id: null, name: "" })}
                  className="px-3 py-2 bg-slate-200 text-slate-600 rounded-xl"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* List Zone */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {loading ? (
                <Loader2 className="animate-spin mx-auto text-indigo-500" />
              ) : (
                zones.map((z) => (
                  <div
                    key={z.id}
                    className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-colors ${selectedZone?.id === z.id ? "bg-indigo-50 border-indigo-200" : "hover:bg-slate-50"}`}
                    onClick={() => fetchLocations(z)}
                  >
                    <span className="font-medium text-slate-700">{z.name}</span>
                    <div
                      className="flex space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setZoneInput(z)}
                        className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteZone(z.id)}
                        className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CỘT PHẢI: VỊ TRÍ */}
          <div className="w-1/2 bg-slate-50 p-5 flex flex-col">
            <h4 className="font-bold text-slate-700 mb-4 uppercase text-sm flex items-center">
              Vị trí thuộc{" "}
              {selectedZone ? (
                <span className="text-indigo-600 ml-1">
                  [{selectedZone.name}]
                </span>
              ) : (
                "..."
              )}
            </h4>

            {!selectedZone ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">
                👈 Hãy chọn một Khu vực ở cột bên trái
              </div>
            ) : (
              <>
                {/* Form nhập Location */}
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    placeholder="Nhập tên vị trí..."
                    className="flex-1 px-3 py-2 bg-white border rounded-xl outline-none focus:border-indigo-500 text-sm"
                    value={locationInput.name}
                    onChange={(e) =>
                      setLocationInput({
                        ...locationInput,
                        name: e.target.value,
                      })
                    }
                  />
                  <button
                    onClick={handleSaveLocation}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                  >
                    {locationInput.id ? <Save size={18} /> : <Plus size={18} />}
                  </button>
                  {locationInput.id && (
                    <button
                      onClick={() => setLocationInput({ id: null, name: "" })}
                      className="px-3 py-2 bg-slate-200 text-slate-600 rounded-xl"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {/* List Location */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {locations.length === 0 ? (
                    <p className="text-center text-sm text-slate-400">
                      Chưa có vị trí nào
                    </p>
                  ) : (
                    locations.map((l) => (
                      <div
                        key={l.id}
                        className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm"
                      >
                        <span className="font-medium text-slate-600 flex items-center">
                          <MapPin size={14} className="mr-2 text-indigo-400" />{" "}
                          {l.name}
                        </span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setLocationInput(l)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteLocation(l.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
