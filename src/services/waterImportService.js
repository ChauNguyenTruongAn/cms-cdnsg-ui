import axiosClient from "./axiosClient";

export const waterImportService = {
  getAllImports: (page = 0, size = 10, fromDate = "", toDate = "") =>
    axiosClient.get("/water-imports", { params: { page, size, fromDate, toDate } }),

  createImport: (data) => axiosClient.post("/water-imports", data),

  updateImport: (id, data) => axiosClient.put(`/water-imports/${id}`, data),

  deleteImport: (id) => axiosClient.delete(`/water-imports/${id}`),

  getImportReport: (fromDate = "", toDate = "") =>
    axiosClient.get("/water-imports/report", { params: { fromDate, toDate } }),

  // --- QUẢN LÝ KHU VỰC (ZONE) ---
  getZones: () => axiosClient.get("/water-zones"),
  createZone: (data) => axiosClient.post("/water-zones", data),
  updateZone: (id, data) => axiosClient.put(`/water-zones/${id}`, data),
  deleteZone: (id) => axiosClient.delete(`/water-zones/${id}`),
};
