import axiosClient from "./axiosClient";

export const receiptService = {
  // --- NHẬP KHO (IMPORT) ---
  // params có thể bao gồm: page, size, sortBy, direction, fromDate, toDate, note
  getAllImports: (params) => axiosClient.get("/import-receipt", { params }),
  getImportById: (id) => axiosClient.get(`/import-receipt/${id}`),
  createImport: (data) => axiosClient.post("/import-receipt", data),
  updateImport: (id, data) => axiosClient.put(`/import-receipt/${id}`, data),
  deleteImport: (id) => axiosClient.delete(`/import-receipt/${id}`),

  // --- XUẤT KHO VẬT TƯ (EXPORT) ---
  // params có thể bao gồm: page, size, sortBy, direction, fromDate, toDate, note, department
  getAllExports: (params) => axiosClient.get("/export-receipt", { params }),
  getExportById: (id) => axiosClient.get(`/export-receipt/${id}`),
  createExport: (data) => axiosClient.post("/export-receipt", data),
  updateExport: (id, data) => axiosClient.put(`/export-receipt/${id}`, data),
  deleteExport: (id) => axiosClient.delete(`/export-receipt/${id}`),
};
