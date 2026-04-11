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
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fireExtinguisherService } from "../services/fireExtinguisherService";
import { useToast } from "../context/ToastContext";

import CreateEditExtinguisherModal from "../components/modals/CreateEditExtinguisherModal";
import ViewExtinguisherHistoryModal from "../components/modals/ViewExtinguisherHistoryModal";
import RechargeExtinguisherModal from "../components/modals/RechargeExtinguisherModal";
import ZoneLocationManagerModal from "../components/modals/ZoneLocationManagerModal";
import AdvancedStatsModal from "../components/modals/AdvancedStatsModal";

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

  // --- STATES TÌM KIẾM & LỌC ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterWeight, setFilterWeight] = useState("");

  // --- STATES PHÂN TRANG ---
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // States Modals (Giữ nguyên)
  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [selectedExtinguisher, setSelectedExtinguisher] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState({
    id: null,
    location: "",
  });
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [rechargeTarget, setRechargeTarget] = useState(null);
  const [selectedZoneForRecharge, setSelectedZoneForRecharge] = useState("");
  const [isZoneManagerOpen, setIsZoneManagerOpen] = useState(false);
  const [isAdvancedStatsOpen, setIsAdvancedStatsOpen] = useState(false);

  // Khi thay đổi bộ lọc -> Reset về trang đầu tiên
  useEffect(() => {
    setPage(0);
  }, [searchTerm, filterZone, filterType, filterWeight]);

  useEffect(() => {
    fetchData();
    fetchZones();
  }, [searchTerm, filterZone, filterType, filterWeight, page, size]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fireExtinguisherService.getAll(
          page,
          size,
          searchTerm,
          filterZone,
          filterType,
          filterWeight,
        ),
        fireExtinguisherService.getStats(),
      ]);
      setData(listRes.content || []);
      setTotalPages(listRes.totalPages || 0);
      setTotalElements(listRes.totalElements || 0);
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
      {/* Cards Thống kê giữ nguyên */}
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
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
        {/* Hàng 1: Công cụ chính */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm theo vị trí, tên khu..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap w-full md:w-auto gap-3 justify-end">
            <button
              onClick={() => setIsAdvancedStatsOpen(true)}
              className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-indigo-50 shadow-sm"
            >
              <BarChart3 size={18} className="mr-2" /> XEM BÁO CÁO
            </button>
            <button
              onClick={() => setIsZoneManagerOpen(true)}
              className="bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-slate-50 shadow-sm"
            >
              <Map size={18} className="mr-2 text-indigo-500" /> QUẢN LÝ KHU
            </button>
            <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
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
                className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center hover:bg-emerald-200"
              >
                <LayoutDashboard size={16} className="mr-1.5" /> Nạp cả Khu
              </button>
            </div>
            <button
              onClick={() => {
                setSelectedExtinguisher(null);
                setIsCreateEditOpen(true);
              }}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-indigo-700 shadow-md"
            >
              <Plus size={18} className="mr-2" /> THÊM BÌNH
            </button>
          </div>
        </div>

        {/* Hàng 2: Bộ Lọc Nâng Cao (Khu vực, Loại, Trọng lượng) */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <div className="text-sm font-bold text-slate-500 flex items-center mr-2">
            <Filter size={16} className="mr-1.5" /> LỌC THEO:
          </div>

          <select
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium text-slate-700 min-w-[160px]"
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
          >
            <option value="">Tất cả Khu vực</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>

          <select
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium text-slate-700 min-w-[150px]"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Tất cả Loại bình</option>
            <option value="Bột">Bột</option>
            <option value="CO2">CO2</option>
          </select>

          <input
            type="number"
            placeholder="Trọng lượng (VD: 4, 8)..."
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm w-48"
            value={filterWeight}
            onChange={(e) => setFilterWeight(e.target.value)}
          />

          {/* Nút Xóa Lọc */}
          {(filterZone || filterType || filterWeight) && (
            <button
              onClick={() => {
                setFilterZone("");
                setFilterType("");
                setFilterWeight("");
              }}
              className="text-sm font-medium text-red-500 hover:text-red-700 px-3 transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
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
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
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
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="p-10 text-center text-slate-400 italic"
                    >
                      Không tìm thấy dữ liệu phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => {
                    const status = statusMap[item.status] || statusMap.OK;
                    const StatusIcon = status.icon;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-indigo-50/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <span className="font-bold text-[#1a237e] block">
                            {item.zoneName}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center mt-1">
                            <MapPin size={12} className="mr-1" />
                            {item.locationName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-700">
                            {item.type}
                          </span>
                          <span className="block text-[10px] text-slate-400 uppercase font-bold mt-0.5">
                            {item.weight}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-center text-slate-600 text-base">
                          {item.quantity}{" "}
                          <span className="text-[10px] font-sans text-slate-400">
                            {item.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                          {item.lastRechargeDate || "---"}
                        </td>
                        <td
                          className={`px-6 py-4 font-bold text-xs ${item.status === "EXPIRED" ? "text-red-600" : "text-slate-700"}`}
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
                        <td className="px-6 py-4 text-right flex justify-end space-x-1 border-l border-slate-50">
                          <button
                            onClick={() => {
                              setRechargeTarget({
                                type: "single",
                                id: item.id,
                                name: `${item.type} (${item.zoneName} - ${item.locationName})`,
                              });
                              setIsRechargeOpen(true);
                            }}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors"
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
                            className="p-2 text-blue-500 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                            title="Lịch sử nạp"
                          >
                            <History size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedExtinguisher(item);
                              setIsCreateEditOpen(true);
                            }}
                            className="p-2 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors"
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
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* THANH PHÂN TRANG (PAGINATION) */}
        {!loading && data.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <span className="text-slate-500 font-medium">
              Hiển thị{" "}
              <span className="font-bold text-slate-800">{data.length}</span>{" "}
              trong tổng số{" "}
              <span className="font-bold text-slate-800">{totalElements}</span>{" "}
              bản ghi
            </span>

            <div className="flex items-center gap-2">
              <span className="mr-2 text-slate-500">Số dòng/trang:</span>
              <select
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(0);
                }}
                className="p-1.5 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer mr-4"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>

              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 font-bold text-slate-700">
                Trang {page + 1} / {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
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
          fetchZones();
        }}
      />
      <AdvancedStatsModal
        isOpen={isAdvancedStatsOpen}
        onClose={() => setIsAdvancedStatsOpen(false)}
      />
    </div>
  );
}
