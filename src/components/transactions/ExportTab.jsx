import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  ArrowRightLeft,
  FileText,
} from "lucide-react";
import { receiptService } from "../../services/receiptService";
import { useToast } from "../../context/ToastContext";
import CreateReceiptModal from "../modals/CreateReceiptModal";
import EditReceiptModal from "../modals/EditReceiptModal";
import ViewReceiptModal from "../modals/ViewReceiptModal";

export default function ExportTab() {
  const { showToast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // States Lọc & Tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // State phân trang
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // State Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalData, setEditModalData] = useState(null);
  const [viewModalData, setViewModalData] = useState(null);

  // Debounce tìm kiếm: Đợi người dùng gõ xong 500ms mới gọi API
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset về trang đầu khi tìm kiếm
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch dữ liệu mỗi khi đổi trang hoặc từ khóa tìm kiếm thay đổi
  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Gọi API lấy danh sách Phiếu Xuất truyền kèm keyword
      const res = await receiptService.getAllExports({
        page,
        size: 10,
        sortBy: "id",
        direction: "desc",
        keyword: debouncedSearch, // Truyền từ khóa tìm kiếm xuống Backend
      });
      setData(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (error) {
      showToast("Lỗi tải danh sách phiếu xuất", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn hủy phiếu xuất này? Số lượng vật tư sẽ được tự động cộng lại vào kho.",
      )
    ) {
      try {
        await receiptService.deleteExport(id);
        showToast("Đã hủy phiếu xuất thành công!");
        fetchData();
      } catch (error) {
        showToast(
          error.response?.data?.message || "Lỗi khi xóa phiếu",
          "error",
        );
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
      {/* THANH CÔNG CỤ (TÌM KIẾM & NÚT TẠO) */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center w-full md:w-96 bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-amber-500/50 transition-all">
          <Search className="text-slate-400 mr-2" size={20} />
          <input
            type="text"
            placeholder="Tìm mã hóa đơn, mã phiếu, phòng ban..."
            className="bg-transparent border-none outline-none w-full text-sm text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-600 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 whitespace-nowrap w-full md:w-auto justify-center"
        >
          <Plus size={18} className="mr-2" /> TẠO PHIẾU XUẤT
        </button>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="overflow-x-auto flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 size={32} className="animate-spin text-amber-500 mb-3" />
            <p className="animate-pulse font-medium">
              Đang tải dữ liệu phiếu xuất...
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-bold">Mã Phiếu / Hóa Đơn</th>
                <th className="px-6 py-4 font-bold">Ngày Xuất</th>
                <th className="px-6 py-4 font-bold">Phòng Ban / Nơi Nhận</th>
                <th className="px-6 py-4 font-bold">Trạng thái</th>
                <th className="px-6 py-4 font-bold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-amber-50/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FileText size={16} className="text-amber-500 mr-2" />
                      <span className="font-bold text-slate-800">
                        {item.receiptCode}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">
                    {item.exportDate}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-700">
                      {item.department}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Người nhận: {item.recipient}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {item.status === "CANCELLED" ? (
                      <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-md text-[10px] font-bold border border-red-100">
                        ĐÃ HỦY
                      </span>
                    ) : (
                      <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-md text-[10px] font-bold border border-green-100">
                        HOÀN TẤT
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setViewModalData(item)}
                      className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                    {item.status !== "CANCELLED" && (
                      <>
                        <button
                          onClick={() => setEditModalData(item)}
                          className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                          title="Sửa phiếu"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Hủy phiếu"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center">
                      <ArrowRightLeft
                        size={40}
                        className="text-slate-300 mb-3"
                      />
                      <p>Không tìm thấy phiếu xuất nào.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* PHÂN TRANG */}
      {totalPages > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">
            Trang {page + 1} / {totalPages}
          </span>
          <div className="flex space-x-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors shadow-sm text-slate-600"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors shadow-sm text-slate-600"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      <CreateReceiptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="export"
        onSuccess={fetchData}
      />

      <EditReceiptModal
        isOpen={!!editModalData}
        onClose={() => setEditModalData(null)}
        type="export"
        receiptData={editModalData}
        onSuccess={fetchData}
      />

      <ViewReceiptModal
        isOpen={!!viewModalData}
        onClose={() => setViewModalData(null)}
        type="export"
        receiptData={viewModalData}
      />
    </div>
  );
}
