import React, { useState, useEffect } from "react";
import { X, Loader2, CalendarClock, History, Wrench } from "lucide-react";
import { projectorService } from "../../services/projectorService";

export default function ProjectorHistoryModal({ isOpen, onClose, projector }) {
  const [loans, setLoans] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && projector) {
      setLoading(true);
      Promise.all([
        projectorService.getLoanHistoryByProjector(projector.id),
        projectorService.getMaintenanceHistory(projector.id),
      ])
        .then(([loanRes, maintRes]) => {
          setLoans(loanRes || []);
          setMaintenances(maintRes || []);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, projector]);

  if (!isOpen || !projector) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b bg-[#1a237e] text-white rounded-t-2xl flex justify-between">
          <h3 className="font-bold text-lg">
            Lịch sử thiết bị: {projector.name} ({projector.serialNumber})
          </h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-slate-50 flex gap-6">
          {loading ? (
            <Loader2 className="animate-spin text-[#1a237e] m-auto" size={32} />
          ) : (
            <>
              {/* LỊCH SỬ MƯỢN TRẢ */}
              <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border">
                <h4 className="font-bold text-indigo-700 flex items-center mb-4">
                  <History size={18} className="mr-2" /> Lịch sử mượn trả
                </h4>
                <div className="space-y-3">
                  {loans.map((l) => (
                    <div
                      key={l.id}
                      className="text-sm border-l-4 border-indigo-500 pl-3 py-1"
                    >
                      <p className="font-bold">{l.borrower}</p>
                      <p className="text-xs text-slate-500">
                        Mượn: {l.borrowDate} - Trả:{" "}
                        {l.returnDate || "Đang mượn"}
                      </p>
                    </div>
                  ))}
                  {loans.length === 0 && (
                    <p className="text-xs text-slate-400">
                      Chưa từng cho mượn.
                    </p>
                  )}
                </div>
              </div>

              {/* LỊCH SỬ BẢO TRÌ */}
              <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border">
                <h4 className="font-bold text-amber-700 flex items-center mb-4">
                  <Wrench size={18} className="mr-2" /> Lịch sử bảo trì
                </h4>
                <div className="space-y-3">
                  {maintenances.map((m) => (
                    <div
                      key={m.id}
                      className="text-sm border-l-4 border-amber-500 pl-3 py-1"
                    >
                      <p className="font-bold">{m.maintenanceDate}</p>
                      <p className="text-xs text-slate-600">
                        {m.description} - {m.technician}
                      </p>
                    </div>
                  ))}
                  {maintenances.length === 0 && (
                    <p className="text-xs text-slate-400">Chưa từng bảo trì.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
