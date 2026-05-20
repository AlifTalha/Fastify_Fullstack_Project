import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getCatalog, getMyOrders, downloadInvoice } from "../../api/shop";
import useAuthStore from "../../store/authStore";

const BASE =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

const getImageUrl = (url) =>
  !url ? "" : /^https?:\/\//i.test(url) ? url : `${BASE}${url}`;

const getPrimaryProductImage = (product) => {
  if (Array.isArray(product?.imageUrls) && product.imageUrls.length) {
    return product.imageUrls[0];
  }
  return product?.imageUrl || "";
};

function ProductCard({ product }) {
  const [imgError, setImgError] = useState(false);
  const src = getImageUrl(getPrimaryProductImage(product));
  const inStock = product.stock > 0;

  return (
    <Link
      to={`/shop/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg no-underline"
    >
      {/* Image */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100">
        {src && !imgError ? (
          <img
            src={src}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
            <svg
              className="h-12 w-12 text-gray-300"
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
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-700">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-1 font-semibold text-gray-900 transition-colors group-hover:text-indigo-600">
          {product.name}
        </h3>
        {product.description && (
          <p className="line-clamp-2 text-xs text-gray-400">
            {product.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-extrabold text-indigo-600">
            ${Number(product.price).toFixed(2)}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              inStock
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-gray-100 text-gray-400"
            }`}
          >
            {inStock ? `${product.stock} left` : "Sold out"}
          </span>
        </div>
        <div className="mt-3">
          <span className="block w-full rounded-xl bg-indigo-600 py-2 text-center text-sm font-semibold text-white transition-colors group-hover:bg-indigo-700">
            Shop Now
          </span>
        </div>
      </div>
    </Link>
  );
}

const LIMIT = 8;
const ORDER_LIMIT = 5;

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

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await getCatalog({ page, limit: LIMIT });
        if (!cancelled) {
          const t = data.total ?? data.count ?? 0;
          setProducts(data.products || data.data || []);
          setTotal(t);
          setTotalPages(Math.max(1, Math.ceil(t / LIMIT)));
        }
      } catch {
        if (!cancelled) toast.error("Failed to load products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const load = async () => {
      try {
        setOrdersLoading(true);
        const { data } = await getMyOrders({ page: 1, limit: ORDER_LIMIT });
        if (!cancelled) setOrders(data.orders || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleDownloadInvoice = async (id) => {
    try {
      setDownloadingId(id);
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
    } finally {
      setDownloadingId(null);
    }
  };

  // Build page numbers with ellipsis
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
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500">
            Catalog
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Shop All Products
          </h1>
          {!loading && total > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {total} products available
            </p>
          )}
        </div>
        {isAuthenticated && (
          <Link
            to="/orders"
            className="mt-1 flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 no-underline transition hover:bg-indigo-100"
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            My Orders
          </Link>
        )}
      </div>

      {/* Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white"
            >
              <div className="aspect-4/3 w-full bg-gray-200" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
                <div className="flex justify-between">
                  <div className="h-5 w-1/3 rounded bg-gray-200" />
                  <div className="h-5 w-1/4 rounded bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
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
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
            />
          </svg>
          <p className="text-sm font-medium text-gray-400">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-gray-500">
            Page <span className="font-semibold text-gray-700">{page}</span> of{" "}
            <span className="font-semibold text-gray-700">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1">
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
            {pageNums.map((item, idx) =>
              item === "…" ? (
                <span
                  key={`e-${idx}`}
                  className="flex h-9 w-9 items-center justify-center text-xs text-gray-400"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                    page === item
                      ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
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
        </div>
      )}

      {/* ── My Recent Orders ── */}
      {isAuthenticated && (
        <div className="mt-16 border-t border-gray-100 pt-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500">
              Account
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              My Recent Orders
            </h2>
          </div>

          {ordersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
              <svg
                className="mb-3 h-10 w-10 text-gray-300"
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
              <p className="text-sm font-medium text-gray-400">No orders yet</p>
              <p className="mt-1 text-xs text-gray-300">
                Buy a product above to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const s = STATUS[order.status] || STATUS.PENDING;
                const canInvoice = ["PAID", "SHIPPED", "DELIVERED"].includes(
                  order.status,
                );
                return (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
                  >
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-gray-900">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                            s.cls
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-400">
                        <span>{order.product?.name || "Product"}</span>
                        <span>·</span>
                        <span>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    </div>

                    {/* Amount + actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-base font-extrabold text-indigo-600">
                        ${Number(order.amount).toFixed(2)}
                      </span>

                      {canInvoice && (
                        <button
                          disabled={downloadingId === order.id}
                          onClick={() => handleDownloadInvoice(order.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
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
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          {downloadingId === order.id ? "…" : "Invoice"}
                        </button>
                      )}

                      <Link
                        to={`/orders/${order.id}`}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 no-underline transition hover:bg-gray-50"
                      >
                        View
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
                      </Link>
                    </div>
                  </div>
                );
              })}

              {/* Footer link */}
              <div className="pt-1 text-center">
                <Link
                  to="/orders"
                  className="text-sm font-semibold text-indigo-500 no-underline hover:text-indigo-700"
                >
                  View all orders &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
