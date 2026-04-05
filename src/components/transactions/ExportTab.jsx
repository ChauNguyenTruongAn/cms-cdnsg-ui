import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Edit,
} from "lucide-react";
import { receiptService } from "../../services/receiptService";
import { useToast } from "../../context/ToastContext";
import CreateReceiptModal from "../modals/CreateReceiptModal";
import EditReceiptModal from "../modals/EditReceiptModal";
import ViewReceiptModal from "../modals/ViewReceiptModal"; // Thêm dòng này

export default function ExportTab() {
  const { showToast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // State phân trang
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalData, setEditModalData] = useState(null);
  const [viewModalData, setViewModalData] = useState(null); // Thêm state này

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Gọi API lấy danh sách Phiếu Xuất
      const res = await receiptService.getAllExports({
        page,
        size: 10,
        sortBy: "id",
        direction: "desc",
      });
      setData(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (error) {
      showToast("Lỗi tải danh sách phiếu xuất!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn HỦY phiếu xuất này? Số lượng vật tư sẽ được tự động cộng hoàn trả lại vào kho.",
      )
    ) {
      try {
        await receiptService.deleteExport(id);
        showToast("Đã hủy phiếu xuất và hoàn trả tồn kho thành công!");
        fetchData();
      } catch (e) {
        showToast(
          e.response?.data?.message || "Lỗi khi hủy phiếu xuất",
          "error",
        );
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
      {/* Header của Tab */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h3 className="font-bold text-slate-800 text-lg">
          Lịch sử Phiếu Xuất Kho
        </h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-amber-700 transition-colors shadow-md transform active:scale-95"
        >
          <Plus size={18} className="mr-2" /> TẠO PHIẾU XUẤT
        </button>
      </div>

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mb-3"></div>
            <p>Đang tải dữ liệu phiếu xuất...</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-bold">Mã Phiếu</th>
                <th className="px-6 py-4 font-bold">Ngày Xuất</th>
                <th className="px-6 py-4 font-bold">Nơi nhận / Người nhận</th>
                <th className="px-6 py-4 font-bold">Ghi chú</th>
                <th className="px-6 py-4 font-bold text-center">SL Loại VT</th>
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
                  <td className="px-6 py-4 font-bold text-amber-700">
                    {item.receiptCode ||
                      `PX-${item.id.toString().padStart(3, "0")}`}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {item.exportDate}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    <span className="font-semibold block">
                      {item.department || "-"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {item.recipient || ""}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 text-slate-500 max-w-[200px] truncate"
                    title={item.note}
                  >
                    {item.note || "-"}
                  </td>
                  <td className="px-6 py-4 font-bold text-center text-slate-700">
                    {item.exportItems?.length || 0}
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
                      onClick={() => setViewModalData(item)} // Gắn hàm này vào
                      className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye size={18} />
                    </button>
                    {item.status !== "CANCELLED" && (
                      <button
                        onClick={() => setEditModalData(item)}
                        className="p-2 text-amber-500 hover:bg-amber-100 rounded-lg transition-colors"
                        title="Chỉnh sửa phiếu"
                      >
                        <Edit size={18} />
                      </button>
                    )}

                    {item.status !== "CANCELLED" && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hủy phiếu"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    Chưa có phiếu xuất kho nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Điều khiển Phân trang */}
      {totalPages > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-sm text-slate-500 font-medium">
            Trang {page + 1} / {totalPages}
          </span>

          <div className="flex space-x-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-2 bg-white border border-slate-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors shadow-sm text-slate-600"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="p-2 bg-white border border-slate-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors shadow-sm text-slate-600"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Truyền Component CreateReceiptModal vào đây với type="export" */}
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

      {/* Thêm Modal Xem Chi Tiết vào đây */}
      <ViewReceiptModal
        isOpen={!!viewModalData}
        onClose={() => setViewModalData(null)}
        type="export"
        receiptData={viewModalData}
      />
    </div>
  );
}
