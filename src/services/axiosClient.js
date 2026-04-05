import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm Interceptor cho Request (Rất hữu ích để đính kèm Token sau khi login)
axiosClient.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Thêm Interceptor cho Response (Xử lý dữ liệu trả về và bắt lỗi toàn cục)
axiosClient.interceptors.response.use(
  (response) => {
    // Thường backend trả data bọc trong 1 object, có thể return thẳng response.data tại đây
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // Xử lý lỗi chung như hết hạn token, lỗi server...
    console.error("API Error: ", error.response?.data || error.message);
    return Promise.reject(error);
  },
);

export default axiosClient;
