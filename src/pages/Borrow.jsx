import React, { useState, useEffect, useCallback } from "react";
import { Plus, ScanLine, QrCode, Search, Edit } from "lucide-react"; // Đã thêm Search vào import
import { useToast } from "../context/ToastContext";
import { borrowReturnService } from "../services/borrowReturnService";

// Import các Modal vừa tách
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
  const [keyword, setKeyword] = useState("");

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await borrowReturnService.getAllTickets(0, 50, "", keyword);
      setTickets(res.content || []);
    } catch (e) {
      showToast("Lỗi khi tải danh sách phiếu", "error");
    } finally {
      setIsLoading(false);
    }
  }, [keyword, showToast]);

  useEffect(() => {
    fetchTickets();
  }, []);

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
        // Đã thêm w-[110px] và flex justify-center để ép các badge có cùng 1 kích thước
        className={`w-[110px] flex items-center justify-center px-2 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Thanh tìm kiếm */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm theo tên người mượn hoặc mã phiếu..."
            className="w-full pl-10 p-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchTickets()}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScanModal(true)}
            className="flex items-center px-4 py-2.5 bg-white border-2 border-[#1a237e] text-[#1a237e] font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-sm"
          >
            <ScanLine size={18} className="mr-2" /> QUÉT TRẢ ĐỒ
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2.5 bg-[#1a237e] text-white font-bold rounded-xl hover:bg-[#0d145e] transition-colors shadow-md"
          >
            <Plus size={18} className="mr-2" /> TẠO PHIẾU MƯỢN
          </button>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
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
            {tickets.map((t) => (
              <tr
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
              >
                <td className="p-5 font-bold text-[#1a237e]">{t.borrowCode}</td>
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
            ))}
          </tbody>
        </table>
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
