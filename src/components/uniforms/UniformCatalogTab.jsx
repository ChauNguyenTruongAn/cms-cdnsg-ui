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
} from "lucide-react";
import { uniformService } from "../../services/uniformService";
import { useToast } from "../../context/ToastContext";

export default function UniformCatalogTab() {
  const { showToast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // States Phân trang & Tìm kiếm
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // States Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({ type: "", size: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Xử lý Debounce tìm kiếm 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Gọi API với phân trang và từ khóa
      const res = await uniformService.getAllUniforms(
        page,
        10,
        debouncedSearch,
      );
      setData(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (error) {
      showToast("Lỗi tải danh mục đồng phục", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    setEditData(item);
    setFormData(
      item ? { type: item.type, size: item.size } : { type: "", size: "" },
    );
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.type || !formData.size)
      return showToast("Vui lòng nhập đủ Loại và Size!", "error");
    setIsSaving(true);
    try {
      if (editData) {
        await uniformService.updateUniform(editData.id, formData);
        showToast("Cập nhật thành công!");
      } else {
        await uniformService.createUniform(formData);
        showToast("Thêm mới thành công!");
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
    if (window.confirm("Bạn có chắc chắn muốn xóa loại đồng phục này?")) {
      try {
        await uniformService.deleteUniform(id);
        showToast("Đã xóa thành công!");
        fetchData();
      } catch (error) {
        showToast(
          "Không thể xóa: Loại đồng phục này đã có dữ liệu nhập/xuất.",
          "error",
        );
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Search & Action Bar */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm theo loại (Áo, quần...) hoặc size..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center hover:bg-indigo-700 w-full md:w-auto justify-center shadow-md transition-transform active:scale-95"
        >
          <Plus size={18} className="mr-2" /> THÊM MỚI
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 size={32} className="animate-spin text-indigo-600 mb-3" />
            <p className="animate-pulse">Đang tải danh sách...</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Loại Đồng Phục</th>
                <th className="px-6 py-4">Kích cỡ (Size)</th>
                <th className="px-6 py-4">Tồn kho hiện tại</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-6 py-4 text-slate-400 font-mono">
                    #{item.id}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {item.type}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 rounded text-slate-600 font-bold">
                      {item.size}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 font-bold ${item.stock <= 5 ? "text-red-500" : "text-slate-700"}`}
                  >
                    {item.stock} cái
                    {item.stock <= 5 && (
                      <span className="ml-2 text-[10px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded uppercase">
                        Sắp hết
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
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
                    Không có dữ liệu đồng phục nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Trang {page + 1} / {totalPages}
          </span>
          <div className="flex space-x-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 bg-white border rounded-md hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 bg-white border rounded-md hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-indigo-600 text-white rounded-t-xl">
              <h3 className="font-bold text-lg">
                {editData ? "Cập nhật đồng phục" : "Thêm loại đồng phục mới"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                  Loại đồng phục *
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  placeholder="VD: Áo thun nam, Chân váy..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                  Kích cỡ (Size) *
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                  placeholder="VD: M, L, XL, 32..."
                />
              </div>
            </div>
            <div className="p-5 border-t bg-slate-50 rounded-b-xl flex space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-white border text-slate-600 font-bold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex justify-center items-center shadow-lg transition-all"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin mr-2" />
                ) : (
                  "Lưu dữ liệu"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
