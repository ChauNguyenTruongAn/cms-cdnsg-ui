import React, { useState, useEffect } from "react";
import {
  Search,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Trash2,
  Download,
  Loader2,
  X,
  FolderOpen,
  File,
  Eye,
  Layers,
  Plus,
} from "lucide-react";
import { mediaService } from "../services/mediaService";
import { useToast } from "../context/ToastContext";

export default function Docs() {
  const { showToast } = useToast();

  // Dữ liệu tài liệu
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dữ liệu Danh mục (Loại)
  const [categories, setCategories] = useState([]);

  // State lọc và tìm kiếm
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // State Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State thêm Category
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSavingCat, setIsSavingCat] = useState(false);

  // Form tải lên
  const [uploadForm, setUploadForm] = useState({
    file: null,
    name: "",
    category: "",
    description: "",
  });
  const [previewUrl, setPreviewUrl] = useState(null);

  // Debounce tìm kiếm
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch dữ liệu mỗi khi đổi trang, tìm kiếm hoặc lọc
  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch, filterCategory]);

  // Fetch danh mục một lần khi load trang
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await mediaService.getAllFiles(
        page,
        12,
        debouncedSearch,
        filterCategory,
      );
      setData(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (error) {
      showToast("Lỗi tải danh sách tài liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await mediaService.getCategories();
      setCategories(res || []);
    } catch (error) {
      showToast("Lỗi tải danh mục", "error");
    }
  };

  /* QUẢN LÝ TÀI LIỆU */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm({ ...uploadForm, file, name: file.name.split(".")[0] });
      if (file.type.startsWith("image/"))
        setPreviewUrl(URL.createObjectURL(file));
      else setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file)
      return showToast("Vui lòng chọn 1 file để tải lên!", "error");
    if (!uploadForm.category)
      return showToast("Vui lòng chọn Loại tài liệu!", "error");

    setIsSaving(true);
    try {
      await mediaService.uploadFile(
        uploadForm.file,
        uploadForm.name,
        uploadForm.category,
        uploadForm.description,
      );
      showToast("Đã tải file lên kho lưu trữ thành công!");
      setIsUploadOpen(false);
      setUploadForm({ file: null, name: "", category: "", description: "" });
      setPreviewUrl(null);
      fetchData();
    } catch (error) {
      showToast("Lỗi khi tải file lên!", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Hành động này sẽ xóa vĩnh viễn file trên hệ thống đám mây. Tiếp tục?",
      )
    ) {
      try {
        await mediaService.deleteFile(id);
        showToast("Đã xóa file!");
        fetchData();
      } catch (error) {
        showToast("Lỗi khi xóa file", "error");
      }
    }
  };

  /* QUẢN LÝ DANH MỤC (LOẠI) */
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSavingCat(true);
    try {
      await mediaService.createCategory({ name: newCategoryName });
      showToast("Thêm loại mới thành công!");
      setNewCategoryName("");
      fetchCategories();
    } catch (error) {
      showToast("Loại này đã tồn tại hoặc có lỗi xảy ra", "error");
    } finally {
      setIsSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Bạn muốn xóa loại tài liệu này?")) {
      try {
        await mediaService.deleteCategory(id);
        showToast("Đã xóa loại tài liệu!");
        fetchCategories();
      } catch (error) {
        showToast(
          "Không thể xóa do đang có tài liệu sử dụng loại này!",
          "error",
        );
      }
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
      {/* Header & Công cụ */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center w-full md:w-96 bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
          <Search className="text-slate-400 mr-2" size={20} />
          <input
            type="text"
            placeholder="Tìm tên văn bản, mô tả..."
            className="bg-transparent border-none outline-none w-full text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {/* LỌC THEO LOẠI (DỮ LIỆU ĐỘNG) */}
          <select
            className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none text-sm font-medium w-full md:w-auto focus:ring-2 focus:ring-indigo-500"
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(0);
            }}
          >
            <option value="">📁 Tất cả các loại</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-slate-200 whitespace-nowrap border"
          >
            <Layers size={18} className="mr-2 text-indigo-500" /> QUẢN LÝ LOẠI
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="bg-[#1a237e] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-[#0d145e] shadow-lg shadow-indigo-200 whitespace-nowrap"
          >
            <UploadCloud size={18} className="mr-2" /> TẢI LÊN
          </button>
        </div>
      </div>

      {/* Grid hiển thị File */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Loader2 size={32} className="animate-spin text-[#1a237e] mb-3" />
          <p>Đang tải dữ liệu đám mây...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-300">
          <FolderOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">
            Kho lưu trữ đang trống hoặc không có kết quả lọc.
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Hãy tải lên các tài liệu hoặc hình ảnh thiết bị.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.map((item) => {
            const isImage = item.fileType?.includes("image");
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group flex flex-col"
              >
                {/* Thumbnail Area */}
                <div className="h-44 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                  {isImage ? (
                    <img
                      src={item.fileUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <FileText size={48} className="text-indigo-300" />
                  )}
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-white text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors shadow-lg"
                      title="Xem chi tiết"
                    >
                      <Eye size={18} />
                    </a>
                    <a
                      href={item.fileUrl}
                      download
                      className="p-2 bg-white text-emerald-600 rounded-full hover:bg-emerald-50 transition-colors shadow-lg"
                      title="Tải xuống"
                    >
                      <Download size={18} />
                    </a>
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      className="font-bold text-slate-800 text-sm line-clamp-2"
                      title={item.name}
                    >
                      {item.name}
                    </h3>
                    {isImage ? (
                      <ImageIcon
                        size={16}
                        className="text-indigo-500 shrink-0 ml-2"
                      />
                    ) : (
                      <File
                        size={16}
                        className="text-slate-500 shrink-0 ml-2"
                      />
                    )}
                  </div>
                  <div className="mt-auto">
                    <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100 mb-2">
                      {item.category}
                    </span>
                    <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-100 pt-3 mt-1">
                      <span>{formatBytes(item.fileSize)}</span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 bg-red-50 rounded"
                        title="Xóa file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL UPLOAD */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-xl text-slate-800 flex items-center">
                <UploadCloud className="mr-2 text-indigo-600" /> Tải File Lên
                Đám Mây
              </h3>
              <button
                onClick={() => {
                  setIsUploadOpen(false);
                  setPreviewUrl(null);
                }}
                className="p-2 bg-white border hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-white">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
                {previewUrl ? (
                  <div className="mx-auto w-32 h-32 rounded-lg overflow-hidden border shadow-sm">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : uploadForm.file ? (
                  <div className="flex flex-col items-center">
                    <FileText size={40} className="text-indigo-400 mb-2" />
                    <p className="text-sm font-bold text-indigo-700">
                      {uploadForm.file.name}
                    </p>
                  </div>
                ) : (
                  <>
                    <UploadCloud
                      size={40}
                      className="mx-auto text-indigo-300 mb-2"
                    />
                    <p className="text-sm font-bold text-slate-600">
                      Kéo thả file hoặc Click để chọn
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Hỗ trợ: JPG, PNG, PDF, DOCX, XLSX
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Tên văn bản / Mô tả ngắn *
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={uploadForm.name}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, name: e.target.value })
                    }
                    placeholder="VD: Hóa đơn mua máy chiếu tháng 10..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Loại tài liệu *
                  </label>
                  <select
                    className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    value={uploadForm.category}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, category: e.target.value })
                    }
                  >
                    <option value="">-- Chọn Loại tài liệu --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-[10px] text-amber-500 mt-1 italic">
                      *Hãy ra ngoài bấm "QUẢN LÝ LOẠI" để tạo loại trước khi tải
                      lên.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-50 flex gap-3">
              <button
                onClick={() => {
                  setIsUploadOpen(false);
                  setPreviewUrl(null);
                }}
                className="flex-1 py-3 bg-white border text-slate-700 font-bold rounded-xl hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={handleUpload}
                disabled={isSaving || !uploadForm.file}
                className="flex-1 py-3 bg-[#1a237e] text-white font-bold rounded-xl hover:bg-[#0d145e] disabled:opacity-50 flex justify-center items-center shadow-lg shadow-indigo-200"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin mr-2" />
                ) : (
                  "Xác nhận tải lên"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL QUẢN LÝ DANH MỤC TÀI LIỆU */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center">
                <Layers className="mr-2 text-indigo-600" /> Quản lý Loại Tài
                liệu
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 bg-white border hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nhập tên loại mới (VD: Biên bản)..."
                  className="flex-1 p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                />
                <button
                  onClick={handleAddCategory}
                  disabled={isSavingCat || !newCategoryName.trim()}
                  className="bg-indigo-600 text-white px-5 rounded-xl font-bold hover:bg-indigo-700 flex items-center disabled:opacity-50 transition-colors shadow-md"
                >
                  {isSavingCat ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                </button>
              </div>

              <div className="mt-4 border border-slate-100 rounded-xl max-h-60 overflow-y-auto">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center p-3 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-semibold text-slate-700 text-sm flex items-center">
                      <FolderOpen size={16} className="mr-2 text-slate-400" />{" "}
                      {c.name}
                    </span>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Xóa loại này"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-6">
                    Bạn chưa tạo loại tài liệu nào.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
