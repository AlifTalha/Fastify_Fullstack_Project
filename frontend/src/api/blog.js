import api from "./axios";

// Public
export const getPublicPosts = (params) => api.get("/blog/posts", { params });

// Authenticated
export const getPublicPostBySlug = (slug) => api.get(`/blog/posts/${slug}`);
export const createPost = (formData) =>
  api.post("/blog/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getMyPosts = (params) => api.get("/blog/posts/my", { params });
export const updatePost = (id, formData) =>
  api.put(`/blog/posts/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deletePost = (id) => api.delete(`/blog/posts/${id}`);
export const addComment = (id, data) =>
  api.post(`/blog/posts/${id}/comments`, data);
export const editComment = (id, commentId, data) =>
  api.put(`/blog/posts/${id}/comments/${commentId}`, data);
export const deleteComment = (id, commentId) =>
  api.delete(`/blog/posts/${id}/comments/${commentId}`);

// Admin
export const adminGetPosts = (params) =>
  api.get("/blog/admin/posts", { params });
export const approvePost = (id) => api.patch(`/blog/admin/posts/${id}/approve`);
export const rejectPost = (id) => api.patch(`/blog/admin/posts/${id}/reject`);
export const adminDeletePost = (id) => api.delete(`/blog/admin/posts/${id}`);
export const adminDeleteComment = (id, commentId) =>
  api.delete(`/blog/admin/posts/${id}/comments/${commentId}`);
