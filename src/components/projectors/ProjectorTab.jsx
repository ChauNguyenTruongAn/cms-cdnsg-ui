import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Eye,
} from "lucide-react";
import { projectorService } from "../../services/projectorService";
import { useToast } from "../../context/ToastContext";
import ProjectorHistoryModal from "../modals/ProjectorHistoryModal"; // Import Modal lịch sử

const statusConfig = {
  AVAILABLE: {
    label: "SẴN SÀNG",
    color: "bg-green-50 text-green-600 border-green-200",
  },
  BORROWED: {
    label: "ĐANG MƯỢN",
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  UNDER_MAINTENANCE: {
    label: "ĐANG BẢO TRÌ",
    color: "bg-amber-50 text-amber-600 border-amber-200",
  },
  BROKEN: { label: "ĐÃ HỎNG", color: "bg-red-50 text-red-600 border-red-200" },
};

export default function ProjectorTab() {
  const { showToast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({ name: "", serialNumber: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Thêm State để quản lý Modal xem lịch sử
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedProjectorHistory, setSelectedProjectorHistory] =
    useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // SỬA LỖI LỌC: Thêm filterStatus vào mảng phụ thuộc
  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch, filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await projectorService.getAllProjectors(
        page,
        10,
        "id",
        "desc",
        debouncedSearch,
        filterStatus,
      );
      setData(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (error) {
      showToast("Lỗi tải danh sách máy chiếu", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    setEditData(item);
    setFormData(
      item
        ? { name: item.name, serialNumber: item.serialNumber }
        : { name: "", serialNumber: "" },
    );
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.serialNumber)
      return showToast("Vui lòng nhập đủ thông tin!", "error");
    setIsSaving(true);
    try {
      if (editData) {
        await projectorService.updateProjector(editData.id, formData);
        showToast("Cập nhật thành công!");
      } else {
        await projectorService.createProjector(formData);
        showToast("Thêm mới thành công!");
        setPage(0);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Lỗi khi lưu dữ liệu!",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa máy chiếu này?")) {
      try {
        await projectorService.deleteProjector(id);
        showToast("Đã xóa máy chiếu!");
        fetchData();
      } catch (error) {
        showToast("Không thể xóa do bị ràng buộc dữ liệu.", "error");
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center w-full md:w-96 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <Search className="text-slate-400 mr-2" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo Tên hoặc Số Serial..."
            className="bg-transparent border-none outline-none w-full text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg outline-none text-sm font-medium"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="AVAILABLE">Sẵn sàng</option>
            <option value="BORROWED">Đang cho mượn</option>
            <option value="UNDER_MAINTENANCE">Đang bảo trì</option>
            <option value="BROKEN">Đã hỏng</option>
          </select>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#1a237e] text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center hover:bg-[#0d145e]"
        >
          <Plus size={18} className="mr-2" /> THÊM MÁY CHIẾU
        </button>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 size={32} className="animate-spin text-[#1a237e] mb-3" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Tên Máy Chiếu</th>
                <th className="px-6 py-4">Số Serial</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item, idx) => {
                const status =
                  statusConfig[item.status] || statusConfig.AVAILABLE;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {page * 10 + idx + 1}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {item.serialNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`border px-2.5 py-1 rounded text-[10px] font-bold ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* NÚT XEM LỊCH SỬ TỪNG MÁY */}
                      <button
                        onClick={() => {
                          setSelectedProjectorHistory(item);
                          setIsHistoryOpen(true);
                        }}
                        className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg"
                        title="Xem lịch sử"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg"
                        title="Sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    Không tìm thấy máy chiếu nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 0 && (
        <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Trang {page + 1} / {totalPages}
          </span>
          <div className="flex space-x-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 border rounded"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 border rounded"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {editData ? "Sửa Máy Chiếu" : "Thêm Máy Chiếu Mới"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Tên máy chiếu *
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-50 border rounded-lg"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Số Serial *
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-50 border rounded-lg"
                  value={formData.serialNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, serialNumber: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="p-5 border-t bg-slate-50 flex space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-white border font-bold rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 bg-[#1a237e] text-white font-bold rounded-lg flex justify-center"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Lưu dữ liệu"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LỊCH SỬ */}
      <ProjectorHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        projector={selectedProjectorHistory}
      />
    </div>
  );
}
