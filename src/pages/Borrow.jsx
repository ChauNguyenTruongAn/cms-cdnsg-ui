import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  ScanLine,
  QrCode,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { borrowReturnService } from "../services/borrowReturnService";

import CreateBorrowModal from "../components/modals/CreateBorrowModal";
import ScanReturnModal from "../components/modals/ScanReturnModal";
import TicketDetailModal from "../components/modals/TicketDetailModal";
import EditBorrowModal from "../components/modals/EditBorrowModal";
import BorrowItems from "./BorrowItems";

export default function Borrow() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("tickets");
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [editingTicket, setEditingTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [manualReturnTicket, setManualReturnTicket] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [keyword]);

  const [kpis, setKpis] = useState({
    totalItems: 0,
    availableItems: 0,
    borrowedItems: 0,
    pendingTickets: 0,
    overdueTickets: 0
  });

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const [res, kpiRes] = await Promise.all([
        borrowReturnService.getAllTickets(page, size, filterStatus, debouncedKeyword),
        borrowReturnService.getAdminKPIs().catch(() => ({ data: null }))
      ]);
      setTickets(res.data?.content || []);
      setTotalPages(res.data?.page?.totalPages || 0);
      setTotalElements(res.data?.page?.totalElements || 0);
      if (kpiRes.data) setKpis(kpiRes.data);
    } catch (e) {
      showToast("Lỗi khi tải danh sách phiếu", "error");
    } finally {
      setIsLoading(false);
    }
  }, [page, size, debouncedKeyword, filterStatus, showToast]);

  useEffect(() => {
    fetchTickets();
  }, [debouncedKeyword, page, size]);

  const handleDelete = async (id, borrowCode) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa phiếu mượn ${borrowCode}?`)) {
      try {
        await borrowReturnService.deleteTicket(id);
        showToast("Đã xóa phiếu thành công", "success");
        fetchTickets();
      } catch (error) {
        showToast("Lỗi khi xóa phiếu", "error");
      }
    }
  };

  const renderStatus = (status, ticket = null) => {
    // Check overdue: BORROWED và đã quá hạn expectedReturnDate
    const isOverdue =
      (status === "BORROWED" || status === "OVERDUE") &&
      ticket?.expectedReturnDate &&
      new Date(ticket.expectedReturnDate) < new Date();

    if (isOverdue || status === "OVERDUE") {
      return (
        <span className="w-[110px] flex items-center justify-center px-2 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm bg-red-600 text-white animate-pulse">
          QUÁ HẠN
        </span>
      );
    }

    const styles = {
      PENDING: "bg-blue-100 text-blue-600",
      BORROWED: "bg-amber-100 text-amber-600",
      RETURNED: "bg-green-100 text-green-600",
      REJECTED: "bg-slate-100 text-slate-600",
      INCOMPLETE: "bg-red-100 text-red-600",
    };
    const labels = {
      PENDING: "Chờ duyệt",
      BORROWED: "Đang mượn",
      RETURNED: "Đã trả đủ",
      REJECTED: "Đã từ chối",
      INCOMPLETE: "Trả thiếu",
    };
    return (
      <span
        className={`w-[110px] flex items-center justify-center px-2 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm ${styles[status] || "bg-gray-100 text-gray-600"}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const isTicketOverdue = (t) =>
    (t.status === "BORROWED" || t.status === "OVERDUE") &&
    t.expectedReturnDate &&
    new Date(t.expectedReturnDate) < new Date();

  const handleApprove = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn duyệt đơn này?")) {
      try {
        await borrowReturnService.approveTicket(id);
        showToast("Đã duyệt đơn mượn", "success");
        fetchTickets();
      } catch (error) {
        showToast(error.response?.data?.message || "Lỗi khi duyệt", "error");
      }
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Nhập lý do từ chối (tuỳ chọn):");
    if (reason !== null) {
      try {
        await borrowReturnService.rejectTicket(id, reason);
        showToast("Đã từ chối đơn mượn", "success");
        fetchTickets();
      } catch (error) {
        showToast(error.response?.data?.message || "Lỗi khi từ chối", "error");
      }
    }
  };

  const handleResolveIncomplete = async (id) => {
    if (window.confirm("Xác nhận người mượn đã đền bù đồ trả thiếu?")) {
      try {
        await borrowReturnService.resolveIncomplete(id);
        showToast("Đã cập nhật trạng thái đền bù", "success");
        fetchTickets();
      } catch (error) {
        showToast("Lỗi khi cập nhật", "error");
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-6 border-b border-slate-200 shrink-0 mb-6">
        <button
          onClick={() => setActiveTab("tickets")}
          className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 ${
            activeTab === "tickets" ? "border-[#1a237e] text-[#1a237e]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Quản Lý Đơn Mượn
        </button>
        <button
          onClick={() => setActiveTab("items")}
          className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 ${
            activeTab === "items" ? "border-[#1a237e] text-[#1a237e]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Quản Lý Vật Phẩm
        </button>
      </div>

      {activeTab === "items" ? (
        <BorrowItems />
      ) : (
        <div className="space-y-6 flex flex-col flex-1 min-h-0">
          {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Package size={16} />
            <span className="text-xs font-bold uppercase">Tổng vật phẩm</span>
          </div>
          <span className="text-2xl font-black text-[#1a237e]">{kpis.totalItems}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-xs font-bold uppercase">Khả dụng</span>
          </div>
          <span className="text-2xl font-black text-green-600">{kpis.availableItems}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <ClipboardList size={16} className="text-amber-500" />
            <span className="text-xs font-bold uppercase">Đang mượn</span>
          </div>
          <span className="text-2xl font-black text-amber-600">{kpis.borrowedItems}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Clock size={16} className="text-blue-500" />
            <span className="text-xs font-bold uppercase">Chờ duyệt</span>
          </div>
          <span className="text-2xl font-black text-blue-600">{kpis.pendingTickets}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <AlertTriangle size={16} />
            <span className="text-xs font-bold uppercase">Quá hạn</span>
          </div>
          <span className="text-2xl font-black text-red-600">{kpis.overdueTickets}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-3 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Tìm mã phiếu, người mượn, email..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1a237e]/30 shadow-sm text-sm transition-all"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
          />
        </div>
        
        <div className="flex gap-3">
          <select
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1a237e]/30 shadow-sm text-sm transition-all cursor-pointer font-medium text-slate-700"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="BORROWED">Đang mượn</option>
            <option value="RETURNED">Đã trả đủ</option>
            <option value="INCOMPLETE">Trả thiếu</option>
            <option value="REJECTED">Từ chối</option>
          </select>
          <button
            onClick={() => setShowScanModal(true)}
            className="flex items-center px-6 py-3 bg-[#1a237e] text-white font-bold rounded-2xl hover:bg-[#0d145e] transition-colors shadow-md active:scale-95"
          >
            <ScanLine size={18} className="mr-2" /> QUÉT TRẢ ĐỒ
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th className="p-5">Mã Phiếu</th>
                <th className="p-5">Danh sách vật tư</th>
                <th className="p-5">Người mượn</th>
                <th className="p-5 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center">
                    <Loader2
                      className="animate-spin text-indigo-600 mx-auto mb-2"
                      size={32}
                    />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-slate-500">
                    Không tìm thấy phiếu mượn nào.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="p-5 font-bold text-[#1a237e]">
                      {t.borrowCode}
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        {t.items?.map((item, idx) => (
                          <div key={idx} className="text-xs text-slate-600">
                            • {item.itemName}{" "}
                            <span className="font-bold text-indigo-600">
                              (x{item.quantity})
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-5 font-medium">{t.borrowerName}</td>
                    <td className="p-5">
                      <div className="flex items-center justify-center gap-2">
                        {renderStatus(t.status, t)}
                        <div className="flex items-center gap-1.5 border-l-2 border-slate-100 pl-3">
                          {t.status === "PENDING" && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(t.id);
                                }}
                                className="px-3 py-1.5 text-[11px] font-bold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-all"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(t.id);
                                }}
                                className="px-3 py-1.5 text-[11px] font-bold text-white bg-slate-400 hover:bg-slate-500 rounded-lg transition-all"
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                          {t.status === "INCOMPLETE" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolveIncomplete(t.id);
                              }}
                              className="px-3 py-1.5 text-[11px] font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-all"
                            >
                              Đã bù đồ
                            </button>
                          )}
                          {(t.status === "BORROWED" || t.status === "OVERDUE") && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setManualReturnTicket(t);
                                }}
                                className={`px-3 py-1.5 text-[11px] font-bold text-white rounded-lg transition-all mr-1 ${
                                  isTicketOverdue(t)
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-blue-500 hover:bg-blue-600"
                                }`}
                              >
                                Thu hồi
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTicket(t);
                                }}
                                className="p-2 text-slate-400 bg-white border border-slate-100 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Xem chi tiết"
                              >
                                <QrCode size={16} strokeWidth={2.5} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(t.id, t.borrowCode);
                            }}
                            className="p-2 text-slate-400 bg-white border border-slate-100 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Xóa"
                          >
                            <Trash2 size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && tickets.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm mt-auto">
            <span className="text-slate-500 font-medium">
              Hiển thị{" "}
              <span className="font-bold text-[#1a237e]">{tickets.length}</span>{" "}
              / {totalElements}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 font-bold text-slate-700">
                Trang {page + 1} / {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateBorrowModal
          onClose={() => setShowCreateModal(false)}
          onReload={fetchTickets}
        />
      )}
      {showScanModal && (
        <ScanReturnModal
          onClose={() => setShowScanModal(false)}
          onReload={fetchTickets}
        />
      )}
      {manualReturnTicket && (
        <ScanReturnModal
          initialTicket={manualReturnTicket}
          onClose={() => setManualReturnTicket(null)}
          onReload={fetchTickets}
        />
      )}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
      {editingTicket && (
        <EditBorrowModal
          ticket={editingTicket}
          onClose={() => setEditingTicket(null)}
          onReload={fetchTickets}
        />
      )}
        </div>
      )}
    </div>
  );
}
