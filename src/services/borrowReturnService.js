import axiosClient from "./axiosClient";

export const borrowReturnService = {
  // 1. Tạo phiếu mượn (Trả về mã borrowCode để vẽ QR)
  createTicket: (data) => axiosClient.post("/borrow-return/create", data),

  // 2. Người dùng nhập email xác nhận mượn
  confirmBorrow: (data) =>
    axiosClient.post("/borrow-return/confirm-borrow", data),

  // 3. Quét mã lấy thông tin trả đồ
  getReturnTicketInfo: (returnCode) =>
    axiosClient.get(`/borrow-return/scan-return/${returnCode}`),

  // 4. Thủ kho xác nhận tình trạng đồ (Đủ/Thiếu)
  confirmReturn: (data) =>
    axiosClient.post("/borrow-return/confirm-return", data),

  // 5. Thủ kho xác nhận nhận bù đồ (Đổi từ INCOMPLETE -> COMPLETED)
  resolveIncomplete: (id) =>
    axiosClient.put(`/borrow-return/resolve-incomplete/${id}`),

  getAllTickets: (page = 0, size = 10, status = "", keyword = "") =>
    axiosClient.get("/borrow-return/all", {
      params: { page, size, status, keyword },
    }),

  updateTicket: (id, data) => axiosClient.put(`/borrow-return/${id}`, data),
};
