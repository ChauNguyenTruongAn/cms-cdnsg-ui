import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  withCredentials: true,
});

axiosClient.interceptors.request.use(
  (config) => {
    config.headers["ngrok-skip-browser-warning"] = "true";

    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);
axiosClient.interceptors.response.use(
  (response) => response,
  async (err) => {
    const originalRequest = err.config;

    if (!originalRequest) return Promise.reject(err);

    if (
      err.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/api/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const newAccessToken = res.data;
        console.log(newAccessToken)

        if (!newAccessToken) {
          localStorage.removeItem("access_token");
          window.location.href = "/login";
          return Promise.reject(err);
        }

        localStorage.setItem("access_token", newAccessToken.access_token);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken.access_token}`;

        return axiosClient(originalRequest);
      } catch (e) {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  },
);

export default axiosClient;
