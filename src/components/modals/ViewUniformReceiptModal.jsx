import React from "react";
import { X, Calendar, User, FileText, Shirt, Hash } from "lucide-react";

export default function ViewUniformReceiptModal({
  isOpen,
  onClose,
  type,
  data,
}) {
  if (!isOpen || !data) return null;

  const isImport = type === "import";
  // Backend trả về danh sách chi tiết trong thuộc tính 'details' cho cả hai loại phiếu
  const items = data.details || [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div
          className={`p-6 border-b flex justify-between items-center text-white rounded-t-2xl ${isImport ? "bg-emerald-600" : "bg-amber-600"}`}
        >
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold tracking-wide uppercase">
              Chi tiết Phiếu {isImport ? "Nhập Kho" : "Cấp Phát"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/40 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 bg-slate-50 overflow-y-auto max-h-[70vh]">
          {/* Thông tin chung */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start">
                <Hash size={16} className="text-slate-400 mt-1 mr-3 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Mã phiếu
                  </p>
                  <p className="font-semibold text-slate-800">
                    #{isImport ? "NI" : "RE"}-{data.id}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Calendar
                  size={16}
                  className="text-slate-400 mt-1 mr-3 shrink-0"
                />
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Ngày giao dịch
                  </p>
                  <p className="font-semibold text-slate-800">{data.date}</p>
                </div>
              </div>
              <div className="flex items-start">
                <User size={16} className="text-slate-400 mt-1 mr-3 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    {isImport ? "Người giao / NCC" : "Người nhận"}
                  </p>
                  <p className="font-semibold text-slate-800">
                    {isImport ? data.nameResponse : data.cusName}
                  </p>
                </div>
              </div>
              {isImport && (
                <div className="flex items-start">
                  <FileText
                    size={16}
                    className="text-slate-400 mt-1 mr-3 shrink-0"
                  />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">
                      Ghi chú
                    </p>
                    <p className="font-medium text-slate-600 italic">
                      {data.note || "Không có ghi chú"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bảng danh sách mặt hàng */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h4 className="font-bold text-xs uppercase flex items-center text-slate-700">
                <Shirt size={16} className="mr-2" /> Danh sách mặt hàng (
                {items.length})
              </h4>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 font-bold">Loại đồng phục</th>
                  <th className="px-5 py-3 font-bold text-center">Size</th>
                  <th className="px-5 py-3 font-bold text-right">Số lượng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {/* Lấy thông tin từ object uniform được đính kèm trong chi tiết */}
                      {item.uniform?.type}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-bold text-xs">
                        {item.uniform?.size}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-right text-indigo-600">
                      {item.quantity} cái
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
