import api from "./axios";

const BLOG_BASE = "/blog";

// Public
export const getPublicPosts = (params) =>
  api.get(`${BLOG_BASE}/posts`, { params });

// Authenticated
export const getPublicPostBySlug = (slug) =>
  api.get(`${BLOG_BASE}/posts/${slug}`);
export const incrementPostView = (slug) =>
  api.post(`${BLOG_BASE}/posts/${slug}/view`);
export const reactToPost = (id, likeDelta, dislikeDelta) =>
  api.post(`${BLOG_BASE}/posts/${id}/react`, { likeDelta, dislikeDelta });
export const createPost = (formData) =>
  api.post(`${BLOG_BASE}/posts`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getMyPosts = (params) =>
  api.get(`${BLOG_BASE}/posts/my`, { params });
export const updatePost = (id, formData) =>
  api.put(`${BLOG_BASE}/posts/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deletePost = (id) => api.delete(`${BLOG_BASE}/posts/${id}`);
export const addComment = (id, data) =>
  api.post(`${BLOG_BASE}/posts/${id}/comments`, data);
export const editComment = (id, commentId, data) =>
  api.put(`${BLOG_BASE}/posts/${id}/comments/${commentId}`, data);
export const deleteComment = (id, commentId) =>
  api.delete(`${BLOG_BASE}/posts/${id}/comments/${commentId}`);

// Admin
export const adminGetPosts = (params) =>
  api.get(`${BLOG_BASE}/admin/posts`, { params });
export const getBlogStats = () => api.get(`${BLOG_BASE}/admin/stats`);
export const updatePostStatus = (id, status) =>
  api.patch(`${BLOG_BASE}/admin/posts/${id}/status`, { status });
export const adminDeletePost = (id) =>
  api.delete(`${BLOG_BASE}/admin/posts/${id}`);
export const adminDeleteComment = (id, commentId) =>
  api.delete(`${BLOG_BASE}/admin/posts/${id}/comments/${commentId}`);
