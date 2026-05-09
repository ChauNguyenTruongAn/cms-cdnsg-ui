import axiosClient from "./axiosClient";

export const borrowReturnService = {
  // 1. Người dùng Tạo phiếu mượn (Gửi yêu cầu)
  createTicket: (data) => axiosClient.post("/borrow-return/create", data),

  // 2. Admin Duyệt đơn
  approveTicket: (id) => axiosClient.put(`/borrow-return/${id}/approve`),

  // 3. Admin Từ chối đơn
  rejectTicket: (id, reason) =>
    axiosClient.put(`/borrow-return/${id}/reject`, null, {
      params: { reason },
    }),

  // 4. Quét mã QR trả đồ
  getReturnTicketInfo: (returnCode) =>
    axiosClient.get(`/borrow-return/scan-return/${returnCode}`),

  // 4. Thủ kho Xác nhận trả đồ (Qua QR)
  confirmReturn: (data) =>
    axiosClient.post("/borrow-return/confirm-return", data),

  // 4.1 Thủ kho Xác nhận trả đồ (Thủ công)
  confirmReturnManual: (id, data) =>
    axiosClient.post(`/borrow-return/${id}/return-manual`, data),

  // 6. Xử lý đồ trả thiếu/hỏng (resolve-incomplete)
  resolveIncomplete: (id) =>
    axiosClient.put(`/borrow-return/resolve-incomplete/${id}`),

  // 7. Xem lịch sử phiếu (Admin)
  getAllTickets: (page = 0, size = 10, status = "", keyword = "") =>
    axiosClient.get("/borrow-return/all", {
      params: { page, size, status, keyword },
    }),

  // Cập nhật thủ công
  updateTicket: (id, data) => axiosClient.put(`/borrow-return/${id}`, data),

  // Xóa phiếu
  deleteTicket: (id) => axiosClient.delete(`/borrow-return/${id}`),

  // --- NEW APIS ---
  
  // User Dashboard
  getUserDashboard: (email) => axiosClient.get(`/borrow-return/user/dashboard`, { params: { email } }),

  // User History
  getUserHistory: (email, status = "", page = 0, size = 10) =>
    axiosClient.get(`/borrow-return/user/history`, {
      params: { email, status, page, size },
    }),

  // Admin KPIs
  getAdminKPIs: () => axiosClient.get(`/borrow-dashboard/kpis`),

  // Admin Quick Lists
  getAdminQuickLists: () => axiosClient.get(`/borrow-dashboard/quick-lists`),

  // Admin Send Email
  sendEmail: (data) => axiosClient.post(`/borrow-return/send-email`, data),

  // --- BORROW ITEMS APIS ---
  
  createBorrowItem: (data) => axiosClient.post(`/borrow-items`, data),
  
  updateBorrowItem: (id, data) => axiosClient.put(`/borrow-items/${id}`, data),
  
  getBorrowItems: (page = 0, size = 10, keyword = "", category = "") =>
    axiosClient.get(`/borrow-items`, { params: { page, size, keyword, category } }),
    
  deleteBorrowItem: (id) => axiosClient.delete(`/borrow-items/${id}`),
};
