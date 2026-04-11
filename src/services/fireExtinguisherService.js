import axiosClient from "./axiosClient";

export const fireExtinguisherService = {
  // --- QUẢN LÝ BÌNH ---
  getAll: (
    page = 0,
    size = 10,
    keyword = "",
    zoneId = "",
    type = "",
    weight = "",
  ) =>
    axiosClient.get("/fire-extinguishers", {
      params: {
        page,
        size,
        keyword,
        zoneId: zoneId || null,
        type: type || null,
        weight: weight || null,
      },
    }),

  getStats: () => axiosClient.get("/fire-extinguishers/stats"),

  getAdvancedStats: () => axiosClient.get("/fire-extinguishers/stats/advanced"),

  create: (data) => axiosClient.post("/fire-extinguishers", data),

  update: (id, data) => axiosClient.put(`/fire-extinguishers/${id}`, data),

  // Nạp 1 bình (truyền object chứa rechargeDate, nextRechargeDate, note)
  recharge: (id, data) =>
    axiosClient.patch(`/fire-extinguishers/${id}/recharge`, data),

  // Nạp hàng loạt theo Khu vực
  rechargeByZone: (zoneId, data) =>
    axiosClient.patch(`/fire-extinguishers/zone/${zoneId}/recharge`, data),

  getHistory: (id) => axiosClient.get(`/fire-extinguishers/${id}/history`),

  delete: (id) => axiosClient.delete(`/fire-extinguishers/${id}`),

  // --- QUẢN LÝ KHU VỰC & VỊ TRÍ ---
  getZones: () => axiosClient.get("/zones"),

  getLocationsByZone: (zoneId) => axiosClient.get(`/locations/zone/${zoneId}`),

  // --- QUẢN LÝ KHU VỰC (ZONE) ---
  getZones: () => axiosClient.get("/zones"),
  createZone: (data) => axiosClient.post("/zones", data),
  updateZone: (id, data) => axiosClient.put(`/zones/${id}`, data),
  deleteZone: (id) => axiosClient.delete(`/zones/${id}`),

  // --- QUẢN LÝ VỊ TRÍ (LOCATION) ---
  getLocationsByZone: (zoneId) => axiosClient.get(`/locations/zone/${zoneId}`),
  createLocation: (data) => axiosClient.post("/locations", data),
  updateLocation: (id, data) => axiosClient.put(`/locations/${id}`, data),
  deleteLocation: (id) => axiosClient.delete(`/locations/${id}`),
};
