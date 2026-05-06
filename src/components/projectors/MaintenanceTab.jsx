import React, { useState, useEffect } from "react";
import {
  Wrench,
  Loader2,
  X,
  CheckCircle,
  Clock,
  History,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
} from "lucide-react";
import { projectorService } from "../../services/projectorService";
import { useToast } from "../../context/ToastContext";

export default function MaintenanceTab() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [allProjectorsList, setAllProjectorsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // States phân trang & lọc
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isCompleteTicketOpen, setIsCompleteTicketOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [ticketForm, setTicketForm] = useState({
    ticketCode: "",
    startDate: new Date().toISOString().split("T")[0],
    technician: "",
    generalNote: "",
  });
  const [selectedProjectors, setSelectedProjectors] = useState([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setPage(0);
  }, [filterStatus, size]);

  useEffect(() => {
    fetchData();
  }, [page, size, debouncedSearch, filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await projectorService.getAllTickets(
        page,
        size,
        debouncedSearch,
        filterStatus,
      );
      // API trả về content trực tiếp hoặc trong res.data tùy thuộc vào service của bạn
      setTickets(res.data.content || []);

      setTotalPages(res.data.page?.totalPages || 0);
      setTotalElements(res.data.page?.totalElements || 0);
    } catch (error) {
      showToast("Lỗi tải danh sách bảo trì", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadAllProjectors = async () => {
    try {
      const res = await projectorService.getAllProjectors(0, 1000);
      setAllProjectorsList(res.data.content || []);
    } catch (error) {
      console.log(error);
    }
  };

  const openCreateModal = () => {
    loadAllProjectors();
    setSelectedTicket(null);
    setTicketForm({
      ticketCode: "",
      startDate: new Date().toISOString().split("T")[0],
      technician: "",
      generalNote: "",
    });
    setSelectedProjectors([]);
    setIsTicketModalOpen(true);
  };

  const deleteTicket = async (id) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa phiếu mượn này? Hành động này không thể hoàn tác.",
      )
    )
      return;
    await projectorService.deleteTicketById(id);
    fetchData();
  };

  const submitCreateTicket = async () => {
    if (selectedProjectors.length === 0 || !ticketForm.technician)
      return showToast("Vui lòng điền đủ thông tin bắt buộc!", "error");
    setIsSaving(true);
    try {
      const payload = { ...ticketForm, projectorIds: selectedProjectors };
      await projectorService.createTicket(payload);
      showToast("Đã tạo phiếu bảo trì!");
      setIsTicketModalOpen(false);
      fetchData();
    } catch (error) {
      showToast("Lỗi tạo phiếu", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const [completeForm, setCompleteForm] = useState({
    date: new Date().toISOString().split("T")[0],
    items: [],
  });

  const submitCompleteTicket = async () => {
    setIsSaving(true);
    try {
      // Tạo payload với đúng format JSON
      const payload = {
        completionDate: completeForm.date,
        items: completeForm.items.map((item) => ({
          id: item.projectorId, // Phải là ID của máy chiếu
          nextStatus: item.nextStatus,
        })),
      };

      // Gọi API
      await projectorService.completeTicket(selectedTicket.id, payload);

      showToast("Đã hoàn tất phiếu bảo trì!");
      setIsCompleteTicketOpen(false);
      fetchData(); // Tải lại danh sách
    } catch (error) {
      showToast("Lỗi hoàn tất phiếu", "error");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Cập nhật lại logic mở modal để lưu đúng projectorId
  const openCompleteModal = (ticket) => {
    setSelectedTicket(ticket);
    setCompleteForm({
      date: new Date().toISOString().split("T")[0],
      items: ticket.details.map((d) => ({
        detailId: d.id,
        projectorId: d.projector.id, // Lưu ID máy chiếu để gửi về cho Backend
        name: d.projector.name,
        nextStatus: "AVAILABLE",
      })),
    });
    setIsCompleteTicketOpen(true);
  };

  const translateStatus = (value) => {
    switch (value) {
      case "BORROWED":
        return "Đang mượn";
      case "BROKEN":
        return "Hư hỏng";
      case "UNDER_MAINTENANCE":
        return "Đang bảo trì";
      case "AVAILABLE":
        return "Sẵn sàn cho mượn";
      case "IN_USE":
        return "Đang dùng";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Người bảo trì, mã phiếu..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm text-slate-600 font-medium"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="IN_PROGRESS">Đang bảo trì</option>
            <option value="COMPLETED">Đã hoàn thành</option>
          </select>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-amber-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center hover:bg-amber-700 justify-center shadow-md transition-transform active:scale-95"
        >
          <Wrench size={18} className="mr-2" /> TẠO PHIẾU BẢO TRÌ
        </button>
      </div>

      <div className="overflow-x-auto min-h-[400px] flex-1 flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 size={32} className="animate-spin text-amber-600 mb-3" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Mã Phiếu</th>
                <th className="px-6 py-4">Kỹ thuật viên</th>
                <th className="px-6 py-4">Danh sách máy</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td>{t.ticketCode || `#BT-${t.id}`}</td>
                  <td>{t.technician || "N/A"}</td>
                  <td>
                    <ul className="list-disc pl-4 text-xs">
                      {/* SỬA: Dùng .details thay vì .items */}
                      {t.details?.map((d) => (
                        <li key={d.id}>
                          {d.projector?.name}{" "}
                          {/* SỬA: Truy cập qua object projector */}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {t.status === "IN_PROGRESS" ? (
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-amber-50 text-amber-600 border-amber-200">
                        ĐANG XỬ LÝ
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-green-50 text-green-600 border-green-200">
                        HOÀN TẤT
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex justify-end space-x-2">
                    {t.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => openCompleteModal(t)}
                        className="px-3 py-1.5 bg-green-100 text-green-700 font-bold text-xs rounded-lg hover:bg-green-200 transition-colors"
                      >
                        CHỐT PHIẾU
                      </button>
                    )}
                    <button
                      onClick={() => deleteTicket(t.id)}
                      className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center"
                      title="Xóa phiếu"
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

      {/* THANH PHÂN TRANG */}
      {!loading && tickets.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm mt-auto">
          <span className="text-slate-500 font-medium">
            Hiển thị{" "}
            <span className="font-bold text-slate-800">{tickets.length}</span>{" "}
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
              className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-40 hover:bg-amber-50 hover:text-amber-600 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 py-2 font-bold text-slate-700">
              Trang {page + 1} / {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-40 hover:bg-amber-50 hover:text-amber-600 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* CÁC MODAL BÊN DƯỚI GIỮ NGUYÊN ... */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-amber-600 text-white">
              <h3 className="font-bold text-lg flex items-center">
                Tạo Phiếu Bảo Trì Sửa Chữa
              </h3>
              <button onClick={() => setIsTicketModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">
                    Mã phiếu (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    value={ticketForm.ticketCode}
                    onChange={(e) =>
                      setTicketForm({
                        ...ticketForm,
                        ticketCode: e.target.value,
                      })
                    }
                    placeholder="Tự động gen nếu để trống"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    value={ticketForm.startDate}
                    onChange={(e) =>
                      setTicketForm({
                        ...ticketForm,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Kỹ thuật viên / Đơn vị sửa chữa *
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  value={ticketForm.technician}
                  onChange={(e) =>
                    setTicketForm({ ...ticketForm, technician: e.target.value })
                  }
                  placeholder="VD: Anh Tuấn IT / Cty Minh Long"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Chọn Máy Chiếu cần sửa * (Nhiều máy)
                </label>
                <div className="bg-slate-50 p-3 rounded-xl border max-h-48 overflow-y-auto space-y-2">
                  {allProjectorsList.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer border border-transparent hover:border-slate-200 transition-all"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-amber-600"
                        checked={selectedProjectors.includes(p.id)}
                        onChange={(e) => {
                          const ids = e.target.checked
                            ? [...selectedProjectors, p.id]
                            : selectedProjectors.filter((id) => id !== p.id);
                          setSelectedProjectors(ids);
                        }}
                      />
                      <span className="font-semibold text-slate-700">
                        {p.name}{" "}
                        <span className="text-xs text-slate-400 font-normal">
                          ({p.serialNumber}) - {translateStatus(p.status)}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-slate-50 flex space-x-3">
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="flex-1 py-3 border font-bold text-slate-600 rounded-lg hover:bg-white"
              >
                Hủy
              </button>
              <button
                onClick={submitCreateTicket}
                disabled={isSaving || selectedProjectors.length === 0}
                className="flex-1 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 flex justify-center items-center"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin mr-2" />
                ) : (
                  "Tạo phiếu"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCompleteTicketOpen && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-green-600 text-white">
              <h3 className="font-bold text-lg">Hoàn tất Phiếu Bảo Trì</h3>
              <button onClick={() => setIsCompleteTicketOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-sm">
                <p>
                  Mã phiếu:{" "}
                  <span className="font-bold">
                    {selectedTicket.ticketCode || selectedTicket.id}
                  </span>
                </p>
                <p>
                  Kỹ thuật viên:{" "}
                  <span className="font-bold">{selectedTicket.technician}</span>
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Ngày hoàn thành *
                </label>
                <input
                  type="date"
                  className="w-full p-3 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  value={completeForm.date}
                  onChange={(e) =>
                    setCompleteForm({ ...completeForm, date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-3">
                  Xác nhận tình trạng từng máy:
                </label>
                <div className="space-y-3">
                  {completeForm.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-xl bg-slate-50 flex flex-col gap-2"
                    >
                      <span className="font-bold text-[#1a237e] text-sm">
                        {item.name}
                      </span>
                      <select
                        className="w-full p-2 bg-white border rounded outline-none text-sm font-medium"
                        value={item.nextStatus}
                        onChange={(e) => {
                          const newItems = [...completeForm.items];
                          newItems[index].nextStatus = e.target.value;
                          setCompleteForm({ ...completeForm, items: newItems });
                        }}
                      >
                        <option value="AVAILABLE">
                          ✅ Đã sửa xong - Đưa về SẴN SÀNG
                        </option>
                        <option value="BROKEN">
                          ❌ Sửa thất bại - Đưa về ĐÃ HỎNG
                        </option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-white flex gap-3">
              <button
                onClick={() => setIsCompleteTicketOpen(false)}
                className="flex-1 py-3 border font-bold text-slate-600 rounded-xl hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={submitCompleteTicket}
                disabled={isSaving}
                className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex justify-center items-center shadow-md"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin mr-2" />
                ) : (
                  "Xác nhận thu hồi & Hoàn tất"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
