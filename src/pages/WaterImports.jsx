import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  FileSpreadsheet,
  Edit,
  Droplet,
  TrendingUp,
  RotateCcw,
  MapPin,
  Clock,
  Map,
} from "lucide-react";
import { waterImportService } from "../services/waterImportService";
import { useToast } from "../context/ToastContext";
import CreateEditWaterImportModal from "../components/modals/CreateEditWaterImportModal";
import ZoneManagerModal from "../components/modals/ZoneManagerModal";

export default function WaterImports() {
  const { showToast } = useToast();
  
  // Tabs: 'history' or 'report'
  const [activeTab, setActiveTab] = useState("history");

  // History Tab states
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const [historyFilters, setHistoryFilters] = useState({
    fromDate: "",
    toDate: "",
  });

  // Modals control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [selectedImport, setSelectedImport] = useState(null);

  // Report Tab states
  const [reportFilters, setReportFilters] = useState({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0], // Start of month
    toDate: new Date().toISOString().split("T")[0], // Today
  });
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Load history data
  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [page, size, historyFilters, activeTab]);

  // Load report data
  useEffect(() => {
    if (activeTab === "report") {
      fetchReport();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await waterImportService.getAllImports(
        page,
        size,
        historyFilters.fromDate || undefined,
        historyFilters.toDate || undefined
      );
      setImports(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch (error) {
      showToast("Lỗi tải lịch sử nhập nước!", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    setReportLoading(true);
    try {
      const res = await waterImportService.getImportReport(
        reportFilters.fromDate || undefined,
        reportFilters.toDate || undefined
      );
      setReportData(res.data);
    } catch (error) {
      showToast("Lỗi khi kết xuất báo cáo!", "error");
    } finally {
      setReportLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phiếu nhập nước này?")) {
      try {
        await waterImportService.deleteImport(id);
        showToast("Xóa thành công!");
        if (page === 0) fetchHistory();
        else setPage(0);
      } catch (error) {
        showToast("Lỗi khi xóa phiếu!", "error");
      }
    }
  };

  const handleEditClick = (item) => {
    setSelectedImport(item);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedImport(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Droplet className="text-indigo-600" size={26} />
            Theo Dõi Nước Nhập Về
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản lý nước tinh khiết nhập về, lưu trữ theo khu vực và quản lý vỏ bình
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsZoneModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Map size={18} /> QUẢN LÝ KHU VỰC
          </button>
          <button
            onClick={handleCreateClick}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
          >
            <Plus size={18} /> GHI NHẬN NHẬP NƯỚC
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "history"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Clock size={16} /> Lịch sử nhập nước
        </button>
        <button
          onClick={() => setActiveTab("report")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "report"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileSpreadsheet size={16} /> Báo cáo thống kê
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "history" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in fade-in duration-200">
          {/* Filters Bar */}
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-slate-400 uppercase mb-1">Từ ngày</label>
              <input
                type="date"
                className="p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white"
                value={historyFilters.fromDate}
                onChange={(e) => {
                  setHistoryFilters({ ...historyFilters, fromDate: e.target.value });
                  setPage(0);
                }}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-slate-400 uppercase mb-1">Đến ngày</label>
              <input
                type="date"
                className="p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white"
                value={historyFilters.toDate}
                onChange={(e) => {
                  setHistoryFilters({ ...historyFilters, toDate: e.target.value });
                  setPage(0);
                }}
              />
            </div>
            <div className="flex items-end">
              {(historyFilters.fromDate || historyFilters.toDate) && (
                <button
                  onClick={() => {
                    setHistoryFilters({ fromDate: "", toDate: "" });
                    setPage(0);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50 font-medium"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto min-h-[400px]">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64 text-slate-400">
                <Loader2 size={32} className="animate-spin text-indigo-600 mb-2" />
                <p>Đang tải dữ liệu lịch sử...</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold">
                  <tr>
                    <th className="px-6 py-4">Mã Phiếu</th>
                    <th className="px-6 py-4">Ngày Nhập</th>
                    <th className="px-6 py-4">Số lượng nhập</th>
                    <th className="px-6 py-4">Ngày sản xuất</th>
                    <th className="px-6 py-4">Số lượng vỏ</th>
                    <th className="px-6 py-4">Khu vực phân bổ</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {imports.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                        #W-{item.id}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-semibold">{item.importDate}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full font-bold text-xs">
                          {item.quantity} bình
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{item.productionDate || "—"}</td>
                      <td className="px-6 py-4 font-semibold text-slate-600">{item.shellQuantity} vỏ</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.details && item.details.map((d) => (
                            <span
                              key={d.id}
                              className="inline-block text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded"
                            >
                              {d.zoneName}: <span className="text-indigo-900 font-extrabold">{d.quantity}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 flex justify-end gap-1.5">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Sửa thông tin"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa phiếu"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {imports.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-400 italic">
                        Không có dữ liệu nhập nước nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && imports.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm mt-auto">
              <span className="text-slate-500 font-medium">
                Hiển thị <span className="font-bold text-slate-800">{imports.length}</span> trong tổng số{" "}
                <span className="font-bold text-slate-800">{totalElements}</span> bản ghi
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
      )}

      {activeTab === "report" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Report Filters */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-end gap-4 bg-indigo-50/10">
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Báo cáo từ ngày</label>
                <input
                  type="date"
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={reportFilters.fromDate}
                  onChange={(e) => setReportFilters({ ...reportFilters, fromDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Báo cáo đến ngày</label>
                <input
                  type="date"
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={reportFilters.toDate}
                  onChange={(e) => setReportFilters({ ...reportFilters, toDate: e.target.value })}
                />
              </div>
            </div>
            <button
              onClick={fetchReport}
              disabled={reportLoading}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 w-full md:w-auto"
            >
              {reportLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Calendar size={18} />
              )}
              Xuất Báo Cáo
            </button>
          </div>

          {reportLoading ? (
            <div className="flex flex-col justify-center items-center h-64 text-slate-400">
              <Loader2 size={32} className="animate-spin text-indigo-600 mb-2" />
              <p>Đang lập báo cáo thống kê...</p>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-xl shadow-lg p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-100">Tổng Nước Nhập Về</p>
                    <p className="text-3xl font-extrabold mt-2">{reportData.totalImportQuantity || 0} bình</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-lg">
                    <TrendingUp size={28} />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-xl shadow-lg p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-100">Tổng Vỏ Bình Thu Hồi/Lưu</p>
                    <p className="text-3xl font-extrabold mt-2">{reportData.totalShellQuantity || 0} vỏ</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-lg">
                    <RotateCcw size={28} />
                  </div>
                </div>
              </div>

              {/* Breakdown Tables Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Table 1: Daily Breakdowns */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-sm text-slate-800">Thống kê theo ngày</h3>
                  </div>
                  <div className="overflow-x-auto flex-1 max-h-[400px]">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] border-b border-slate-100 sticky top-0 bg-white">
                        <tr>
                          <th className="px-5 py-3 font-bold">Ngày</th>
                          <th className="px-5 py-3 font-bold text-right">Số lượng nước</th>
                          <th className="px-5 py-3 font-bold text-right">Số lượng vỏ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.dailySummaries && reportData.dailySummaries.map((day, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3.5 font-semibold text-slate-700">{day.date}</td>
                            <td className="px-5 py-3.5 text-right font-bold text-indigo-600">{day.importQuantity} bình</td>
                            <td className="px-5 py-3.5 text-right font-semibold text-slate-600">{day.shellQuantity} vỏ</td>
                          </tr>
                        ))}
                        {(!reportData.dailySummaries || reportData.dailySummaries.length === 0) && (
                          <tr>
                            <td colSpan="3" className="px-5 py-8 text-center text-slate-400 italic">
                              Không có dữ liệu trong khoảng thời gian này.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table 2: Zone Breakdowns */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <MapPin size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-sm text-slate-800">Phân phối theo khu vực</h3>
                  </div>
                  <div className="overflow-x-auto flex-1 max-h-[400px]">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] border-b border-slate-100 sticky top-0 bg-white">
                        <tr>
                          <th className="px-5 py-3 font-bold">Khu Vực</th>
                          <th className="px-5 py-3 font-bold text-right">Tổng số lượng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.zoneSummaries && reportData.zoneSummaries.map((z, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3.5 font-bold text-slate-700">{z.zoneName}</td>
                            <td className="px-5 py-3.5 text-right font-bold text-indigo-600">{z.quantity} bình</td>
                          </tr>
                        ))}
                        {(!reportData.zoneSummaries || reportData.zoneSummaries.length === 0) && (
                          <tr>
                            <td colSpan="2" className="px-5 py-8 text-center text-slate-400 italic">
                              Không có dữ liệu phân phối nào.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 italic">
              Vui lòng bấm nút "Xuất Báo Cáo" để kết xuất dữ liệu thống kê.
            </div>
          )}
        </div>
      )}

      {/* Main create/edit Modal */}
      <CreateEditWaterImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        importData={selectedImport}
        onSuccess={fetchHistory}
      />

      {/* Zone Manager Modal */}
      <ZoneManagerModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        onChange={() => {
          if (activeTab === "history") fetchHistory();
          else fetchReport();
        }}
      />
    </div>
  );
}
