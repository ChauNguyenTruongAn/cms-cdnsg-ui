import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Timer,
  Plus,
  Search,
  RefreshCw,
  History,
  Trash2,
  Loader2,
  Edit,
  LayoutDashboard,
  Map,
  MapPin,
  BarChart3,
} from "lucide-react";
import { fireExtinguisherService } from "../services/fireExtinguisherService";
import { useToast } from "../context/ToastContext";

import CreateEditExtinguisherModal from "../components/modals/CreateEditExtinguisherModal";
import ViewExtinguisherHistoryModal from "../components/modals/ViewExtinguisherHistoryModal";
import RechargeExtinguisherModal from "../components/modals/RechargeExtinguisherModal";
import ZoneLocationManagerModal from "../components/modals/ZoneLocationManagerModal";
import AdvancedStatsModal from "../components/modals/AdvancedStatsModal"; //

const statusMap = {
  OK: {
    label: "AN TOÀN",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    icon: ShieldCheck,
  },
  WARNING: {
    label: "SẮP ĐẾN HẠN",
    color: "bg-amber-50 text-amber-600 border-amber-200",
    icon: Timer,
  },
  EXPIRED: {
    label: "QUÁ HẠN NẠP",
    color: "bg-red-50 text-red-600 border-red-200",
    icon: AlertTriangle,
  },
};

