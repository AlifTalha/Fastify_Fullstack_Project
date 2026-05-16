import api from "./axios";

export const startOrGetConversation = (data) =>
  api.post("/chat/conversations", data);
export const getConversations = () => api.get("/chat/conversations");
export const getConversationMessages = (id, params) =>
  api.get(`/chat/conversations/${id}`, { params });
export const sendMessage = (id, data) =>
  api.post(`/chat/conversations/${id}`, data);
export const markAsRead = (id) => api.put(`/chat/conversations/${id}/read`);
export const uploadMedia = (formData) =>
  api.post("/chat/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getAdminUser = () => api.get("/chat/admin-user");
export const getAdminConversations = () => api.get("/chat/admin/conversations");
export const getChatUsers = () => api.get("/chat/users");
