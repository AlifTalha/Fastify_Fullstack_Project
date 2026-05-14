import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

import useAuthStore from "./store/authStore";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";

// Home page
import HomePage from "./pages/HomePage";

// Shop pages
import ShopPage from "./pages/shop/ShopPage";
import ProductDetailPage from "./pages/shop/ProductDetailPage";
import OrdersPage from "./pages/shop/OrdersPage";
import OrderDetailPage from "./pages/shop/OrderDetailPage";

// Blog pages
import BlogPage from "./pages/blog/BlogPage";
import BlogPostPage from "./pages/blog/BlogPostPage";
import CreatePostPage from "./pages/blog/CreatePostPage";

// Ticket pages
import TicketsPage from "./pages/tickets/TicketsPage";
import TicketDetailPage from "./pages/tickets/TicketDetailPage";

// Chat
import ChatPage from "./pages/chat/ChatPage";

// Profile
import ProfilePage from "./pages/ProfilePage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBlogPage from "./pages/admin/AdminBlogPage";
import AdminTicketsPage from "./pages/admin/AdminTicketsPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";

function AppInitializer() {
  const { fetchMe, markAuthChecked } = useAuthStore();
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchMe();
    } else {
      markAuthChecked();
    }
  }, [fetchMe, markAuthChecked]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInitializer />
      <Toaster position="top-right" />

      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Main layout */}
        <Route element={<MainLayout />}>
          {/* Public */}
          <Route index element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:id" element={<ProductDetailPage />} />
          <Route path="/blog" element={<BlogPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/blog/new" element={<CreatePostPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Admin — sidebar layout, no top navbar */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/blog" element={<AdminBlogPage />} />
            <Route path="/admin/tickets" element={<AdminTicketsPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/chat" element={<ChatPage />} />
            <Route path="/admin/profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
