import React, { useState, useEffect } from "react";
import {
  Wrench,
  Loader2,
  X,
  CheckCircle,
  Clock,
  History,
  Calendar,
  PenTool,
  AlertTriangle,
} from "lucide-react";
import { projectorService } from "../../services/projectorService";
import { useToast } from "../../context/ToastContext";

export default function MaintenanceTab() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [allProjectorsList, setAllProjectorsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // States Modals
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
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

  // States hoàn tất phiếu BẢO TRÌ MỚI
  const [completionDate, setCompletionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [completionResults, setCompletionResults] = useState([]); // Mảng chứa trạng thái sau bảo trì của từng máy

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pRes = await projectorService.getAllProjectors(0, 1000);
      setAllProjectorsList(pRes.content || []);

      const tRes = await projectorService.getAllTickets();
      setTickets((tRes || []).reverse());
    } catch (error) {
      showToast("Lỗi tải dữ liệu bảo trì", "error");
    } finally {
      setLoading(false);
    }
  };

  const activeTickets = tickets.filter((t) => !t.completionDate);
  const completedTickets = tickets.filter((t) => t.completionDate);

  const handleToggleProjector = (projector) => {
    const exists = selectedProjectors.find(
      (p) => p.projectorId === projector.id,
    );
    if (exists) {
      setSelectedProjectors(
        selectedProjectors.filter((p) => p.projectorId !== projector.id),
      );
    } else {
      setSelectedProjectors([
        ...selectedProjectors,
        { projectorId: projector.id, description: "", cost: 0 },
      ]);
    }
  };

  const handleUpdateDetail = (projectorId, field, value) => {
    setSelectedProjectors(
      selectedProjectors.map((p) =>
        p.projectorId === projectorId ? { ...p, [field]: value } : p,
      ),
    );
  };

  const submitCreateTicket = async () => {
    if (selectedProjectors.length === 0)
      return showToast("Vui lòng chọn ít nhất 1 máy chiếu!", "error");
    const missingDesc = selectedProjectors.some((p) => !p.description.trim());
    if (missingDesc)
      return showToast(
        "Vui lòng nhập tình trạng/nội dung cần sửa cho các máy đã chọn!",
        "error",
      );

    setIsSaving(true);
    try {
      const payload = { ...ticketForm, details: selectedProjectors };
      await projectorService.createTicket(payload);
      showToast("Đã tạo phiếu bảo trì thành công!");
      setIsCreateTicketOpen(false);
      fetchData();
    } catch (error) {
      showToast("Lỗi khi tạo phiếu!", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Mở Modal Hoàn Tất và chuẩn bị dữ liệu đánh giá từng máy
  const handleOpenCompleteTicket = (ticket) => {
    setSelectedTicket(ticket);
    setCompletionDate(new Date().toISOString().split("T")[0]);
    // Mặc định tất cả máy trong phiếu sẽ là sửa thành công (AVAILABLE)
    const defaultResults = ticket.details.map((dt) => ({
      projectorId: dt.projector?.id,
      projectorName: dt.projector?.name,
      serialNumber: dt.projector?.serialNumber,
      status: "AVAILABLE",
    }));
    setCompletionResults(defaultResults);
    setIsCompleteTicketOpen(true);
  };

  const handleUpdateCompletionStatus = (projectorId, newStatus) => {
    setCompletionResults(
      completionResults.map((r) =>
        r.projectorId === projectorId ? { ...r, status: newStatus } : r,
      ),
    );
  };

  const submitCompleteTicket = async () => {
    setIsSaving(true);
    try {
      // Gửi payload chứa Ngày hoàn tất và Mảng kết quả đánh giá từng máy
      const payload = {
        completionDate: completionDate,
        results: completionResults.map((r) => ({
          projectorId: r.projectorId,
          status: r.status,
        })),
      };
      await projectorService.completeTicket(selectedTicket.id, payload);
      showToast("Đã hoàn tất đợt bảo trì và cập nhật trạng thái máy chiếu!");
      setIsCompleteTicketOpen(false);
      fetchData();
    } catch (error) {
      showToast("Lỗi khi ghi nhận hoàn tất!", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const availableProjectors = allProjectorsList.filter(
    (p) => p.status === "AVAILABLE" || p.status === "BROKEN",
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KHU VỰC 1: CÁC ĐỢT BẢO TRÌ ĐANG DIỄN RA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-amber-50 border-b border-amber-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center text-amber-800 font-bold">
            <Clock size={20} className="mr-2" />
            CÁC ĐỢT BẢO TRÌ ĐANG XỬ LÝ ({activeTickets.length})
          </div>
          <button
            onClick={() => {
              setTicketForm({
                ticketCode: "",
                startDate: new Date().toISOString().split("T")[0],
                technician: "",
                generalNote: "",
              });
              setSelectedProjectors([]);
              setIsCreateTicketOpen(true);
            }}
            className="bg-amber-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center hover:bg-amber-700 transition-all shadow-md w-full sm:w-auto justify-center"
          >
            <PenTool size={16} className="mr-2" /> TẠO PHIẾU BẢO TRÌ
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-slate-50">
          {loading ? (
            <Loader2 className="animate-spin text-amber-500 mx-auto my-8" />
          ) : (
            activeTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border border-amber-200 rounded-xl bg-white shadow-sm flex flex-col overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 bg-amber-50/50 flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800">
                      {ticket.ticketCode || `Phiếu #${ticket.id}`}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center">
                      <Calendar size={12} className="mr-1" /> Ngày đi:{" "}
                      {ticket.startDate}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenCompleteTicket(ticket)}
                    className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-bold hover:bg-green-600 hover:text-white transition-colors flex items-center"
                  >
                    <CheckCircle size={14} className="mr-1.5" /> HOÀN TẤT
                  </button>
                </div>
                <div className="p-4 flex-1">
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase">
                    Danh sách máy đang sửa ({ticket.details?.length}):
                  </p>
                  <ul className="space-y-2">
                    {ticket.details?.map((dt, idx) => (
                      <li
                        key={idx}
                        className="text-sm border-l-2 border-amber-400 pl-3 py-1 bg-slate-50 rounded-r-lg"
                      >
                        <span className="font-bold text-slate-700">
                          {dt.projector?.name}
                        </span>
                        <p
                          className="text-xs text-slate-500 italic mt-0.5 truncate"
                          title={dt.description}
                        >
                          Lỗi: {dt.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          )}
          {!loading && activeTickets.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 italic bg-white rounded-xl border border-dashed">
              Tuyệt vời! Hiện tại không có máy chiếu nào đang bị hỏng cần bảo
              trì.
            </div>
          )}
        </div>
      </div>

      {/* KHU VỰC 2: LỊCH SỬ BẢO TRÌ (ĐÃ HOÀN TẤT) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg flex items-center">
            <History size={20} className="mr-2.5 text-indigo-500" /> Lịch sử bảo
            trì đã hoàn tất
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Mã Phiếu</th>
                <th className="px-6 py-4">TG Bảo trì</th>
                <th className="px-6 py-4">Người/Đơn vị sửa</th>
                <th className="px-6 py-4">Chi tiết máy chiếu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completedTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-slate-50 align-top transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-slate-700">
                    {ticket.ticketCode || `#${ticket.id}`}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-medium text-slate-600">
                      Đi: {ticket.startDate}
                    </div>
                    <div className="text-xs font-bold text-green-600 mt-1">
                      Xong: {ticket.completionDate}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {ticket.technician || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      {ticket.details?.map((dt, i) => (
                        <div
                          key={i}
                          className="text-xs bg-white border rounded p-2 shadow-sm"
                        >
                          <span className="font-bold text-indigo-700">
                            {dt.projector?.name}
                          </span>
                          <span className="text-slate-500 ml-2 block sm:inline">
                            ({dt.description})
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {completedTickets.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    Chưa có lịch sử bảo trì nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: TẠO PHIẾU BẢO TRÌ (CHỌN NHIỀU MÁY) */}
      {isCreateTicketOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b bg-amber-600 text-white rounded-t-2xl flex justify-between items-center">
              <h3 className="font-bold text-lg">Tạo Phiếu Bảo Trì Mới</h3>
              <button onClick={() => setIsCreateTicketOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* CỘT TRÁI: THÔNG TIN PHIẾU CHUNG */}
              <div className="w-full md:w-1/3 border-r bg-slate-50 p-5 overflow-y-auto">
                <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase">
                  1. Thông tin đợt bảo trì
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Ngày đem đi
                    </label>
                    <input
                      type="date"
                      className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                      value={ticketForm.startDate}
                      onChange={(e) =>
                        setTicketForm({
                          ...ticketForm,
                          startDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Mã phiếu (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Hệ thống tự sinh nếu để trống"
                      className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                      value={ticketForm.ticketCode}
                      onChange={(e) =>
                        setTicketForm({
                          ...ticketForm,
                          ticketCode: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Đơn vị / Người sửa
                    </label>
                    <input
                      type="text"
                      placeholder="VD: IT Support..."
                      className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                      value={ticketForm.technician}
                      onChange={(e) =>
                        setTicketForm({
                          ...ticketForm,
                          technician: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Ghi chú chung
                    </label>
                    <textarea
                      rows="3"
                      className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                      value={ticketForm.generalNote}
                      onChange={(e) =>
                        setTicketForm({
                          ...ticketForm,
                          generalNote: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: DANH SÁCH MÁY CHIẾU & LỖI */}
              <div className="w-full md:w-2/3 bg-white p-5 flex flex-col overflow-hidden">
                <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase flex justify-between items-center">
                  <span>2. Chọn máy chiếu cần bảo trì</span>
                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs">
                    Đã chọn: {selectedProjectors.length} máy
                  </span>
                </h4>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                  {availableProjectors.length === 0 ? (
                    <div className="text-center text-sm text-slate-400 mt-10">
                      Tất cả máy chiếu đều đang được mượn. Không có máy nào sẵn
                      sàng để bảo trì.
                    </div>
                  ) : (
                    availableProjectors.map((p) => {
                      const isSelected = selectedProjectors.find(
                        (sp) => sp.projectorId === p.id,
                      );
                      return (
                        <div
                          key={p.id}
                          className={`border rounded-xl p-4 transition-all ${isSelected ? "border-amber-500 bg-amber-50/30" : "border-slate-200 hover:border-indigo-300"}`}
                        >
                          <label className="flex items-start cursor-pointer">
                            <input
                              type="checkbox"
                              className="mt-1 w-4 h-4 text-amber-600 rounded cursor-pointer"
                              checked={!!isSelected}
                              onChange={() => handleToggleProjector(p)}
                            />
                            <div className="ml-3 flex-1">
                              <span className="font-bold text-slate-800">
                                {p.name}
                              </span>{" "}
                              <span className="text-xs text-slate-500 font-mono ml-2">
                                SN: {p.serialNumber}
                              </span>
                              {p.status === "BROKEN" && (
                                <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 rounded font-bold">
                                  ĐANG HỎNG
                                </span>
                              )}
                              {isSelected && (
                                <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2">
                                  <div className="col-span-3">
                                    <input
                                      type="text"
                                      placeholder="Nhập tình trạng lỗi (VD: Không lên nguồn) *"
                                      className="w-full p-2 text-sm bg-white border border-amber-200 rounded outline-none focus:ring-1 focus:ring-amber-500"
                                      value={isSelected.description}
                                      onChange={(e) =>
                                        handleUpdateDetail(
                                          p.id,
                                          "description",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <input
                                      type="number"
                                      placeholder="Chi phí..."
                                      className="w-full p-2 text-sm bg-white border border-amber-200 rounded outline-none focus:ring-1 focus:ring-amber-500"
                                      value={isSelected.cost}
                                      onChange={(e) =>
                                        handleUpdateDetail(
                                          p.id,
                                          "cost",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-50 flex gap-3 rounded-b-2xl justify-end">
              <button
                onClick={() => setIsCreateTicketOpen(false)}
                className="px-6 py-2.5 border rounded-xl font-bold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={submitCreateTicket}
                disabled={isSaving || selectedProjectors.length === 0}
                className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center"
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

      {/* MODAL 2: GHI NHẬN HOÀN TẤT BẢO TRÌ NÂNG CẤP */}
      {isCompleteTicketOpen && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b bg-green-600 text-white rounded-t-2xl flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center">
                <CheckCircle size={20} className="mr-2" /> Nhận máy & Đánh giá
                sau bảo trì
              </h3>
              <button
                onClick={() => setIsCompleteTicketOpen(false)}
                className="hover:bg-green-700 p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">
                    Mã Phiếu Bảo Trì
                  </p>
                  <p className="text-base font-bold text-slate-800">
                    {selectedTicket.ticketCode || `#${selectedTicket.id}`}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">
                    Ngày nhận máy hoàn tất *
                  </p>
                  <input
                    type="date"
                    className="w-full text-sm font-medium outline-none text-slate-800"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 text-sm uppercase mb-3 flex items-center">
                  <AlertTriangle size={16} className="text-amber-500 mr-1.5" />{" "}
                  Đánh giá tình trạng {completionResults.length} máy chiếu
                </h4>
                <div className="space-y-3">
                  {completionResults.map((res) => (
                    <div
                      key={res.projectorId}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm gap-3"
                    >
                      <div>
                        <p className="font-bold text-slate-800">
                          {res.projectorName}
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          SN: {res.serialNumber}
                        </p>
                      </div>
                      <select
                        className={`p-2.5 rounded-lg outline-none text-sm font-bold border focus:ring-2 ${
                          res.status === "AVAILABLE"
                            ? "bg-green-50 text-green-700 border-green-200 focus:ring-green-500"
                            : "bg-red-50 text-red-700 border-red-200 focus:ring-red-500"
                        }`}
                        value={res.status}
                        onChange={(e) =>
                          handleUpdateCompletionStatus(
                            res.projectorId,
                            e.target.value,
                          )
                        }
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

            <div className="p-4 border-t bg-white flex gap-3 rounded-b-2xl">
              <button
                onClick={() => setIsCompleteTicketOpen(false)}
                className="flex-1 py-3 border font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={submitCompleteTicket}
                disabled={isSaving}
                className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex justify-center items-center shadow-lg shadow-green-100 transition-colors"
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
