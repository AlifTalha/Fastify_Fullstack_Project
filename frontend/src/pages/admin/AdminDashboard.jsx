import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getSalesStats, getAllOrders } from "../../api/shop";
import { getBlogStats } from "../../api/blog";
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
            getBlogStats(),
            getAllTickets({ limit: 5 }),
            getUsers({ limit: 1 }),
          ]);
        setStats({
          sales: statsRes.data,
          recentOrders: ordersRes.data.orders || ordersRes.data.data || [],
          blogStats: postsRes.data.data || postsRes.data,
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
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-3xl border border-gray-200 bg-linear-to-br from-white via-indigo-50/30 to-orange-50/40 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Monitor sales, tickets, blog moderation, and user growth.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Revenue",
            value: `$${Number(stats?.sales?.totalRevenue || 0).toFixed(2)}`,
          },
          { label: "Total Orders", value: stats?.sales?.totalOrders || 0 },
          { label: "Blog Pending", value: stats?.blogStats?.pending || 0 },
          { label: "Open Tickets", value: stats?.openTickets?.length || 0 },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">{item.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <Link
              to="/admin/orders"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-100 px-5">
            {stats?.recentOrders?.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="font-medium text-gray-800">
                  #{o.id.slice(0, 8)}
                </span>
                <span className="text-gray-500">{o.status}</span>
                <span className="font-semibold text-gray-900">
                  ${Number(o.total).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-lg font-bold text-gray-900">Blog Overview</h2>
            <Link
              to="/admin/blog"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Moderate
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 px-5 py-5">
            {[
              { label: "Total", value: stats?.blogStats?.total || 0 },
              { label: "Pending", value: stats?.blogStats?.pending || 0 },
              { label: "Approved", value: stats?.blogStats?.approved || 0 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          <div className="px-5 pb-5">
            <p className="mb-3 text-sm font-semibold text-gray-700">
              Latest Posts
            </p>
            <div className="space-y-2">
              {stats?.blogStats?.latest?.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm"
                >
                  <span className="truncate font-medium text-gray-800">
                    {post.title}
                  </span>
                  <span className="ml-3 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-600">
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Link
          to="/admin/products"
          className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center font-semibold text-gray-800 shadow-sm hover:border-orange-200 hover:bg-orange-50"
        >
          Products
        </Link>
        <Link
          to="/admin/orders"
          className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center font-semibold text-gray-800 shadow-sm hover:border-orange-200 hover:bg-orange-50"
        >
          Orders
        </Link>
        <Link
          to="/admin/blog"
          className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center font-semibold text-gray-800 shadow-sm hover:border-orange-200 hover:bg-orange-50"
        >
          Blog
        </Link>
        <Link
          to="/admin/tickets"
          className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center font-semibold text-gray-800 shadow-sm hover:border-orange-200 hover:bg-orange-50"
        >
          Tickets
        </Link>
        <Link
          to="/admin/users"
          className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center font-semibold text-gray-800 shadow-sm hover:border-orange-200 hover:bg-orange-50"
        >
          Users
        </Link>
      </div>
    </div>
  );
}
