import axiosClient from "./axiosClient";

export const authService = {
  login: (req) => axiosClient.post("/auth/login", req),
  logout: () => axiosClient.post("/auth/logout"),
};
