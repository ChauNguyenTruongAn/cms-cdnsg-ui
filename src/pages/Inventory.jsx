import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Scaling,
} from "lucide-react";
import { materialService } from "../services/materialService";
import { useToast } from "../context/ToastContext";
import EditMaterialModal from "../components/modals/EditMaterialModal";
import UnitManagerModal from "../components/modals/UnitManagerModal";

export default function Inventory() {
  const { showToast } = useToast();

  const [materials, setMaterials] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  // States Lọc & Tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // State cho phân trang (Đã nâng cấp)
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10); // Đổi từ const size = 20 thành State
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0); // Thêm tổng số dòng

  const [showModal, setShowModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: "", unit_id: "" });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState(null);

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load lại data khi đổi filterStatus HOẶC size
  useEffect(() => {
    fetchData();
  }, [page, size, debouncedSearch, filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [matsData, unitsData] = await Promise.all([
        materialService.getAllMaterials(
          page,
          size,
          "id",
          "desc",
          debouncedSearch,
          filterStatus,
        ),
        materialService.getAllUnits(),
      ]);

      setMaterials(matsData.data.content || []);
      setTotalPages(
        matsData.data.page?.totalPages || matsData.data.totalPages || 0,
      );
      setTotalElements(
        matsData.data.page?.totalElements || matsData.data.totalElements || 0,
      );

      setUnits(unitsData.data || []);
    } catch (error) {
      showToast("Không thể kết nối đến server backend!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.name || !newMaterial.unit_id) {
      showToast("Vui lòng nhập đủ tên và chọn đơn vị!", "error");
      return;
    }
    try {
      await materialService.createMaterial({
        name: newMaterial.name,
        unit_id: parseInt(newMaterial.unit_id),
      });
      showToast("Thêm vật tư thành công!");
      setShowModal(false);
      setNewMaterial({ name: "", unit_id: "" });

      if (page !== 0) setPage(0);
      else fetchData();
    } catch (error) {
      showToast("Có lỗi xảy ra khi thêm vật tư!", "error");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vật tư này?")) {
      try {
        await materialService.deleteMaterial(id);
        showToast("Đã xóa vật tư thành công!");
        fetchData();
      } catch (error) {
        showToast("Có lỗi xảy ra khi xóa vật tư!", "error");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4 flex flex-col h-full">
      {/* Thanh công cụ */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-4 flex-1 w-full bg-slate-50 p-3 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-[#1a237e]/20 focus-within:border-[#1a237e] transition-all">
          <Search className="text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm tên vật tư..."
            className="bg-transparent border-none focus:ring-0 w-full text-sm outline-none text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {/* LỌC TRẠNG THÁI */}
          <select
            className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none text-sm font-medium w-full md:w-auto focus:ring-2 focus:ring-[#1a237e]/20"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="OK">🟢 Ổn định (&gt;= 5)</option>
            <option value="LOW">🔴 Sắp hết (&lt; 5)</option>
          </select>

          {/* QUẢN LÝ ĐƠN VỊ TÍNH */}
          <button
            onClick={() => setIsUnitModalOpen(true)}
            className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-slate-200 whitespace-nowrap border"
          >
            <Scaling size={18} className="mr-2 text-indigo-500" /> ĐƠN VỊ TÍNH
          </button>

          {/* THÊM VẬT TƯ */}
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#1a237e] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-[#0d145e] w-full md:w-auto justify-center transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} className="mr-2" /> THÊM VẬT TƯ
          </button>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
            <Loader2 size={40} className="animate-spin text-[#1a237e] mb-4" />
            <p className="font-medium animate-pulse">
              Đang tải dữ liệu từ kho...
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">STT</th>
                    <th className="px-6 py-4 font-semibold">Tên Vật Tư</th>
                    <th className="px-6 py-4 font-semibold">Đơn Vị</th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Số lượng Tồn
                    </th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 font-semibold text-right">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="hover:bg-indigo-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm text-slate-400 font-medium">
                        {(page * size + idx + 1).toString().padStart(2, "0")}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.unit?.name || "-"}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm text-center font-bold ${item.inventory < 5 ? "text-red-600" : "text-slate-800"}`}
                      >
                        {item.inventory}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.inventory < 5 ? (
                          <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-bold uppercase animate-pulse border border-red-100">
                            SẮP HẾT
                          </span>
                        ) : (
                          <span className="bg-green-50 text-green-600 px-2 py-1 rounded text-[10px] font-bold uppercase border border-green-100">
                            ỔN ĐỊNH
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 flex space-x-3 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setMaterialToEdit(item);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {materials.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-12 text-center text-slate-500 text-sm"
                      >
                        Không tìm thấy vật tư nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang Nâng cao (Đồng bộ style với các màn hình khác) */}
            {!loading && materials.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm mt-auto">
                <span className="text-slate-500 font-medium">
                  Hiển thị{" "}
                  <span className="font-bold text-[#1a237e]">
                    {materials.length}
                  </span>{" "}
                  / tổng{" "}
                  <span className="font-bold text-[#1a237e]">
                    {totalElements}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="mr-2 text-slate-500">Số dòng/trang:</span>
                  <select
                    value={size}
                    onChange={(e) => {
                      setSize(Number(e.target.value));
                      setPage(0); // Reset về trang 1 khi đổi số dòng
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
                    className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-40 hover:bg-indigo-50 hover:text-[#1a237e] transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="px-4 py-2 font-bold text-slate-700">
                    Trang {page + 1} / {totalPages || 1}
                  </span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-40 hover:bg-indigo-50 hover:text-[#1a237e] transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Thêm Mới */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Plus className="mr-2 text-[#1a237e]" /> Thêm Vật tư mới
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
                  Tên vật tư
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên vật tư..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a237e]/50"
                  value={newMaterial.name}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider flex justify-between">
                  <span>Đơn vị tính</span>
                  {units.length === 0 && (
                    <span className="text-red-500">Chưa có đơn vị!</span>
                  )}
                </label>
                <select
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a237e]/50"
                  value={newMaterial.unit_id}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, unit_id: e.target.value })
                  }
                >
                  <option value="" disabled>
                    -- Chọn đơn vị tính --
                  </option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                {units.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-2 italic">
                    *Hãy đóng cửa sổ này và bấm "QUẢN LÝ ĐƠN VỊ TÍNH" để thêm
                    đơn vị trước.
                  </p>
                )}
              </div>
              <div className="flex space-x-3 pt-6 border-t border-slate-100 mt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleAddMaterial}
                  className="flex-1 px-4 py-3.5 bg-[#1a237e] text-white rounded-xl font-bold text-sm hover:bg-[#0d145e] shadow-lg transition-all"
                >
                  Lưu Vật Tư
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CÁC MODAL KHÁC */}
      <EditMaterialModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setMaterialToEdit(null);
        }}
        material={materialToEdit}
        units={units}
        onSave={fetchData}
      />

      <UnitManagerModal
        isOpen={isUnitModalOpen}
        onClose={() => {
          setIsUnitModalOpen(false);
          fetchData();
        }}
      />
    </div>
  );
}
