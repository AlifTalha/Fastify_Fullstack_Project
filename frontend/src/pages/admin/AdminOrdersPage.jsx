import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { getAllOrders, getSalesStats, getOrderByIdAdmin } from "../../api/shop";

// ─── constants ───────────────────────────────────────────────────────────────
const LIMIT = 5;

const STATUS_META = {
  PENDING: {
    label: "Pending",
    pill: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-400",
  },
  PAID: {
    label: "Paid",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  SHIPPED: {
    label: "Shipped",
    pill: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  DELIVERED: {
    label: "Delivered",
    pill: "border-indigo-200 bg-indigo-50 text-indigo-700",
    dot: "bg-indigo-500",
  },
  CANCELLED: {
    label: "Cancelled",
    pill: "border-red-200 bg-red-50 text-red-600",
    dot: "bg-red-400",
  },
  FAILED: {
    label: "Failed",
    pill: "border-rose-200 bg-rose-50 text-rose-600",
    dot: "bg-rose-400",
  },
  REFUNDED: {
    label: "Refunded",
    pill: "border-purple-200 bg-purple-50 text-purple-600",
    dot: "bg-purple-400",
  },
};

const BASE =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";
const getImageUrl = (url) =>
  !url ? null : /^https?:\/\//i.test(url) ? url : `${BASE}${url}`;
const getPrimaryProductImage = (product) => {
  if (Array.isArray(product?.imageUrls) && product.imageUrls.length) {
    return product.imageUrls[0];
  }
  return product?.imageUrl || null;
};
const fmtAmount = (cents) =>
  cents != null ? `$${Number(cents).toFixed(2)}` : "—";
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// ─── StatusPill ───────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const m = STATUS_META[status] || {
    label: status,
    pill: "border-gray-200 bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${m.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="mt-0.5 text-xl font-bold tracking-tight text-gray-900">
          {value}
        </p>
        {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ─── OrderDetailDrawer ────────────────────────────────────────────────────────
function OrderDetailDrawer({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    setLoading(true);
    setOrder(null);
    setImgErr(false);
    getOrderByIdAdmin(orderId)
      .then(({ data }) => {
        if (!cancelled) setOrder(data.invoice || data.order || data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load order detail");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (!orderId) return null;

  const imgSrc = getPrimaryProductImage(order?.product)
    ? getImageUrl(getPrimaryProductImage(order.product))
    : null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
              Order Detail
            </p>
            {order && (
              <p className="mt-0.5 font-mono text-sm font-bold text-gray-900">
                {order.invoiceNumber || `#${order.id?.slice(0, 8)}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          ) : !order ? (
            <p className="mt-10 text-center text-sm text-gray-400">
              Order not found
            </p>
          ) : (
            <div className="space-y-5">
              {/* Product card */}
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                {imgSrc && !imgErr && (
                  <img
                    src={imgSrc}
                    alt={order.product?.name}
                    className="h-48 w-full object-cover"
                    onError={() => setImgErr(true)}
                  />
                )}
                <div className="p-4">
                  <p className="font-semibold text-gray-900">
                    {order.product?.name || "—"}
                  </p>
                  {order.product?.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">
                      {order.product.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      Unit price:{" "}
                      <strong>{fmtAmount(order.product?.price)}</strong>
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500">
                      Qty: <strong>{order.quantity ?? 1}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Amount Paid</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {fmtAmount(order.amount)}
                  </p>
                  <p className="text-[11px] uppercase text-gray-400">
                    {order.currency || "usd"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="mt-2">
                    <StatusPill status={order.status} />
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Customer
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                    {(order.user?.name ||
                      order.user?.email ||
                      "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {order.user?.name || "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.user?.email || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Details
                </p>
                {[
                  ["Order ID", order.id],
                  ["Invoice #", order.invoiceNumber],
                  ["Date", fmtDate(order.createdAt)],
                  [
                    "Stripe PI",
                    order.stripePaymentIntentId
                      ? order.stripePaymentIntentId.slice(0, 22) + "…"
                      : "—",
                  ],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-start justify-between gap-2"
                  >
                    <span className="text-xs text-gray-500">{k}</span>
                    <span className="break-all text-right font-mono text-xs font-medium text-gray-900">
                      {v || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

export default function AdminOrdersPage() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Load stats once
  useEffect(() => {
    getSalesStats()
      .then(({ data }) => setStats(data.stats || data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  // Load orders on page / filter change
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      const { data } = await getAllOrders(params);
      const t = data.total ?? data.count ?? 0;
      setOrders(data.orders || data.data || []);
      setTotal(t);
      setTotalPages(Math.max(1, Math.ceil(t / LIMIT)));
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleFilterChange = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  // Pagination
  const filtered = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => {
      if (totalPages <= 7) return true;
      if (n === 1 || n === totalPages) return true;
      if (Math.abs(n - page) <= 1) return true;
      return false;
    },
  );
  const pageNums = filtered.reduce((acc, n, idx) => {
    if (idx > 0 && n - filtered[idx - 1] > 1) acc.push("…");
    acc.push(n);
    return acc;
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-6 rounded-3xl border border-gray-200 bg-linear-to-br from-white via-orange-50/30 to-indigo-50/40 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Orders Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View all orders, track revenue, and inspect individual purchases.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-gray-100 bg-white"
            />
          ))
        ) : (
          <>
            <StatCard
              accent="bg-indigo-50 text-indigo-600"
              label="Total Orders"
              value={stats?.totalOrders ?? "—"}
              sub="all time"
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              }
            />
            <StatCard
              accent="bg-emerald-50 text-emerald-600"
              label="Paid Orders"
              value={stats?.paidOrders ?? "—"}
              sub="confirmed"
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
            <StatCard
              accent="bg-amber-50 text-amber-600"
              label="Pending Orders"
              value={stats?.pendingOrders ?? "—"}
              sub="awaiting payment"
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
            <StatCard
              accent="bg-orange-50 text-orange-600"
              label="Total Revenue"
              value={
                stats?.totalRevenueFormatted
                  ? `$${stats.totalRevenueFormatted.split(" ")[0]}`
                  : stats?.totalRevenueCents != null
                    ? `$${Number(stats.totalRevenueCents).toFixed(2)}`
                    : "—"
              }
              sub="from paid orders"
              icon={
                <svg
                  className="h-5 w-5"
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
          </>
        )}
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-gray-900">All Orders</p>
            {!loading && (
              <p className="text-xs text-gray-400">
                {total} order{total !== 1 ? "s" : ""} found
              </p>
            )}
          </div>
          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleFilterChange(value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === value
                    ? "border-orange-400 bg-orange-500 text-white shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
                  <div className="ml-auto h-4 w-16 animate-pulse rounded bg-gray-100" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg
                className="mb-3 h-10 w-10 text-gray-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-sm font-medium text-gray-400">
                No orders found
              </p>
              {statusFilter && (
                <button
                  onClick={() => handleFilterChange("")}
                  className="mt-2 text-xs text-orange-500 underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="group transition hover:bg-orange-50/30"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold text-gray-700">
                        {o.invoiceNumber || `#${o.id.slice(0, 8)}`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                          {(o.user?.name ||
                            o.user?.email ||
                            "?")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">
                            {o.user?.name || "—"}
                          </p>
                          <p className="truncate text-[11px] text-gray-400">
                            {o.user?.email || ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-35 truncate text-gray-700">
                        {o.product?.name || "—"}
                      </p>
                      {o.quantity && (
                        <p className="text-[11px] text-gray-400">
                          × {o.quantity}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-semibold text-gray-900">
                        {fmtAmount(o.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {fmtDate(o.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelectedOrderId(o.id)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 opacity-0 shadow-sm transition group-hover:opacity-100 hover:border-orange-300 hover:text-orange-600"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <div className="flex flex-col items-center gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-between">
            <p className="text-xs text-gray-500">
              Page <span className="font-semibold text-gray-700">{page}</span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700">{totalPages}</span>{" "}
              · {total} total
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              {pageNums.map((item, idx) =>
                item === "…" ? (
                  <span
                    key={`e-${idx}`}
                    className="flex h-8 w-8 items-center justify-center text-xs text-gray-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                      page === item
                        ? "border-orange-400 bg-orange-500 text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-600"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}
