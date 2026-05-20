import api from "./axios";

// Public catalog
export const getCatalog = (params) => api.get("/shop/catalog", { params });
export const getCatalogItem = (id) => api.get(`/shop/catalog/${id}`);

// Admin product management
export const createProduct = (formData) =>
  api.post("/shop/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getAllProducts = (params) => api.get("/shop/products", { params });
export const getProductById = (id) => api.get(`/shop/products/${id}`);
export const updateProduct = (id, formData) =>
  api.put(`/shop/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteProduct = (id) => api.delete(`/shop/products/${id}`);
export const deleteProductImage = (id, imageUrl) =>
  api.delete(`/shop/products/${id}/images`, { data: { imageUrl } });
export const restockProduct = (id, data) =>
  api.patch(`/shop/products/${id}/restock`, data);

// Orders
export const createOrder = (data) => api.post("/shop/orders", data);
export const createCheckoutSession = (id) =>
  api.post(`/shop/orders/${id}/checkout-session`);
export const verifyPayment = (id, data) =>
  api.post(`/shop/orders/${id}/verify`, data);
export const getMyOrders = (params) => api.get("/shop/orders/my", { params });
export const getMyOrderById = (id) => api.get(`/shop/orders/my/${id}`);
export const cancelMyOrder = (id) => api.post(`/shop/orders/${id}/cancel`);
export const downloadInvoice = (id) =>
  api.get(`/shop/orders/${id}/invoice`, { responseType: "blob" });

// Admin orders
export const getAllOrders = (params) =>
  api.get("/shop/admin/orders", { params });
export const getSalesStats = () => api.get("/shop/admin/orders/stats");
export const getOrderByIdAdmin = (id) => api.get(`/shop/admin/orders/${id}`);

// Product feedback
export const getProductFeedback = (productId) =>
  api.get(`/shop/catalog/${productId}/feedback`);
export const submitFeedback = (productId, data) =>
  api.post(`/shop/catalog/${productId}/feedback`, data);
export const deleteFeedback = (id) => api.delete(`/shop/feedback/${id}`);
export const getAllFeedbackAdmin = (params) =>
  api.get("/shop/admin/feedback", { params });
