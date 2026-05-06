import React, { useState, useEffect } from "react";
import {
  Plus,
  Eye,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { receiptService } from "../../services/receiptService";
import { useToast } from "../../context/ToastContext";

// Import 3 Modals
import CreateReceiptModal from "../modals/CreateReceiptModal";
import EditReceiptModal from "../modals/EditReceiptModal";
import ViewReceiptModal from "../modals/ViewReceiptModal";

export default function ImportTab() {
  const { showToast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // States phân trang (Đã nâng cấp)
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // States Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewData, setViewData] = useState(null);

  // Lắng nghe thay đổi của page và size
  useEffect(() => {
    fetchData();
  }, [page, size]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await receiptService.getAllImports({
        page,
        size, // Truyền size động
        sortBy: "id",
        direction: "desc",
      });
      setData(res.data.content || []);
      setTotalPages(res.data.page?.totalPages || res.data.totalPages || 0);
      setTotalElements(res.data.page?.totalElements || res.data.totalElements || 0);
    } catch (error) {
      showToast("Lỗi tải phiếu nhập", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn HỦY phiếu nhập này? Tồn kho sẽ bị TRỪ ĐI.",
      )
    ) {
      try {
        await receiptService.deleteImport(id);
        showToast("Đã hủy phiếu nhập và trừ tồn kho thành công!");
        fetchData();
      } catch (e) {
        showToast(
          e.response?.data?.message || "Lỗi khi hủy phiếu nhập",
          "error",
        );
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px] animate-in fade-in duration-300">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 text-lg">
          Lịch sử Phiếu Nhập Kho
        </h3>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-[#1a237e] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-[#0d145e] transition-colors shadow-md transform active:scale-95"
        >
          <Plus size={18} className="mr-2" /> TẠO PHIẾU NHẬP
        </button>
      </div>

      <div className="overflow-x-auto flex-1 flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400 py-20">
            <Loader2 size={32} className="animate-spin text-[#1a237e] mb-3" />
            <p className="font-medium">Đang tải dữ liệu phiếu nhập...</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold">Mã Phiếu</th>
                <th className="px-6 py-4 font-bold">Ngày Nhập</th>
                <th className="px-6 py-4 font-bold">Ghi chú</th>
                <th className="px-6 py-4 font-bold text-center">
                  Số lượng loại VT
                </th>
                <th className="px-6 py-4 font-bold">Trạng thái</th>
                <th className="px-6 py-4 font-bold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-indigo-50/30 transition-colors group"
                >
                  <td className="px-6 py-4 font-bold text-[#1a237e]">
                    {item.receiptCode || `PN-00${item.id}`}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {item.importDate}
                  </td>
                  <td
                    className="px-6 py-4 text-slate-500 max-w-[200px] truncate"
                    title={item.note}
                  >
                    {item.note || "-"}
                  </td>
                  <td className="px-6 py-4 font-bold text-center text-slate-700">
                    {item.importItems?.length || 0}
                  </td>
                  <td className="px-6 py-4">
                    {item.status === "CANCELLED" ? (
                      <span className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider">
                        ĐÃ HỦY
                      </span>
                    ) : (
                      <span className="bg-green-50 text-green-600 border border-green-100 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider">
                        HOÀN THÀNH
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setViewData(item)}
                      className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye size={18} />
                    </button>

                    {item.status !== "CANCELLED" && (
                      <>
                        <button
                          onClick={() => setEditData(item)}
                          className="p-2 text-amber-500 hover:bg-amber-100 rounded-lg transition-colors"
                          title="Chỉnh sửa phiếu"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hủy phiếu"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    Chưa có phiếu nhập kho nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* PHÂN TRANG NÂNG CAO */}
      {!loading && data.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm mt-auto">
          <span className="text-slate-500 font-medium">
            Hiển thị{" "}
            <span className="font-bold text-[#1a237e]">{data.length}</span> /
            tổng{" "}
            <span className="font-bold text-[#1a237e]">{totalElements}</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="mr-2 text-slate-500">Số dòng/trang:</span>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0); // Về trang 1 khi đổi số dòng
              }}
              className="p-1.5 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer mr-4"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>

            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-indigo-50 hover:text-[#1a237e] transition-colors shadow-sm text-slate-600"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 py-2 font-bold text-slate-700">
              Trang {page + 1} / {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-indigo-50 hover:text-[#1a237e] transition-colors shadow-sm text-slate-600"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Render 3 Modals */}
      <CreateReceiptModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        type="import"
        onSuccess={fetchData}
      />
      <EditReceiptModal
        isOpen={!!editData}
        onClose={() => setEditData(null)}
        type="import"
        receiptData={editData}
        onSuccess={fetchData}
      />
      <ViewReceiptModal
        isOpen={!!viewData}
        onClose={() => setViewData(null)}
        type="import"
        receiptData={viewData}
      />
    </div>
  );
}
