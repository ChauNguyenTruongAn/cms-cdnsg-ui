import axiosClient from "./axiosClient";

export const projectorService = {
  // --- DANH MỤC ---
  getAllProjectors: (
    page = 0,
    size = 10,
    sortBy = "id",
    direction = "desc",
    keyword = "",
    status = "",
  ) =>
    axiosClient.get("/projectors", {
      params: {
        page,
        size,
        sortBy,
        direction,
        keyword,
        status: status || null,
      },
    }),
  getProjectorById: (id) => axiosClient.get(`/projectors/${id}`),
  createProjector: (data) => axiosClient.post("/projectors", data),
  updateProjector: (id, data) => axiosClient.put(`/projectors/${id}`, data),
  deleteProjector: (id) => axiosClient.delete(`/projectors/${id}`),
  updateProjectorStatus: (id, status) =>
    axiosClient.patch(`/projectors/${id}/status`, null, { params: { status } }),
  getProjectorStats: () => axiosClient.get("/projectors/stats"),

  // --- MƯỢN / TRẢ ---
  getAllLoans: (
    page = 0,
    size = 10,
    sortBy = "id",
    direction = "desc",
    keyword = "",
    status = "",
  ) =>
    axiosClient.get("/projector-loans", {
      params: {
        page,
        size,
        sortBy,
        direction,
        keyword,
        status: status || null,
      },
    }),
  borrowProjector: (data) => axiosClient.post("/projector-loans/borrow", data),
  returnProjector: (loanId, returnNote = "", nextStatus = "AVAILABLE") =>
    axiosClient.post(`/projector-loans/${loanId}/return`, null, {
      params: { returnNote, nextStatus },
    }),
  updateLoan: (id, data) => axiosClient.put(`/projector-loans/${id}`, data),
  getLoanHistoryByProjector: (projectorId) =>
    axiosClient.get(`/projector-loans/projector/${projectorId}`),
  deleteLoan: (id) => axiosClient.delete(`/projector-loans/${id}`),

  // --- BẢO TRÌ ---
  // CẬP NHẬT: Thêm tham số phân trang
  getAllTickets: (page = 0, size = 10, keyword = "", status = "") =>
    axiosClient.get("/projector-maintenances", {
      params: { page, size, keyword, status: status || null },
    }),
  createTicket: (data) => axiosClient.post("/projector-maintenances", data),
  completeTicket: async (id, payload) => {
    const response = await axiosClient.post(
      `/projector-maintenances/${id}/complete`,
      payload,
    );
    return response.data;
  },
  updateTicket: (id, data) =>
    axiosClient.put(`/projector-maintenances/${id}`, data),
  updateTicketItemStatus: (itemId, status) =>
    axiosClient.post(`/projector-maintenances/${itemId}/complete`, null, {
      params: { status },
    }),
  getMaintenanceHistory: (projectorId) =>
    axiosClient.get(`/projector-maintenances/projector/${projectorId}`),
};
