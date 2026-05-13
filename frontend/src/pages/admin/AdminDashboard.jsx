import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getSalesStats, getAllOrders } from "../../api/shop";
import { adminGetPosts } from "../../api/blog";
import { getAllTickets } from "../../api/tickets";
import { getUsers } from "../../api/auth";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, ordersRes, postsRes, ticketsRes, usersRes] =
          await Promise.all([
            getSalesStats(),
            getAllOrders({ limit: 5 }),
            adminGetPosts({ limit: 5 }),
            getAllTickets({ limit: 5 }),
            getUsers({ limit: 1 }),
          ]);
        setStats({
          sales: statsRes.data,
          recentOrders: ordersRes.data.orders || ordersRes.data.data || [],
          pendingPosts:
            postsRes.data.posts?.filter((p) => p.status === "PENDING") || [],
          openTickets:
            ticketsRes.data.tickets?.filter((t) => t.status === "OPEN") || [],
          totalUsers: usersRes.data.total || 0,
        });
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="page-loader">Loading dashboard...</div>;

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">
            ${Number(stats?.sales?.totalRevenue || 0).toFixed(2)}
          </p>
        </div>
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-value">{stats?.sales?.totalOrders || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Posts</h3>
          <p className="stat-value">{stats?.pendingPosts?.length || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Open Tickets</h3>
          <p className="stat-value">{stats?.openTickets?.length || 0}</p>
        </div>
      </div>

      <div className="admin-sections">
        <div className="admin-section">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <Link to="/admin/orders">View All</Link>
          </div>
          {stats?.recentOrders?.map((o) => (
            <div key={o.id} className="list-item">
              <span>#{o.id.slice(0, 8)}</span>
              <span>{o.status}</span>
              <span>${Number(o.total).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="admin-section">
          <div className="section-header">
            <h2>Pending Blog Posts</h2>
            <Link to="/admin/blog">Moderate</Link>
          </div>
          {stats?.pendingPosts?.map((p) => (
            <div key={p.id} className="list-item">
              <span>{p.title}</span>
              <span>{p.author?.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-nav">
        <Link to="/admin/products" className="admin-nav-card">
          Products
        </Link>
        <Link to="/admin/orders" className="admin-nav-card">
          Orders
        </Link>
        <Link to="/admin/blog" className="admin-nav-card">
          Blog
        </Link>
        <Link to="/admin/tickets" className="admin-nav-card">
          Tickets
        </Link>
        <Link to="/admin/users" className="admin-nav-card">
          Users
        </Link>
      </div>
    </div>
  );
}
