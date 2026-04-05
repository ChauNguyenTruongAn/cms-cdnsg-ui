import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  User,
  Eye,
} from "lucide-react";
import { uniformService } from "../../services/uniformService";
import { useToast } from "../../context/ToastContext";
import CreateUniformImportModal from "../modals/CreateUniformImportModal";
import ViewUniformReceiptModal from "../modals/ViewUniformReceiptModal";

export default function UniformImportTab() {
  const { showToast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  // Bộ lọc
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    name: "",
  });

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Gọi API lấy danh sách nhập kho với các tham số lọc
      const res = await uniformService.getAllImports({
        page,
        size: 10,
        ...filters,
      });
      setData(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (error) {
      showToast("Lỗi tải lịch sử nhập kho!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Xóa phiếu nhập này sẽ tự động TRỪ số lượng tồn kho tương ứng. Bạn có chắc chắn?",
      )
    ) {
      try {
        await uniformService.deleteImport(id); //
        showToast("Đã xóa phiếu nhập và cập nhật lại tồn kho!");
        fetchData();
      } catch (e) {
        showToast("Lỗi khi xóa phiếu nhập", "error");
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-lg flex items-center">
          <Calendar className="mr-2 text-emerald-600" size={20} /> Lịch sử Nhập
          kho Đồng phục
        </h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center hover:bg-emerald-700 transition-all shadow-md active:scale-95"
        >
          <Plus size={18} className="mr-2" /> TẠO PHIẾU NHẬP
        </button>
      </div>

      {/* Thanh công cụ lọc */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-100">
        <input
          type="date"
          className="p-2 border rounded-lg text-sm"
          value={filters.fromDate}
          onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
        />
        <input
          type="date"
          className="p-2 border rounded-lg text-sm"
          value={filters.toDate}
          onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
        />
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Tên người giao..."
            className="w-full pl-9 p-2 border rounded-lg text-sm"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
        </div>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 size={32} className="animate-spin text-emerald-600 mb-2" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold">
              <tr>
                <th className="px-6 py-4">Mã Phiếu</th>
                <th className="px-6 py-4">Ngày Nhập</th>
                <th className="px-6 py-4">Người Giao / NCC</th>
                <th className="px-6 py-4">Số lượng loại</th>
                <th className="px-6 py-4">Ghi chú</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-emerald-50/30 transition-colors group"
                >
                  <td className="px-6 py-4 font-bold text-emerald-700">
                    #NI-{item.id}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{item.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {item.nameResponse || "-"}
                  </td>
                  <td className="px-6 py-4 font-bold text-center">
                    {item.details?.length || 0}
                  </td>
                  <td className="px-6 py-4 text-slate-500 italic">
                    {item.note || "-"}
                  </td>
                  <td className="px-6 py-4 flex justify-end space-x-2">
                    <button
                      onClick={() => setViewData(item)}
                      className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination (Tương tự các Tab khác) */}
      {totalPages > 0 && (
        <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Trang {page + 1} / {totalPages}
          </span>
          <div className="flex space-x-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 border rounded bg-white hover:bg-slate-100 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 border rounded bg-white hover:bg-slate-100 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <CreateUniformImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
      <ViewUniformReceiptModal
        isOpen={!!viewData}
        onClose={() => setViewData(null)}
        type="import"
        data={viewData}
      />
    </div>
  );
}
