import api from "./axios";

export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);
export const logout = (data) => api.post("/auth/logout", data);
export const logoutAll = () => api.post("/auth/logout-all");
export const getMe = () => api.get("/auth/me");
export const updateProfile = (data) => api.put("/auth/profile", data);
export const changePassword = (data) => api.put("/auth/change-password", data);
export const forgotPassword = (data) => api.post("/auth/forgot-password", data);
export const verifyOtp = (data) => api.post("/auth/verify-otp", data);
export const resetPassword = (newPassword, resetToken) =>
  api.post(
    "/auth/reset-password",
    { newPassword },
    { headers: { Authorization: `Bearer ${resetToken}` } },
  );

// Admin user management
export const getUsers = (params) => api.get("/users", { params });
export const getUserById = (id) => api.get(`/users/${id}`);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
