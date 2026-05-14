import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getSalesStats, getAllOrders } from "../../api/shop";
import { getBlogStats } from "../../api/blog";
import { getAllTickets } from "../../api/tickets";
import { getUsers } from "../../api/auth";

const STATUS_COLORS = {
  PAID: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-600",
};

const BLOG_STATUS_COLORS = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
};

const TICKET_PRIORITY_COLORS = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-sky-100 text-sky-700",
};

function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
          {value}
        </p>
        {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ title, to, linkLabel }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {to && (
        <Link
          to={to}
          className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

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
          sales: statsRes.data.stats || statsRes.data,
          recentOrders: ordersRes.data.orders || ordersRes.data.data || [],
          blogStats: postsRes.data.data || postsRes.data,
          tickets: ticketsRes.data.tickets || [],
          ticketCounts: ticketsRes.data.counts || {},
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading dashboard�</p>
        </div>
      </div>
    );
  }

  const openTickets = stats?.tickets?.filter((t) => t.status === "OPEN") || [];
  const revenue =
    stats?.sales?.totalRevenueCents ?? stats?.sales?.totalRevenue ?? 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* -- Page header ----------------------------------------------------- */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor sales, tickets, blog moderation, and user growth.
          </p>
        </div>
        <p className="text-xs text-gray-400">
          {new Date().toLocaleDateString([], {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* -- Stat cards ------------------------------------------------------ */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={`$${Number(revenue).toFixed(2)}`}
          sub={`${stats?.sales?.totalOrders ?? 0} total orders`}
          color="bg-emerald-100"
          icon={
            <svg
              className="h-5 w-5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          label="Total Orders"
          value={stats?.sales?.totalOrders ?? 0}
          sub={`${stats?.sales?.paidOrders ?? 0} paid � ${stats?.sales?.pendingOrders ?? 0} pending`}
          color="bg-blue-100"
          icon={
            <svg
              className="h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          }
        />
        <StatCard
          label="Blog Pending"
          value={stats?.blogStats?.pending ?? 0}
          sub={`${stats?.blogStats?.total ?? 0} total posts`}
          color="bg-amber-100"
          icon={
            <svg
              className="h-5 w-5 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          }
        />
        <StatCard
          label="Open Tickets"
          value={openTickets.length}
          sub={`${stats?.ticketCounts?.ALL ?? stats?.tickets?.length ?? 0} total tickets`}
          color="bg-orange-100"
          icon={
            <svg
              className="h-5 w-5 text-orange-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
          }
        />
      </div>

      {/* -- Main panels ----------------------------------------------------- */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <SectionHeader
            title="Recent Orders"
            to="/admin/orders"
            linkLabel="View All"
          />
          {stats?.recentOrders?.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">
              No orders yet
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats?.recentOrders?.map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                    <svg
                      className="h-4 w-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      #{o.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {o.product?.name ?? "Product"}
                      {o.quantity > 1 ? ` �${o.quantity}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {o.status}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-gray-900">
                    {o.amountFormatted
                      ? `$${o.amountFormatted.split(" ")[0]}`
                      : `$${Number(o.amount ?? 0).toFixed(2)}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Blog Overview */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <SectionHeader
            title="Blog Overview"
            to="/admin/blog"
            linkLabel="Moderate"
          />
          <div className="grid grid-cols-3 gap-3 px-5 pt-4 pb-2">
            {[
              {
                label: "Total",
                value: stats?.blogStats?.total ?? 0,
                cls: "text-gray-900",
              },
              {
                label: "Pending",
                value: stats?.blogStats?.pending ?? 0,
                cls: "text-amber-600",
              },
              {
                label: "Approved",
                value: stats?.blogStats?.approved ?? 0,
                cls: "text-emerald-600",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-gray-50 p-3 text-center"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {item.label}
                </p>
                <p className={`mt-1.5 text-2xl font-bold ${item.cls}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          <div className="px-5 pb-4 pt-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">
              Latest Posts
            </p>
            <div className="space-y-1.5">
              {stats?.blogStats?.latest?.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5"
                >
                  <p className="truncate pr-3 text-sm font-medium text-gray-800">
                    {post.title}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      BLOG_STATUS_COLORS[post.status] ??
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* -- Recent Tickets -------------------------------------------------- */}
      {openTickets.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <SectionHeader
            title="Open Tickets"
            to="/admin/tickets"
            linkLabel="View All"
          />
          <div className="divide-y divide-gray-50">
            {openTickets.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <svg
                    className="h-4 w-4 text-orange-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {t.subject}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t.user?.name ?? "Unknown user"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    TICKET_PRIORITY_COLORS[t.priority] ??
                    "bg-gray-100 text-gray-600"
                  }`}
                >
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
