import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getMyOrders } from "../../api/shop";

const STATUS = {
  PENDING: {
    label: "Pending",
    cls: "border-amber-200 bg-amber-50 text-amber-700",
  },
  PAID: {
    label: "Paid",
    cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  SHIPPED: {
    label: "Shipped",
    cls: "border-blue-200 bg-blue-50 text-blue-700",
  },
  DELIVERED: {
    label: "Delivered",
    cls: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  CANCELLED: {
    label: "Cancelled",
    cls: "border-red-200 bg-red-50 text-red-600",
  },
};

const LIMIT = 10;

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await getMyOrders({ page, limit: LIMIT });
        if (!cancelled) {
          setOrders(data.orders || data.data || []);
          setTotalPages(Math.ceil((data.total || 0) / LIMIT) || 1);
        }
      } catch {
        if (!cancelled) toast.error("Failed to load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500">
            Account
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            My Orders
          </h1>
        </div>
        <Link
          to="/shop"
          className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 no-underline transition hover:bg-indigo-100"
        >
          Shop More
        </Link>
      </div>

      {/* Skeleton */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-36 rounded bg-gray-200" />
                <div className="h-5 w-20 rounded bg-gray-100" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="h-3 w-28 rounded bg-gray-100" />
                <div className="h-5 w-16 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <svg
            className="mb-3 h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-sm font-medium text-gray-500">No orders yet</p>
          <Link
            to="/shop"
            className="mt-3 text-xs text-indigo-500 no-underline hover:underline"
          >
            Browse products â†’
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const s = STATUS[order.status] || STATUS.PENDING;
            return (
              <Link
                to={`/orders/${order.id}`}
                key={order.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm no-underline transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-gray-900">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-gray-400">
                    <span>{order.product?.name || "Product"}</span>
                    <span>·</span>
                    <span>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-lg font-extrabold text-indigo-600">
                    ${Number(order.amount).toFixed(2)}
                  </span>
                  <svg
                    className="h-4 w-4 text-gray-300"
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
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="mt-8 flex items-center justify-center gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg
              className="h-4 w-4"
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                page === n
                  ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg
              className="h-4 w-4"
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
      )}
    </div>
  );
}
