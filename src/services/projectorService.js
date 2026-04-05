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

  // --- BẢO TRÌ ---
  getAllTickets: () => axiosClient.get("/projector-maintenances"),
  createTicket: (data) => axiosClient.post("/projector-maintenances", data),
  completeTicket: (id, completionDate) =>
    axiosClient.post(`/projector-maintenances/${id}/complete`, null, {
      params: { completionDate },
    }),
  getMaintenanceHistory: (projectorId) =>
    axiosClient.get(`/projector-maintenances/projector/${projectorId}`),
  completeTicket: (id, payload) =>
    axiosClient.post(`/projector-maintenances/${id}/complete`, payload),
};
