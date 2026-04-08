import React from "react";
import { X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function TicketDetailModal({ ticket, onClose }) {
  const isBorrowed = ticket.status === "BORROWED";
  const displayCode = isBorrowed ? ticket.returnCode : ticket.borrowCode;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm text-center overflow-hidden animate-in zoom-in-95">
        <div className="p-6 bg-slate-50 border-b relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
          <h3 className="font-bold text-slate-800">Chi tiết Mã QR</h3>
          <p className="text-xs text-slate-500">
            {isBorrowed ? "Mã trả đồ" : "Mã mượn đồ"}
          </p>
        </div>
        <div className="p-8 space-y-4">
          <div className="inline-block p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-inner">
            <QRCodeSVG value={displayCode} size={180} />
          </div>
          <div>
            <div className="text-2xl font-black text-[#1a237e] tracking-widest">
              {displayCode}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {ticket.material.name} - SL: {ticket.quantity}
            </p>
          </div>
          <div className="pt-4 text-xs text-slate-400 italic">
            Người mượn: {ticket.borrowerName}
          </div>
        </div>
      </div>
    </div>
  );
}
