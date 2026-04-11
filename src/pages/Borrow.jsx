import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  ScanLine,
  QrCode,
  Search,
  Edit,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { borrowReturnService } from "../services/borrowReturnService";

// Import các Modal
import CreateBorrowModal from "../components/modals/CreateBorrowModal";
import ScanReturnModal from "../components/modals/ScanReturnModal";
import TicketDetailModal from "../components/modals/TicketDetailModal";
import EditBorrowModal from "../components/modals/EditBorrowModal";

export default function Borrow() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // State quản lý Modals
  const [editingTicket, setEditingTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // State Phân trang & Tìm kiếm
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  // 1. Logic Debounce cho thanh tìm kiếm
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(0); // Reset về trang 1 khi từ khóa tìm kiếm thay đổi
    }, 500); // Đợi 500ms sau khi ngừng gõ

    return () => clearTimeout(handler);
  }, [keyword]);

  // 2. Hàm gọi API Fetch Data
  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      // Gọi API với page, size và debouncedKeyword
      const res = await borrowReturnService.getAllTickets(
        page,
        size,
        "", // Trạng thái (để trống nếu load tất cả)
        debouncedKeyword,
      );
      setTickets(res.content || []);
      // Spring Boot bọc thông tin trang trong object "page"
      setTotalPages(res.page?.totalPages || 0);
      setTotalElements(res.page?.totalElements || 0);
    } catch (e) {
      showToast("Lỗi khi tải danh sách phiếu", "error");
    } finally {
      setIsLoading(false);
    }
  }, [page, size, debouncedKeyword, showToast]);

  // Load dữ liệu khi page, size hoặc từ khóa (debounced) thay đổi
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

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
      {/* Header & Thanh tìm kiếm */}
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
            // Bỏ onKeyDown vì Debounce đã tự động xử lý khi dừng gõ
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

      {/* Bảng dữ liệu */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th className="p-5">Mã Phiếu</th>
                <th className="p-5">Vật tư & SL</th>
                <th className="p-5">Người mượn</th>
                <th className="p-5 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-slate-500">
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
                      {t.material?.name} (x{t.quantity})
                    </td>
                    <td className="p-5">{t.borrowerName}</td>
                    <td className="p-5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {renderStatus(t.status)}
                        <div className="flex items-center gap-1.5 border-l-2 border-slate-100 pl-4">
                          {/* Nút Xem QR */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicket(t);
                            }}
                            className="p-2 text-slate-400 bg-white border border-slate-100 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg transition-all shadow-sm"
                            title="Xem mã QR"
                          >
                            <QrCode size={16} strokeWidth={2.5} />
                          </button>
                          {/* Nút Chỉnh sửa */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTicket(t);
                            }}
                            className="p-2 text-slate-400 bg-white border border-slate-100 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200 rounded-lg transition-all shadow-sm"
                            title="Chỉnh sửa phiếu"
                          >
                            <Edit size={16} strokeWidth={2.5} />
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

        {/* 3. Thanh Phân Trang (Chỉ hiện khi có dữ liệu) */}
        {!isLoading && tickets.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm mt-auto">
            <span className="text-slate-500 font-medium">
              Hiển thị{" "}
              <span className="font-bold text-[#1a237e]">{tickets.length}</span>{" "}
              / tổng{" "}
              <span className="font-bold text-[#1a237e]">{totalElements}</span>
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
                className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-40 hover:bg-indigo-50 hover:text-[#1a237e] transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 font-bold text-slate-700">
                Trang {page + 1} / {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-40 hover:bg-indigo-50 hover:text-[#1a237e] transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tích hợp Modals */}
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
