import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  getCatalogItem,
  createOrder,
  getProductFeedback,
  submitFeedback,
  deleteFeedback,
} from "../../api/shop";
import { startOrGetConversation } from "../../api/chat";
import useAuthStore from "../../store/authStore";

const BASE =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

const getImageUrl = (url) =>
  !url ? "" : /^https?:\/\//i.test(url) ? url : `${BASE}${url}`;

const getProductImages = (product) => {
  const urls = Array.isArray(product?.imageUrls) ? product.imageUrls : [];
  if (urls.length) return urls;
  return product?.imageUrl ? [product.imageUrl] : [];
};

// ─── Star display ─────────────────────────────────────────────────────────────
function Stars({ value, size = "sm", interactive = false, onChange }) {
  const sz = size === "lg" ? "h-7 w-7" : "h-5 w-5";
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange && onChange(s)}
          className={`${sz} ${interactive ? "cursor-pointer hover:scale-110 transition" : "cursor-default pointer-events-none"}`}
          aria-label={`${s} star`}
        >
          <svg
            viewBox="0 0 20 20"
            fill={s <= value ? "#f59e0b" : "none"}
            stroke={s <= value ? "#f59e0b" : "#d1d5db"}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </span>
  );
}

// ─── Feedback Section ─────────────────────────────────────────────────────────
function FeedbackSection({ productId }) {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({ average: 0, count: 0 });
  const [loadingFB, setLoadingFB] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const loadFeedback = async () => {
    try {
      const { data } = await getProductFeedback(productId);
      setFeedbacks(data.data.feedbacks);
      setStats(data.data.stats);
      if (isAuthenticated && user) {
        setAlreadyReviewed(
          data.data.feedbacks.some((f) => f.user.id === user.id),
        );
      }
    } catch {
      // silent
    } finally {
      setLoadingFB(false);
    }
  };

  useEffect(() => {
    loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (myRating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    if (!myComment.trim()) {
      toast.error("Please write a comment");
      return;
    }
    try {
      setSubmitting(true);
      await submitFeedback(productId, {
        rating: myRating,
        comment: myComment.trim(),
      });
      toast.success("Review submitted!");
      setMyRating(0);
      setMyComment("");
      await loadFeedback();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit review";
      if (err.response?.status === 409) setAlreadyReviewed(true);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteFeedback(id);
      toast.success("Review deleted");
      await loadFeedback();
    } catch {
      toast.error("Failed to delete review");
    }
  };

  const handleChatWithReviewer = async (reviewerId) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to chat");
      navigate("/login");
      return;
    }
    try {
      const { data } = await startOrGetConversation({ receiverId: reviewerId });
      const conv = data.data || data;
      navigate("/chat", { state: { convId: conv.id } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start chat");
    }
  };

  return (
    <section className="mt-12 border-t border-gray-100 pt-10">
      <h2 className="mb-6 text-xl font-bold text-gray-900">Customer Reviews</h2>

      {/* Stats bar */}
      <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-6 py-5">
        <div className="flex flex-col items-center gap-1 pr-6 border-r border-gray-200">
          <span className="text-4xl font-extrabold text-amber-500">
            {stats.average || "—"}
          </span>
          <Stars value={Math.round(stats.average)} size="sm" />
          <span className="text-xs text-gray-400">
            {stats.count} review{stats.count !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex-1 min-w-[140px] space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const cnt = feedbacks.filter((f) => f.rating === star).length;
            const pct = stats.count ? Math.round((cnt / stats.count) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-3 text-right text-xs text-gray-500">
                  {star}
                </span>
                <svg
                  viewBox="0 0 16 16"
                  className="h-3 w-3 shrink-0"
                  fill="#f59e0b"
                >
                  <path d="M7.22 1.22c.28-.86 1.28-.86 1.56 0l.99 3.06a.92.92 0 00.88.64h3.22c.9 0 1.27 1.15.55 1.68l-2.6 1.89a.92.92 0 00-.34 1.04l.99 3.06c.28.86-.7 1.57-1.43 1.04L7 11.35a.92.92 0 00-1.09 0l-2.6 1.89c-.73.53-1.71-.18-1.43-1.04l.99-3.06a.92.92 0 00-.34-1.04L.04 6.22C-.68 5.69-.3 4.54.6 4.54h3.22a.92.92 0 00.88-.64l.99-3.06z" />
                </svg>
                <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-amber-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-7 text-xs text-gray-400">{cnt}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit form */}
      {isAuthenticated ? (
        alreadyReviewed ? (
          <div className="mb-8 rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 font-medium">
            ✓ You have already reviewed this product.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4"
          >
            <p className="text-sm font-bold text-gray-800">Write a review</p>
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-600">
                Your rating
              </label>
              <Stars
                value={myRating}
                interactive
                onChange={setMyRating}
                size="lg"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-600">
                Your comment
              </label>
              <textarea
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                rows={3}
                placeholder="Share your experience with this product..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                maxLength={500}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
          </form>
        )
      ) : (
        <div className="mb-8 rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 text-sm text-gray-500">
          <Link
            to="/login"
            className="text-indigo-500 font-semibold hover:underline no-underline"
          >
            Sign in
          </Link>{" "}
          to leave a review.
        </div>
      )}

      {/* Reviews list */}
      {loadingFB ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl bg-gray-100 h-24"
            />
          ))}
        </div>
      ) : feedbacks.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          No reviews yet. Be the first!
        </p>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((fb) => (
            <div
              key={fb.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {isAuthenticated && user?.id !== fb.user.id ? (
                    <button
                      onClick={() => handleChatWithReviewer(fb.user.id)}
                      title={`Chat with ${fb.user.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 shrink-0 transition hover:bg-indigo-200 hover:scale-105 cursor-pointer"
                    >
                      {fb.user.name?.[0]?.toUpperCase() || "?"}
                    </button>
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 shrink-0">
                      {fb.user.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {fb.user.name}
                    </p>
                    <Stars value={fb.rating} size="sm" />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">
                    {new Date(fb.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {isAuthenticated && user?.id !== fb.user.id && (
                    <button
                      onClick={() => handleChatWithReviewer(fb.user.id)}
                      title={`Chat with ${fb.user.name}`}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-indigo-500 transition hover:bg-indigo-50 hover:text-indigo-700"
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
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z"
                        />
                      </svg>
                      Chat
                    </button>
                  )}
                  {isAuthenticated && user?.id === fb.user.id && (
                    <button
                      onClick={() => handleDelete(fb.id)}
                      className="rounded-lg px-2 py-1 text-xs text-red-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {fb.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const THUMBS_VISIBLE = 4;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await getCatalogItem(id);
        if (!cancelled) {
          setActiveImageIndex(0);
          setThumbStart(0);
          setImgError(false);
          setZoomOrigin("50% 50%");
          setProduct(data.product || data);
        }
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

  const imageUrls = getProductImages(product);
  const selectedImage = imageUrls[activeImageIndex] || imageUrls[0] || "";
  const imageSrc = getImageUrl(selectedImage);
  const inStock = product.stock > 0;
  const maxThumbStart = Math.max(0, imageUrls.length - THUMBS_VISIBLE);
  const visibleThumbnails = imageUrls.slice(
    thumbStart,
    thumbStart + THUMBS_VISIBLE,
  );

  const handleMainImageMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    setZoomOrigin(`${clampedX}% ${clampedY}%`);
  };

  const handleSelectImage = (idx) => {
    setActiveImageIndex(idx);
    setImgError(false);

    if (idx < thumbStart) {
      setThumbStart(idx);
      return;
    }

    if (idx >= thumbStart + THUMBS_VISIBLE) {
      setThumbStart(Math.min(idx - THUMBS_VISIBLE + 1, maxThumbStart));
    }
  };

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
        <div className="space-y-3">
          <div
            className="group relative flex h-90 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 sm:h-105"
            onMouseMove={handleMainImageMouseMove}
            onMouseLeave={() => setZoomOrigin("50% 50%")}
          >
            {imageSrc && !imgError ? (
              <img
                src={imageSrc}
                alt={product.name}
                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-150"
                style={{ transformOrigin: zoomOrigin }}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
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

          {imageUrls.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setThumbStart((p) => Math.max(0, p - 1))}
                disabled={thumbStart === 0}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous thumbnails"
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

              <div className="grid flex-1 grid-cols-4 gap-2">
                {visibleThumbnails.map((url, offset) => {
                  const idx = thumbStart + offset;
                  return (
                    <button
                      key={`${url}-${idx}`}
                      type="button"
                      onClick={() => handleSelectImage(idx)}
                      className={`overflow-hidden rounded-xl border ${
                        idx === activeImageIndex
                          ? "border-indigo-500 ring-2 ring-indigo-100"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={getImageUrl(url)}
                        alt={`${product.name} ${idx + 1}`}
                        className="h-16 w-full object-cover"
                      />
                    </button>
                  );
                })}
                {visibleThumbnails.length < THUMBS_VISIBLE &&
                  Array.from({
                    length: THUMBS_VISIBLE - visibleThumbnails.length,
                  }).map((_, i) => (
                    <div
                      key={`thumb-empty-${i}`}
                      className="h-16 rounded-xl border border-dashed border-gray-200 bg-gray-50"
                    />
                  ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setThumbStart((p) => Math.min(maxThumbStart, p + 1))
                }
                disabled={thumbStart >= maxThumbStart}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next thumbnails"
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

      <FeedbackSection productId={product.id} />
    </div>
  );
}
