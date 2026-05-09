import React from "react";
import { X, Calendar, User, Building, Mail, FileText, CheckCircle2, AlertTriangle, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function TicketDetailModal({ ticket, onClose }) {
  const isBorrowed = ticket.status === "BORROWED";
  const isPending = ticket.status === "PENDING";
  const displayCode = isBorrowed ? ticket.returnCode : ticket.borrowCode;
  const showQR = (isBorrowed || isPending) && displayCode;

  const renderStatus = (status) => {
    const styles = {
      PENDING: "bg-blue-100 text-blue-700",
      BORROWED: "bg-amber-100 text-amber-700",
      RETURNED: "bg-green-100 text-green-700",
      REJECTED: "bg-slate-100 text-slate-700",
      INCOMPLETE: "bg-red-100 text-red-700",
    };
    const labels = {
      PENDING: "Chờ duyệt",
      BORROWED: "Đang mượn",
      RETURNED: "Đã trả đủ",
      REJECTED: "Đã từ chối",
      INCOMPLETE: "Trả thiếu",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles[status] || "bg-gray-100 text-gray-600"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 max-h-[90vh]">
        <div className="p-5 border-b flex justify-between items-center bg-[#1a237e] text-white shrink-0">
          <h3 className="font-bold text-lg flex items-center">
            <FileText className="mr-2" /> Chi tiết phiếu mượn
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 bg-slate-50 overflow-y-auto flex-1 space-y-6">
          {/* Header Info */}
          <div className="flex flex-wrap items-start justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <div className="text-2xl font-black text-[#1a237e] tracking-widest mb-1">
                {ticket.borrowCode}
              </div>
              {renderStatus(ticket.status)}
            </div>
            {showQR && (
              <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                <QRCodeSVG value={displayCode} size={80} />
                <span className="text-[10px] font-bold text-slate-500 mt-2 uppercase">
                  {isBorrowed ? "Mã trả đồ" : "Mã nhận đồ"}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Người mượn */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Người mượn</h4>
              <div className="flex items-center text-sm">
                <User size={16} className="text-slate-400 mr-2" />
                <span className="font-semibold text-slate-700">{ticket.borrowerName}</span>
              </div>
              <div className="flex items-center text-sm">
                <Mail size={16} className="text-slate-400 mr-2" />
                <span className="text-slate-600">{ticket.email || "N/A"}</span>
              </div>
              <div className="flex items-center text-sm">
                <Building size={16} className="text-slate-400 mr-2" />
                <span className="text-slate-600">{ticket.department || "N/A"}</span>
              </div>
            </div>

            {/* Thời gian */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thời gian</h4>
              <div className="flex items-center text-sm">
                <Calendar size={16} className="text-slate-400 mr-2" />
                <span className="text-slate-500 mr-1">Ngày mượn:</span>
                <span className="font-semibold text-slate-700">{formatDate(ticket.borrowDate || ticket.createdAt)}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar size={16} className="text-slate-400 mr-2" />
                <span className="text-slate-500 mr-1">Dự kiến trả:</span>
                <span className="font-semibold text-slate-700">{formatDate(ticket.expectedReturnDate)}</span>
              </div>
              {ticket.status === "RETURNED" && 
               <div className="flex items-center text-sm">
                <Calendar size={16} className="text-slate-400 mr-2" />
                <span className="text-slate-500 mr-1">Thời gian trả:</span>
                <span className="font-semibold text-slate-700">{formatDate(ticket.returnTime)}</span>
              </div>}
            </div>
          </div>

          {/* Danh sách vật phẩm */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Danh sách vật phẩm</h4>
            </div>
            <div className="p-4 space-y-4">
              {ticket.items && ticket.items.length > 0 ? (
                ticket.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <div>
                      <div className="font-bold text-[#1a237e]">{item.itemName}</div>
                      <div className="text-xs text-slate-500 mt-1">SL Mượn: <span className="font-bold text-slate-700">{item.quantity}</span></div>
                    </div>
                    
                    {(ticket.status === "RETURNED" || ticket.status === "INCOMPLETE") && (
                      <div className="mt-2 sm:mt-0 text-right">
                        <div className="flex items-center justify-end gap-3 text-xs">
                          <span className="text-green-600 font-bold flex items-center">
                            <CheckCircle2 size={14} className="mr-1"/> Trả tốt: {item.returnedQuantity || 0}
                          </span>
                          <span className="text-red-500 font-bold flex items-center">
                            <AlertTriangle size={14} className="mr-1"/> Hư/Thiếu: {item.brokenQuantity || 0}
                          </span>
                        </div>
                        {item.conditionNote && (
                          <div className="text-[11px] text-slate-500 mt-1 italic">Ghi chú: {item.conditionNote}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 text-sm">
                  Phiếu cũ: {ticket.itemName} (SL: {ticket.quantity})
                </div>
              )}
            </div>
          </div>

          {/* Ghi chú */}
          {(ticket.note || ticket.generalNote) && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ghi chú</h4>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.generalNote || ticket.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