export default function FireExtinguishers() {
  const { showToast } = useToast();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ ok: 0, warning: 0, expired: 0 });
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [selectedExtinguisher, setSelectedExtinguisher] = useState(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState({
    id: null,
    location: "",
  });

  // State cho Modal Nạp Bình linh hoạt
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [rechargeTarget, setRechargeTarget] = useState(null); // { type: 'single'|'zone', id, name }
  const [selectedZoneForRecharge, setSelectedZoneForRecharge] = useState("");
  const [isZoneManagerOpen, setIsZoneManagerOpen] = useState(false);

  //State cho quản lý stats
  const [isAdvancedStatsOpen, setIsAdvancedStatsOpen] = useState(false);

  useEffect(() => {
    fetchData();
    fetchZones();
  }, [searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fireExtinguisherService.getAll(0, 100, searchTerm),
        fireExtinguisherService.getStats(),
      ]);
      setData(listRes.content || []);
      setStats(statsRes);
    } catch (error) {
      showToast("Lỗi tải dữ liệu PCCC", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const res = await fireExtinguisherService.getZones();
      setZones(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bình PCCC này?")) {
      try {
        await fireExtinguisherService.delete(id);
        showToast("Đã xóa thành công!");
        fetchData();
      } catch (e) {
        showToast("Lỗi khi xóa dữ liệu", "error");
      }
    }
  };

  const handleBulkRecharge = () => {
    if (!selectedZoneForRecharge)
      return showToast("Vui lòng chọn Khu vực để nạp hàng loạt!", "error");
    const zone = zones.find((z) => z.id.toString() === selectedZoneForRecharge);
    setRechargeTarget({
      type: "zone",
      id: zone.id,
      name: `Toàn bộ Khu: ${zone.name}`,
    });
    setIsRechargeOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">
              Bình An Toàn
            </p>
            <p className="text-2xl font-black text-emerald-600">{stats.ok}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Timer size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">
              Sắp đến hạn
            </p>
            <p className="text-2xl font-black text-amber-600">
              {stats.warning}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">
              Quá hạn nạp
            </p>
            <p className="text-2xl font-black text-red-600">{stats.expired}</p>
          </div>
        </div>
      </div>

      {/* Cụm công cụ: Tìm kiếm, Nạp hàng loạt, Thêm mới */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm khu vực, vị trí, loại bình..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex w-full md:w-auto space-x-3">
          <button
            onClick={() => setIsAdvancedStatsOpen(true)}
            className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-indigo-50 transition-all whitespace-nowrap shadow-sm"
          >
            <BarChart3 size={18} className="mr-2" /> XEM BÁO CÁO
          </button>
          <button
            onClick={() => setIsZoneManagerOpen(true)}
            className="bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-slate-50 transition-all whitespace-nowrap shadow-sm"
          >
            <Map size={18} className="mr-2 text-indigo-500" /> QUẢN LÝ KHU
          </button>
          <div className="flex bg-slate-50 border rounded-xl p-1">
            <select
              className="bg-transparent outline-none px-2 text-sm text-slate-600 font-medium"
              value={selectedZoneForRecharge}
              onChange={(e) => setSelectedZoneForRecharge(e.target.value)}
            >
              <option value="">-- Chọn Khu để nạp --</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleBulkRecharge}
              className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center hover:bg-emerald-200 transition-colors"
            >
              <LayoutDashboard size={16} className="mr-1.5" /> Nạp cả Khu
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedExtinguisher(null);
              setIsCreateEditOpen(true);
            }}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-indigo-700 transition-all whitespace-nowrap"
          >
            <Plus size={18} className="mr-2" /> THÊM BÌNH
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-24 text-center text-slate-400">
              <Loader2
                size={32}
                className="animate-spin mx-auto mb-2 text-indigo-500"
              />
              Đang tải dữ liệu...
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[1200px]">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Khu vực / Vị trí</th>
                  <th className="px-6 py-4">Loại & Trọng lượng</th>
                  <th className="px-6 py-4 text-center">Số lượng</th>
                  <th className="px-6 py-4">Ngày nạp gần nhất</th>
                  <th className="px-6 py-4">Hạn nạp tiếp theo</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Ghi chú</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((item) => {
                  const status = statusMap[item.status] || statusMap.OK;
                  const StatusIcon = status.icon;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-indigo-50/20 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 block">
                          {item.zoneName}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center mt-1">
                          <MapPin size={10} className="mr-1" />
                          {item.locationName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700">
                          {item.type}
                        </span>
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">
                          {item.weight}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-center text-slate-600 text-base">
                        {item.quantity}{" "}
                        <span className="text-[10px] font-sans text-slate-400">
                          {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {item.lastRechargeDate || "---"}
                      </td>
                      <td
                        className={`px-6 py-4 font-bold ${item.status === "EXPIRED" ? "text-red-600" : "text-slate-700"}`}
                      >
                        {item.nextRechargeDate || "---"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-bold ${status.color}`}
                        >
                          <StatusIcon size={12} className="mr-1.5" />{" "}
                          {status.label}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-slate-500 text-xs italic max-w-[150px] truncate"
                        title={item.note}
                      >
                        {item.note || "-"}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end space-x-1">
                        <button
                          onClick={() => {
                            setRechargeTarget({
                              type: "single",
                              id: item.id,
                              name: `${item.type} (${item.zoneName} - ${item.locationName})`,
                            });
                            setIsRechargeOpen(true);
                          }}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Nạp bình"
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setHistoryTarget({
                              id: item.id,
                              location: `${item.zoneName} - ${item.locationName}`,
                            });
                            setIsHistoryOpen(true);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lịch sử nạp"
                        >
                          <History size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedExtinguisher(item);
                            setIsCreateEditOpen(true);
                          }}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Sửa thông tin"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CreateEditExtinguisherModal
        isOpen={isCreateEditOpen}
        onClose={() => setIsCreateEditOpen(false)}
        onSuccess={fetchData}
        editData={selectedExtinguisher}
      />
      <ViewExtinguisherHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        extinguisherId={historyTarget.id}
        locationName={historyTarget.location}
      />
      <RechargeExtinguisherModal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
        onSuccess={fetchData}
        target={rechargeTarget}
      />
      <ZoneLocationManagerModal
        isOpen={isZoneManagerOpen}
        onClose={() => {
          setIsZoneManagerOpen(false);
          fetchZones(); // Cập nhật lại dropdown danh sách Khu vực ở màn hình chính sau khi đóng Modal
        }}
      />
      <AdvancedStatsModal
        isOpen={isAdvancedStatsOpen}
        onClose={() => setIsAdvancedStatsOpen(false)}
      />
    </div>
  );
}
