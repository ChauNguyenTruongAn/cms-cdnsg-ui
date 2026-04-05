import axiosClient from "./axiosClient";

export const materialService = {
  // --- VẬT TƯ (MATERIALS) ---
  // CẬP NHẬT: Thêm tham số phân trang
  // CẬP NHẬT: Thêm tham số status
  getAllMaterials: (
    page = 0,
    size = 20,
    sortBy = "id",
    direction = "desc",
    keyword = "",
    status = "", // Thêm dòng này
  ) =>
    axiosClient.get("/materials/all", {
      params: {
        page,
        size,
        sortBy,
        direction,
        keyword,
        status: status || null,
      }, // Truyền xuống backend
    }),

  getMaterialById: (id) => axiosClient.get("/materials", { params: { id } }),
  createMaterial: (data) => axiosClient.post("/materials", data),
  updateMaterial: (id, data) =>
    axiosClient.put("/materials", data, { params: { id } }),
  deleteMaterial: (id) => axiosClient.delete("/materials", { params: { id } }),
  getMaterialStats: () => axiosClient.get("/materials/stats"),

  // --- ĐƠN VỊ TÍNH (UNITS) ---
  getAllUnits: () => axiosClient.get("/units/all"),
  getUnitById: (id) => axiosClient.get("/units", { params: { id } }),
  createUnit: (data) => axiosClient.post("/units", data),
  updateUnit: (id, data) => axiosClient.put("/units", data, { params: { id } }),
  deleteUnit: (id) => axiosClient.delete("/units", { params: { id } }),
};
