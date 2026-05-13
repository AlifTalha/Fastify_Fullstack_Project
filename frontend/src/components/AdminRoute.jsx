import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function AdminRoute() {
  const { user, isAuthenticated, isLoading, authChecked } = useAuthStore();

  if (isLoading || !authChecked)
    return <div className="page-loader">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;

  return <Outlet />;
}
