import axiosClient from "./axiosClient";

export const mediaService = {
  uploadFile: (file, name, category, description) => {
    const formData = new FormData();
    formData.append("file", file);
    if (name) formData.append("name", name);
    if (category) formData.append("category", category);
    if (description) formData.append("description", description);

    return axiosClient.post("/media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getAllFiles: (page = 0, size = 12, keyword = "", category = "") =>
    axiosClient.get("/media", {
      params: { page, size, keyword, category: category || null },
    }),

  deleteFile: (id) => axiosClient.delete(`/media/${id}`),

  updateFileInfo: (id, data) =>
    axiosClient.put(`/media/${id}`, null, { params: data }),

  // CÁC HÀM MỚI: QUẢN LÝ LOẠI TÀI LIỆU
  getCategories: () => axiosClient.get("/document-categories"),
  createCategory: (data) => axiosClient.post("/document-categories", data),
  deleteCategory: (id) => axiosClient.delete(`/document-categories/${id}`),
};
