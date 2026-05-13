import api from "./axios";

// User
export const createTicket = (data) => api.post("/tickets", data);
export const getMyTickets = (params) => api.get("/tickets/my", { params });
export const getMyTicket = (id) => api.get(`/tickets/my/${id}`);
export const addReply = (id, data) => api.post(`/tickets/${id}/reply`, data);

// Admin
export const getAllTickets = (params) => api.get("/tickets", { params });
export const getTicketById = (id) => api.get(`/tickets/${id}`);
export const updateTicketStatus = (id, data) =>
  api.patch(`/tickets/${id}/status`, data);
export const deleteTicket = (id) => api.delete(`/tickets/${id}`);
