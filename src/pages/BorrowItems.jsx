import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, Edit, Trash2, Loader2, Package, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { borrowReturnService } from "../services/borrowReturnService";

export default function BorrowItems() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    unit: "Cái",
    totalQuantity: 1,
    createdBy: "admin"
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [keyword]);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await borrowReturnService.getBorrowItems(page, size, debouncedKeyword);
      setItems(res.data?.content || []);
      setTotalPages(res.data?.page?.totalPages || 0);
      setTotalElements(res.data?.page?.totalElements || 0);
    } catch (error) {
      showToast("Lỗi khi tải danh sách vật phẩm", "error");
    } finally {
      setIsLoading(false);
    }
  }, [page, size, debouncedKeyword, showToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc muốn xóa vật phẩm: ${name}?`)) {
      try {
        await borrowReturnService.deleteBorrowItem(id);
        showToast("Xóa thành công", "success");
        fetchItems();
      } catch (error) {
        showToast("Lỗi khi xóa vật phẩm", "error");
      }
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        description: item.description,
        unit: item.unit,
        totalQuantity: item.totalQuantity,
        createdBy: item.createdBy
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        category: "Thiết bị IT",
        description: "",
        unit: "Cái",
        totalQuantity: 1,
        createdBy: "admin"
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category || formData.totalQuantity < 1) {
      return showToast("Vui lòng điền đủ thông tin hợp lệ", "error");
    }

    try {
      if (editingItem) {
        await borrowReturnService.updateBorrowItem(editingItem.id, formData);
        showToast("Cập nhật thành công", "success");
      } else {
        await borrowReturnService.createBorrowItem(formData);
        showToast("Thêm mới thành công", "success");
      }
      setShowModal(false);
      fetchItems();
    } catch (error) {
      showToast(error.response?.data?.message || "Có lỗi xảy ra", "error");
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên vật phẩm..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm text-sm"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-5 py-3 bg-[#1a237e] text-white font-bold rounded-2xl hover:bg-[#0d145e] transition-colors shadow-md text-sm"
        >
          <Plus size={18} className="mr-2" /> THÊM VẬT PHẨM
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th className="p-5">Tên Vật Phẩm</th>
                <th className="p-5">Danh Mục</th>
                <th className="p-5 text-center">Tổng Số Lượng</th>
                <th className="p-5 text-center">Khả Dụng</th>
                <th className="p-5 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center">
                    <Loader2 className="animate-spin text-indigo-600 mx-auto mb-2" size={32} />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-500">
                    Chưa có vật phẩm nào.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5">
                      <div className="font-bold text-[#1a237e] flex items-center gap-2">
                        <Package size={16} className="text-slate-400" />
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</div>
                    </td>
                    <td className="p-5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-5 text-center font-bold text-slate-700">
                      {item.totalQuantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`font-bold ${item.availableQuantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {item.availableQuantity}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit size={16} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && items.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-sm mt-auto">
            <span className="text-slate-500 font-medium">
              Hiển thị <span className="font-bold text-[#1a237e]">{items.length}</span> / {totalElements}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 font-bold text-slate-700">
                Trang {page + 1} / {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b flex justify-between items-center bg-[#1a237e] text-white">
              <h3 className="font-bold text-lg">{editingItem ? "Sửa Vật Phẩm" : "Thêm Vật Phẩm Mới"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-xl">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tên vật phẩm *</label>
                <input
                  type="text"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Danh mục *</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Đơn vị tính</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tổng số lượng (Nhập kho)</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50"
                  value={formData.totalQuantity}
                  onChange={(e) => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mô tả chi tiết</label>
                <textarea
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 h-24 resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="pt-4 mt-2 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#1a237e] text-white font-bold rounded-xl hover:bg-[#0d145e] transition-colors"
                >
                  {editingItem ? "Lưu Thay Đổi" : "Tạo Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
