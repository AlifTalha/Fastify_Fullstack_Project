import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import {
  getMyOrderById,
  createCheckoutSession,
  downloadInvoice,
  cancelMyOrder,
} from "../../api/shop";

const STATUS = {
  PENDING: {
    label: "Pending",
    banner: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  PAID: {
    label: "Paid",
    banner: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  SHIPPED: {
    label: "Shipped",
    banner: "border-blue-200 bg-blue-50 text-blue-800",
    dot: "bg-blue-500",
  },
  DELIVERED: {
    label: "Delivered",
    banner: "border-indigo-200 bg-indigo-50 text-indigo-800",
    dot: "bg-indigo-500",
  },
  CANCELLED: {
    label: "Cancelled",
    banner: "border-red-200 bg-red-50 text-red-800",
    dot: "bg-red-500",
  },
};

const BASE =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

const getImageUrl = (url) =>
  !url ? "" : /^https?:\/\//i.test(url) ? url : `${BASE}${url}`;

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Show toast and clean URL when redirected back from Stripe
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("paid") === "1") {
      toast.success("Payment successful! Your order is confirmed.", {
        duration: 5000,
      });
      navigate(`/orders/${id}`, { replace: true });
    } else if (params.get("cancelled") === "1") {
      toast("Payment cancelled. Your order is still pending.", { icon: "ℹ️" });
      navigate(`/orders/${id}`, { replace: true });
    }
  }, [location.search, id, navigate]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await getMyOrderById(id);
        if (!cancelled) setOrder(data.invoice || data.order || data);
      } catch {
        toast.error("Order not found");
        navigate("/orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const handleCheckout = async () => {
    try {
      setActionLoading(true);
      const { data } = await createCheckoutSession(id);
      window.location.href = data.checkoutUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || "Checkout failed");
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: "Cancel this order?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel it",
      cancelButtonText: "Keep order",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!result.isConfirmed) return;
    try {
      setActionLoading(true);
      await cancelMyOrder(id);
      toast.success("Order cancelled");
      setOrder((o) => ({ ...o, status: "CANCELLED" }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancel failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", `invoice-${id.slice(0, 8)}.pdf`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      let msg = "Failed to download invoice";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          msg = json.message || msg;
        } catch {
          /* ignore */
        }
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 h-4 w-48 rounded bg-gray-200" />
        <div className="space-y-4 rounded-2xl border bg-white p-6">
          <div className="h-14 rounded-xl bg-gray-200" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-100" />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const s = STATUS[order.status] || STATUS.PENDING;
  const subtotal = Number(order.amount);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link
          to="/orders"
          className="no-underline transition hover:text-gray-600"
        >
          My Orders
        </Link>
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
        <span className="font-semibold text-gray-700">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </span>
      </nav>

      <div className="space-y-4">
        {/* Status banner */}
        <div
          className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${s.banner}`}
        >
          <div className="flex items-center gap-3">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide opacity-60">
                Order Status
              </p>
              <p className="font-bold">{s.label}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] opacity-60">Order ID</p>
            <p className="font-mono text-sm font-bold">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Date",
              value: order.createdAt
                ? new Date(order.createdAt).toLocaleDateString()
                : "â€”",
            },
            {
              label: "Items",
              value: `${order.quantity || 1} product`,
            },
            {
              label: "Total",
              value: `$${Number(order.amount).toFixed(2)}`,
            },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-gray-100 bg-white px-3 py-3 text-center"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {m.label}
              </p>
              <p className="mt-0.5 font-bold text-gray-900">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Items card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-bold text-gray-900">Order Items</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {order.product && (
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                  {getImageUrl(order.product.imageUrl) ? (
                    <img
                      src={getImageUrl(order.product.imageUrl)}
                      alt={order.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <svg
                        className="h-6 w-6 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">
                    {order.product.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    Unit price: ${Number(order.product.price).toFixed(2)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-gray-400">x{order.quantity}</p>
                  <p className="font-bold text-gray-900">
                    ${Number(order.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-700">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-xl font-extrabold text-indigo-600">
                ${Number(order.amount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {order.status === "PENDING" && (
            <>
              <button
                onClick={handleCheckout}
                disabled={actionLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md disabled:opacity-50"
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
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                {actionLoading ? "Redirectingâ€¦" : "Pay Now"}
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
              >
                Cancel Order
              </button>
            </>
          )}

          {(order.status === "PAID" ||
            order.status === "SHIPPED" ||
            order.status === "DELIVERED") && (
            <button
              onClick={handleDownloadInvoice}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Invoice
            </button>
          )}

          <Link
            to="/orders"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 no-underline transition hover:bg-gray-50"
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
            Back to Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
