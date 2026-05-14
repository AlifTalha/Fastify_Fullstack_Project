import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getCatalogItem, createOrder } from "../../api/shop";
import useAuthStore from "../../store/authStore";

const BASE =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

const getImageUrl = (url) =>
  !url ? "" : /^https?:\/\//i.test(url) ? url : `${BASE}${url}`;

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await getCatalogItem(id);
        if (!cancelled) setProduct(data.product || data);
      } catch {
        toast.error("Product not found");
        navigate("/shop");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const handleOrder = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      setOrdering(true);
      const { data } = await createOrder({ productId: product.id, quantity });
      const orderId = data.order?.id || data.id;
      toast.success("Order placed!");
      navigate(`/orders/${orderId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Order failed");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 h-4 w-40 rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="aspect-square rounded-2xl bg-gray-200" />
          <div className="space-y-5">
            <div className="h-6 w-3/4 rounded bg-gray-200" />
            <div className="h-8 w-1/3 rounded bg-gray-200" />
            <div className="h-20 w-full rounded bg-gray-100" />
            <div className="h-12 w-full rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const imageSrc = getImageUrl(product.imageUrl);
  const inStock = product.stock > 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link to="/" className="transition hover:text-gray-600 no-underline">
          Home
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
        <Link
          to="/shop"
          className="transition hover:text-gray-600 no-underline"
        >
          Shop
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
        <span className="line-clamp-1 text-gray-700">{product.name}</span>
      </nav>

      {/* Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
          {imageSrc && !imgError ? (
            <img
              src={imageSrc}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex aspect-square items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
              <svg
                className="h-20 w-20 text-gray-300"
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

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
              Product
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-extrabold text-indigo-600">
              ${Number(product.price).toFixed(2)}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                inStock
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}
            >
              {inStock ? `${product.stock} in stock` : "Out of stock"}
            </span>
          </div>

          {product.description && (
            <p className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-600">
              {product.description}
            </p>
          )}

          {inStock ? (
            <div className="space-y-4">
              {/* Quantity picker */}
              <div>
                <label className="mb-2 block text-xs font-bold text-gray-700">
                  Quantity
                </label>
                <div className="flex w-fit items-center overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="flex h-10 w-10 items-center justify-center text-gray-500 transition hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-30"
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
                        d="M20 12H4"
                      />
                    </svg>
                  </button>
                  <span className="min-w-10 text-center text-sm font-bold text-gray-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(product.stock, q + 1))
                    }
                    disabled={quantity >= product.stock}
                    className="flex h-10 w-10 items-center justify-center text-gray-500 transition hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-30"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Order total preview */}
              <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3">
                <span className="text-sm font-medium text-indigo-700">
                  Order total
                </span>
                <span className="text-lg font-extrabold text-indigo-700">
                  ${(Number(product.price) * quantity).toFixed(2)}
                </span>
              </div>

              {/* Buy button */}
              <button
                onClick={handleOrder}
                disabled={ordering}
                className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md disabled:opacity-50"
              >
                {ordering ? "Placing orderâ€¦" : "Buy Now"}
              </button>

              {!isAuthenticated && (
                <p className="text-center text-xs text-gray-400">
                  <Link
                    to="/login"
                    className="text-indigo-500 hover:underline no-underline"
                  >
                    Sign in
                  </Link>{" "}
                  to place an order
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-5 text-center">
              <p className="text-sm font-semibold text-red-500">
                This product is currently out of stock
              </p>
              <Link
                to="/shop"
                className="mt-2 inline-block text-xs text-indigo-500 no-underline hover:underline"
              >
                Browse other products â†’
              </Link>
            </div>
          )}

          <Link
            to="/shop"
            className="flex items-center gap-1.5 text-xs text-gray-400 no-underline transition hover:text-gray-600"
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
            Back to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
