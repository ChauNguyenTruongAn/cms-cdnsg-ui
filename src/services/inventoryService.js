import axiosClient from "./axiosClient";

export const inventoryService = {
  // ── File APIs ────────────────────────────────────────────────
  getFiles: (params) => axiosClient.get("/inventory/files", { params }),

  getFileById: (id) => axiosClient.get(`/inventory/files/${id}`),

  uploadFile: (formData) =>
    axiosClient.post("/inventory/files", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  overwriteFile: (id, formData) =>
    axiosClient.post(`/inventory/files/${id}/overwrite`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateFileMeta: (id, data) =>
    axiosClient.patch(`/inventory/files/${id}`, data),

  deleteFile: (id) => axiosClient.delete(`/inventory/files/${id}`),

  getDepartments: () => axiosClient.get("/inventory/departments"),

  // ── Logs ─────────────────────────────────────────────────
  saveLogs: (payload) => axiosClient.post("/inventory/logs", payload),

  getFileLogs: (fileId, params) =>
    axiosClient.get(`/inventory/files/${fileId}/logs`, { params }),
};
