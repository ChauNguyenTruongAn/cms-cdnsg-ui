import React, { useState, useEffect } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Edit,
  ArrowRightLeft,
  Search,
  Eye,
  MonitorPlay,
} from "lucide-react";
import { projectorService } from "../../services/projectorService";
import { useToast } from "../../context/ToastContext";

export default function BorrowTab() {
  const { showToast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectors, setProjectors] = useState([]);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [isBorrowOpen, setIsBorrowOpen] = useState(false);
  const [isViewEditOpen, setIsViewEditOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [borrowForm, setBorrowForm] = useState({
    projectorIds: [],
    borrower: "",
    borrowDate: new Date().toISOString().split("T")[0],
    note: "",
  });

  const [editForm, setEditForm] = useState({
    borrower: "",
    borrowDate: "",
    returnDate: "",
    note: "",
  });

  const [returnNote, setReturnNote] = useState("");
  const [nextStatus, setNextStatus] = useState("AVAILABLE");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch, filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await projectorService.getAllLoans(
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
      showToast("Lỗi tải lịch sử mượn trả", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBorrow = async () => {
    try {
      const res = await projectorService.getAllProjectors(0, 1000);
      const availableOnly = (res.content || []).filter(
        (p) => p.status === "AVAILABLE",
      );
      setProjectors(availableOnly);
      setBorrowForm({
        projectorIds: [],
        borrower: "",
        borrowDate: new Date().toISOString().split("T")[0],
        note: "",
      });
      setIsBorrowOpen(true);
    } catch (error) {
      showToast("Lỗi tải danh mục", "error");
    }
  };

  const handleOpenViewEdit = (loan) => {
    setSelectedLoan(loan);
    setEditForm({
      borrower: loan.borrower,
      borrowDate: loan.borrowDate,
      returnDate: loan.returnDate || "",
      note: loan.note || "",
    });
    setIsViewEditOpen(true);
  };

  const submitCreateBorrow = async () => {
    if (
      !borrowForm.borrower ||
      !borrowForm.borrowDate ||
      borrowForm.projectorIds.length === 0
    ) {
      return showToast(
        "Vui lòng chọn ít nhất 1 máy chiếu và nhập tên người mượn!",
        "error",
      );
    }
    setIsSaving(true);
    try {
      await projectorService.borrowProjector({
        ...borrowForm,
        projectorIds: borrowForm.projectorIds.map((id) => parseInt(id)),
      });
      showToast("Đã tạo phiếu mượn thành công!");
      setIsBorrowOpen(false);
      fetchData();
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi xử lý!", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const submitEditLoan = async () => {
    if (!editForm.borrower || !editForm.borrowDate)
      return showToast("Không được để trống Tên và Ngày mượn!", "error");
    setIsSaving(true);
    try {
      await projectorService.updateLoan(selectedLoan.id, editForm);
      showToast("Đã cập nhật chi tiết phiếu!");
      setIsViewEditOpen(false);
      fetchData();
    } catch (error) {
      showToast("Lỗi cập nhật", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const submitReturn = async () => {
    setIsSaving(true);
    try {
      await projectorService.returnProjector(
        selectedLoan.id,
        returnNote,
        nextStatus,
      );
      showToast("Đã nhận trả máy chiếu thành công!");
      setIsReturnOpen(false);
      fetchData();
    } catch (error) {
      showToast("Lỗi khi trả máy!", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // HÀM ĐÃ ĐƯỢC SỬA LỖI - Đọc dữ liệu trực tiếp từ Backend trả về
  const getProjectorName = (item) => {
    return item.projector?.name || "Không rõ máy chiếu";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center w-full md:w-96 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <Search className="text-slate-400 mr-2" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm người mượn..."
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
            <option value="BORROWING">Đang mượn (Chưa trả)</option>
            <option value="RETURNED">Đã trả máy</option>
          </select>
        </div>
        <button
          onClick={handleOpenBorrow}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center hover:bg-indigo-700"
        >
          <Plus size={18} className="mr-2" /> TẠO PHIẾU MƯỢN
        </button>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-400">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Tên Máy (Phiếu)</th>
                <th className="px-6 py-4">Người Mượn</th>
                <th className="px-6 py-4">Ngày Mượn</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-indigo-50/30 transition-colors group"
                >
                  <td className="px-6 py-4 font-bold text-slate-800">
                    <div className="flex items-center">
                      <MonitorPlay size={16} className="text-indigo-400 mr-2" />
                      <div>
                        {getProjectorName(item)}
                        <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                          SN: {item.projector?.serialNumber}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-700">
                    {item.borrower}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {item.borrowDate}
                  </td>
                  <td className="px-6 py-4">
                    {item.status === "RETURNED" ? (
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded text-[10px] font-bold">
                        ĐÃ TRẢ
                      </span>
                    ) : (
                      <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded text-[10px] font-bold animate-pulse">
                        ĐANG MƯỢN
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleOpenViewEdit(item)}
                      className="px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold border transition-colors flex items-center"
                    >
                      <Eye size={14} className="mr-1.5" /> CHI TIẾT
                    </button>
                    {item.status === "BORROWING" && (
                      <button
                        onClick={() => {
                          setSelectedLoan(item);
                          setReturnNote("");
                          setNextStatus("AVAILABLE");
                          setIsReturnOpen(true);
                        }}
                        className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg text-xs font-bold border border-green-200 transition-colors flex items-center"
                      >
                        <ArrowRightLeft size={14} className="mr-1.5" /> NHẬN LẠI
                      </button>
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
                    Không tìm thấy phiếu mượn nào.
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
              className="p-2 border rounded bg-white"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 border rounded bg-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: TẠO PHIẾU MƯỢN (CHỌN NHIỀU MÁY) */}
      {isBorrowOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center">
                <Plus size={20} className="mr-2" /> Tạo Phiếu Mượn Mới
              </h3>
              <button
                onClick={() => setIsBorrowOpen(false)}
                className="hover:bg-indigo-700 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto bg-slate-50 flex-1">
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <label className="block text-xs font-bold text-slate-600 mb-3 uppercase">
                  1. Chọn các máy chiếu muốn mượn (
                  {borrowForm.projectorIds.length} máy đang chọn)
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                  {projectors.map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center p-3 mb-1 rounded-lg cursor-pointer border transition-colors ${borrowForm.projectorIds.includes(p.id) ? "bg-indigo-50 border-indigo-200" : "bg-white hover:border-indigo-300"}`}
                    >
                      <input
                        type="checkbox"
                        className="mr-3 w-4 h-4 text-indigo-600 rounded cursor-pointer"
                        checked={(borrowForm.projectorIds || []).includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setBorrowForm({
                              ...borrowForm,
                              projectorIds: [...borrowForm.projectorIds, p.id],
                            });
                          else
                            setBorrowForm({
                              ...borrowForm,
                              projectorIds: borrowForm.projectorIds.filter(
                                (id) => id !== p.id,
                              ),
                            });
                        }}
                      />
                      <span className="text-sm font-bold text-slate-700">
                        {p.name}{" "}
                        <span className="text-xs text-slate-400 font-normal ml-2">
                          SN: {p.serialNumber}
                        </span>
                      </span>
                    </label>
                  ))}
                  {projectors.length === 0 && (
                    <p className="text-xs text-center text-slate-400 py-6">
                      Tất cả máy chiếu hiện đã được mượn hoặc hỏng.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                  2. Thông tin người mượn
                </label>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Tên / Đơn vị mượn *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={borrowForm.borrower}
                    onChange={(e) =>
                      setBorrowForm({ ...borrowForm, borrower: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Ngày mượn *
                    </label>
                    <input
                      type="date"
                      className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      value={borrowForm.borrowDate}
                      onChange={(e) =>
                        setBorrowForm({
                          ...borrowForm,
                          borrowDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Ghi chú
                    </label>
                    <input
                      type="text"
                      placeholder="Mục đích sử dụng..."
                      className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      value={borrowForm.note}
                      onChange={(e) =>
                        setBorrowForm({ ...borrowForm, note: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-white flex space-x-3">
              <button
                onClick={() => setIsBorrowOpen(false)}
                className="flex-1 py-3 border font-bold text-slate-600 rounded-xl hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={submitCreateBorrow}
                disabled={isSaving || borrowForm.projectorIds.length === 0}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin mr-2" />
                ) : (
                  "Xác nhận tạo phiếu"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: XEM & SỬA CHI TIẾT PHIẾU (1 MÁY) */}
      {isViewEditOpen && selectedLoan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
            <div className="p-5 border-b bg-slate-50 flex justify-between items-center rounded-t-2xl">
              <h3 className="font-bold text-slate-800 text-lg flex items-center">
                <Edit size={18} className="mr-2 text-indigo-600" /> Chi Tiết
                Phiếu Mượn
              </h3>
              <button
                onClick={() => setIsViewEditOpen(false)}
                className="hover:bg-slate-200 p-1.5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-white">
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl mb-4">
                <p className="text-xs text-slate-500 font-semibold mb-1">
                  Máy chiếu đang mượn:
                </p>
                <p className="font-bold text-indigo-800">
                  {getProjectorName(selectedLoan)}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  SN: {selectedLoan.projector?.serialNumber}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Tên / Đơn vị mượn *
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editForm.borrower}
                  onChange={(e) =>
                    setEditForm({ ...editForm, borrower: e.target.value })
                  }
                  disabled={selectedLoan.status === "RETURNED"}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Ngày mượn *
                  </label>
                  <input
                    type="date"
                    className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={editForm.borrowDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, borrowDate: e.target.value })
                    }
                    disabled={selectedLoan.status === "RETURNED"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Ngày trả
                  </label>
                  <input
                    type="date"
                    className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={editForm.returnDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, returnDate: e.target.value })
                    }
                    disabled={selectedLoan.status === "RETURNED"}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Ghi chú / Mục đích
                </label>
                <textarea
                  rows="2"
                  className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editForm.note}
                  onChange={(e) =>
                    setEditForm({ ...editForm, note: e.target.value })
                  }
                  disabled={selectedLoan.status === "RETURNED"}
                />
              </div>

              {selectedLoan.status === "RETURNED" && (
                <p className="text-xs text-red-500 italic font-medium mt-2">
                  * Phiếu mượn này đã hoàn tất trả máy, không thể chỉnh sửa
                  thêm.
                </p>
              )}
            </div>

            <div className="p-4 border-t bg-slate-50 flex space-x-3 rounded-b-2xl">
              <button
                onClick={() => setIsViewEditOpen(false)}
                className="flex-1 py-2.5 border font-bold text-slate-600 rounded-xl hover:bg-slate-100"
              >
                Đóng
              </button>
              {selectedLoan.status === "BORROWING" && (
                <button
                  onClick={submitEditLoan}
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex justify-center items-center"
                >
                  {isSaving ? (
                    <Loader2 size={18} className="animate-spin mr-2" />
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TRẢ MÁY (Giữ nguyên) */}
      {isReturnOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col">
            <div className="p-5 border-b bg-green-600 text-white rounded-t-2xl">
              <h3 className="font-bold text-lg flex items-center">
                <ArrowRightLeft size={18} className="mr-2" /> Xác nhận nhận lại
                máy
              </h3>
              <p className="text-sm mt-1 opacity-90">
                Người trả: <strong>{selectedLoan?.borrower}</strong>
              </p>
            </div>
            <div className="p-5 space-y-4 bg-white">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  Trạng thái máy sau khi nhận *
                </label>
                <select
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium focus:ring-2 focus:ring-green-500"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                >
                  <option value="AVAILABLE">
                    ✅ Tốt - Sẵn sàng cho mượn tiếp
                  </option>
                  <option value="UNDER_MAINTENANCE">
                    ⚠️ Cần vệ sinh / Bảo trì
                  </option>
                  <option value="BROKEN">❌ Hư hỏng nặng</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  Ghi chú tình trạng
                </label>
                <textarea
                  className="w-full p-3 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  placeholder="Máy xước vỏ..."
                />
              </div>
            </div>
            <div className="p-4 border-t bg-slate-50 flex space-x-3 rounded-b-2xl">
              <button
                onClick={() => setIsReturnOpen(false)}
                className="flex-1 py-2.5 border font-bold text-slate-600 rounded-xl hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={submitReturn}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex justify-center items-center shadow-lg shadow-green-100"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin mr-2" />
                ) : (
                  "Hoàn tất thu hồi"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
