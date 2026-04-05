import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  User,
  Building,
  StickyNote,
  Package,
  ChevronLeft,
  ChevronRight,
  Hash,
} from "lucide-react";

export default function ViewReceiptModal({
  isOpen,
  onClose,
  type,
  receiptData,
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5; // Số vật tư hiển thị trên 1 trang trong Modal

  useEffect(() => {
    // Reset về trang 1 mỗi khi mở phiếu khác
    if (isOpen) setCurrentPage(0);
  }, [isOpen, receiptData]);

  if (!isOpen || !receiptData) return null;

  const isImport = type === "import";
  const items = isImport ? receiptData.importItems : receiptData.exportItems;
  const safeItems = items || [];

  // Tính toán phân trang
  const totalPages = Math.ceil(safeItems.length / itemsPerPage);
  const paginatedItems = safeItems.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage,
  );

  const themeColor = isImport ? "text-[#1a237e]" : "text-amber-700";
  const bgHeader = isImport ? "bg-[#1a237e]" : "bg-amber-600";
  const badgeColor =
    receiptData.status === "CANCELLED"
      ? "bg-red-100 text-red-600 border-red-200"
      : "bg-green-100 text-green-700 border-green-200";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col animate-in zoom-in-95">
        {/* Header Modal */}
        <div
          className={`p-6 border-b flex justify-between items-center text-white rounded-t-2xl ${bgHeader}`}
        >
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold tracking-wide">
              Chi tiết Phiếu {isImport ? "Nhập" : "Xuất"} Kho
            </h3>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full border ${badgeColor} shadow-sm bg-white`}
            >
              {receiptData.status === "CANCELLED" ? "ĐÃ HỦY" : "HOÀN THÀNH"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/40 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 space-y-6 bg-slate-50 flex-1 overflow-y-auto max-h-[75vh]">
          {/* Thông tin chung */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4
              className={`font-bold text-sm uppercase flex items-center border-b border-slate-100 pb-3 mb-4 ${themeColor}`}
            >
              <Hash size={18} className="mr-2" /> Thông tin chung
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              <div className="flex items-start">
                <Hash
                  size={16}
                  className="text-slate-400 mt-0.5 mr-3 shrink-0"
                />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">
                    Mã phiếu
                  </p>
                  <p className="font-semibold text-slate-800">
                    {receiptData.receiptCode || `PN-00${receiptData.id}`}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Calendar
                  size={16}
                  className="text-slate-400 mt-0.5 mr-3 shrink-0"
                />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">
                    Ngày giao dịch
                  </p>
                  <p className="font-semibold text-slate-800">
                    {isImport ? receiptData.importDate : receiptData.exportDate}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <User
                  size={16}
                  className="text-slate-400 mt-0.5 mr-3 shrink-0"
                />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">
                    Người lập phiếu
                  </p>
                  <p className="font-semibold text-slate-800">
                    {receiptData.createdBy || "Admin"}
                  </p>
                </div>
              </div>

              {!isImport && (
                <>
                  <div className="flex items-start">
                    <Building
                      size={16}
                      className="text-slate-400 mt-0.5 mr-3 shrink-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">
                        Phòng ban
                      </p>
                      <p className="font-semibold text-slate-800">
                        {receiptData.department || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <User
                      size={16}
                      className="text-slate-400 mt-0.5 mr-3 shrink-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">
                        Người nhận
                      </p>
                      <p className="font-semibold text-slate-800">
                        {receiptData.recipient || "-"}
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-start sm:col-span-2">
                <StickyNote
                  size={16}
                  className="text-slate-400 mt-0.5 mr-3 shrink-0"
                />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">
                    Ghi chú
                  </p>
                  <p className="font-medium text-slate-600">
                    {receiptData.note || "Không có ghi chú"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách vật tư (Có phân trang) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h4
                className={`font-bold text-sm uppercase flex items-center ${themeColor}`}
              >
                <Package size={18} className="mr-2" /> Danh sách vật tư (
                {safeItems.length})
              </h4>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-5 py-3 font-semibold">STT</th>
                  <th className="px-5 py-3 font-semibold">Tên Vật Tư</th>
                  <th className="px-5 py-3 font-semibold">Đơn vị</th>
                  <th className="px-5 py-3 font-semibold text-right">
                    Số lượng
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3 text-slate-500">
                      {currentPage * itemsPerPage + idx + 1}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-800">
                      {item.material?.name}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {item.material?.unit?.name || "-"}
                    </td>
                    <td className="px-5 py-3 font-bold text-right text-slate-800">
                      {item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Phân trang danh sách vật tư */}
            {totalPages > 1 && (
              <div className="p-3 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs font-medium text-slate-500">
                  Đang xem {currentPage * itemsPerPage + 1} -{" "}
                  {Math.min((currentPage + 1) * itemsPerPage, safeItems.length)}{" "}
                  / {safeItems.length}
                </span>
                <div className="flex space-x-1">
                  <button
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-100"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-100"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
