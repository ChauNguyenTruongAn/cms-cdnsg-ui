import axiosClient from "./axiosClient";

export const userService = {
  // Lấy thông tin user theo email
  getUserByEmail: (email) => axiosClient.get(`/users/${email}`),

  // Tìm kiếm user theo email hoặc username
  searchUser: (keyword) =>
    axiosClient.get("/users/search", { params: { keyword } }),

  // Tạo user mới
  createUser: (data) => axiosClient.post("/users", data),

  // Cập nhật thông tin user (truyền UserUpdatedDTO)
  updateUser: (data) => axiosClient.put("/users", data),

  // Vô hiệu hóa user
  disableUser: (email) => axiosClient.patch(`/users/${email}/disable`),

  // Kích hoạt user
  activateUser: (email) => axiosClient.patch(`/users/${email}/activate`),

  // Xóa user
  deleteUser: (email) => axiosClient.delete(`/users/${email}`),
  // Lấy danh sách có phân trang và tìm kiếm
  getAllUsers: (page = 0, size = 10, keyword = "") =>
    axiosClient.get("/users", { params: { page, size, keyword } }),

  // Lấy role và permission
  getRoles: () => axiosClient.get("/users/roles"),
  getPermissions: () => axiosClient.get("/users/permissions"),

  // Các hàm cũ giữ nguyên
  createUser: (data) => axiosClient.post("/users", data),
  updateUser: (data) => axiosClient.put("/users", data),
  disableUser: (email) => axiosClient.patch(`/users/${email}/disable`),
  activateUser: (email) => axiosClient.patch(`/users/${email}/activate`),
  deleteUser: (email) => axiosClient.delete(`/users/${email}`),
};
