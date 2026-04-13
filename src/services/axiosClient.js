import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    // Thêm dòng này để bỏ qua trang cảnh báo của ngrok
    "ngrok-skip-browser-warning": "true",
  },
});

// Thêm Interceptor cho Request
axiosClient.interceptors.request.use(
  (config) => {
    // Nếu bạn muốn chắc chắn hơn, có thể set header ở đây
    config.headers["ngrok-skip-browser-warning"] = "true";

    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Thêm Interceptor cho Response
axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // Nếu bị lỗi CORS hoặc lỗi từ ngrok, nó sẽ nhảy vào đây
    console.error("API Error: ", error.response?.data || error.message);
    return Promise.reject(error);
  },
);

export default axiosClient;
