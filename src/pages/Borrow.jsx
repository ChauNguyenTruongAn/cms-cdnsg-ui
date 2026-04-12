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
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { borrowReturnService } from "../services/borrowReturnService";

import CreateBorrowModal from "../components/modals/CreateBorrowModal";
import ScanReturnModal from "../components/modals/ScanReturnModal";
import TicketDetailModal from "../components/modals/TicketDetailModal";
import EditBorrowModal from "../components/modals/EditBorrowModal";

export default function Borrow() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [editingTicket, setEditingTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [keyword]);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await borrowReturnService.getAllTickets(
        page,
        size,
        "",
        debouncedKeyword,
      );
      setTickets(res.content || []);
      setTotalPages(res.page?.totalPages || 0);
      setTotalElements(res.page?.totalElements || 0);
    } catch (e) {
      showToast("Lỗi khi tải danh sách phiếu", "error");
    } finally {
      setIsLoading(false);
    }
  }, [page, size, debouncedKeyword, showToast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

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

  const renderStatus = (status) => {
    const styles = {
      NEW: "bg-blue-100 text-blue-600",
      BORROWED: "bg-amber-100 text-amber-600",
      COMPLETED: "bg-green-100 text-green-600",
      INCOMPLETE: "bg-red-100 text-red-600",
    };
    const labels = {
      NEW: "Chờ xác nhận",
      BORROWED: "Đang mượn",
      COMPLETED: "Đã trả đủ",
      INCOMPLETE: "Trả thiếu",
    };
    return (
      <span
        className={`w-[110px] flex items-center justify-center px-2 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-3.5 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm theo tên người mượn hoặc mã phiếu..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm text-sm"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScanModal(true)}
            className="flex items-center px-5 py-3 bg-white border-2 border-[#1a237e] text-[#1a237e] font-bold rounded-2xl hover:bg-indigo-50 transition-colors shadow-sm text-sm"
          >
            <ScanLine size={18} className="mr-2" /> QUÉT TRẢ ĐỒ
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-5 py-3 bg-[#1a237e] text-white font-bold rounded-2xl hover:bg-[#0d145e] transition-colors shadow-md text-sm"
          >
            <Plus size={18} className="mr-2" /> TẠO PHIẾU MƯỢN
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
                        {renderStatus(t.status)}
                        <div className="flex items-center gap-1.5 border-l-2 border-slate-100 pl-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicket(t);
                            }}
                            className="p-2 text-slate-400 bg-white border border-slate-100 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Xem QR"
                          >
                            <QrCode size={16} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTicket(t);
                            }}
                            className="p-2 text-slate-400 bg-white border border-slate-100 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Sửa"
                          >
                            <Edit size={16} strokeWidth={2.5} />
                          </button>
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
  );
}
