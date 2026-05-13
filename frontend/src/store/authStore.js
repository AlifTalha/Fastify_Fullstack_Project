import { create } from "zustand";
import { getMe, login as loginApi, logout as logoutApi } from "../api/auth";

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  authChecked: false,

  markAuthChecked: () => set({ authChecked: true }),

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data } = await loginApi(credentials);
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      set({
        user: data.data.user,
        isAuthenticated: true,
        isLoading: false,
        authChecked: true,
      });
      return data.data;
    } catch (err) {
      set({ isLoading: false, authChecked: true });
      throw err;
    }
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await logoutApi({ refreshToken });
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      set({ user: null, isAuthenticated: false, authChecked: true });
    }
  },

  fetchMe: async () => {
    try {
      set({ isLoading: true });
      const { data } = await getMe();
      set({
        user: data.data,
        isAuthenticated: true,
        isLoading: false,
        authChecked: true,
      });
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        authChecked: true,
      });
    }
  },
}));

export default useAuthStore;
