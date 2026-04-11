import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserCheck,
  Receipt,
  Eye,
} from "lucide-react";
import { uniformService } from "../../services/uniformService";
import { useToast } from "../../context/ToastContext";
import CreateUniformReceiptModal from "../modals/CreateUniformReceiptModal";
import ViewUniformReceiptModal from "../modals/ViewUniformReceiptModal";

export default function UniformReceiptTab() {
  const { showToast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Phân trang
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  // Bộ lọc theo tên người nhận
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    cusName: "",
  });

  // Reset trang khi đổi bộ lọc
  useEffect(() => {
    setPage(0);
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [page, size, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await uniformService.getAllReceipts({
        page,
        size,
        ...filters,
      });
      setData(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (error) {
      showToast("Lỗi tải dữ liệu cấp phát!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Xóa phiếu cấp phát này sẽ CỘNG lại số lượng tồn kho. Bạn có chắc chắn?",
      )
    ) {
      try {
        await uniformService.deleteReceipt(id);
        showToast("Đã xóa và hoàn trả tồn kho!");
        fetchData();
      } catch (e) {
        showToast("Lỗi khi xóa phiếu!", "error");
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300 flex flex-col">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-amber-50/30">
        <h3 className="font-bold text-slate-800 text-lg flex items-center">
          <Receipt className="mr-2 text-amber-600" size={20} /> Danh sách Cấp
          phát Đồng phục
        </h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center hover:bg-amber-700 transition-all shadow-md active:scale-95"
        >
          <Plus size={18} className="mr-2" /> TẠO PHIẾU CẤP PHÁT
        </button>
      </div>

      {/* Thanh lọc */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-100">
        <input
          type="date"
          className="p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
          value={filters.fromDate}
          onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
        />
        <input
          type="date"
          className="p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
          value={filters.toDate}
          onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
        />
        <div className="relative">
          <UserCheck
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Tên người nhận..."
            className="w-full pl-9 p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
            value={filters.cusName}
            onChange={(e) =>
              setFilters({ ...filters, cusName: e.target.value })
            }
          />
        </div>
      </div>

      <div className="overflow-x-auto min-h-[400px] flex-1">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 text-slate-400">
            <Loader2 size={32} className="animate-spin text-amber-600 mb-2" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold">
              <tr>
                <th className="px-6 py-4">Mã Phiếu</th>
                <th className="px-6 py-4">Ngày Xuất</th>
                <th className="px-6 py-4">Họ tên Người nhận</th>
                <th className="px-6 py-4">Tổng số lượng</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-amber-50/20 transition-colors group"
                >
                  <td className="px-6 py-4 font-bold text-amber-700">
                    #RE-{item.id}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{item.date}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 uppercase">
                    {item.cusName}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold">
                      {item.totalQuantity} cái
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-end">
                    <button
                      onClick={() => setViewData(item)}
                      className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
                    Không có dữ liệu phiếu cấp phát nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* THANH PHÂN TRANG */}
      {!loading && data.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm mt-auto">
          <span className="text-slate-500 font-medium">
            Hiển thị{" "}
            <span className="font-bold text-slate-800">{data.length}</span>{" "}
            trong tổng số{" "}
            <span className="font-bold text-slate-800">{totalElements}</span>{" "}
            bản ghi
          </span>
          <div className="flex items-center gap-2">
            <span className="mr-2 text-slate-500">Số dòng/trang:</span>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
              className="p-1.5 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer mr-4"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-50 hover:text-amber-600 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 py-2 font-bold text-slate-700">
              Trang {page + 1} / {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-50 hover:text-amber-600 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Cấp phát */}
      <CreateUniformReceiptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
      <ViewUniformReceiptModal
        isOpen={!!viewData}
        onClose={() => setViewData(null)}
        type="receipt"
        data={viewData}
      />
    </div>
  );
}
