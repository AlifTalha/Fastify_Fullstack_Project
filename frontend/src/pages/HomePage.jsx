import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCatalog } from "../api/shop";
import { getPublicPosts } from "../api/blog";
import SiteFooter from "../components/SiteFooter";

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

// ─── Hero ──────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-indigo-950 via-indigo-800 to-violet-700">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 py-24 text-center lg:flex-row lg:items-center lg:gap-16 lg:py-32 lg:text-left">
        {/* Text */}
        <div className="flex-1 text-white">
          <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-200 backdrop-blur-sm">
            Welcome to our store
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Discover Amazing{" "}
            <span className="bg-linear-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
              Products &amp; Stories
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-indigo-200 sm:text-lg lg:max-w-lg">
            Shop the latest collection, read insightful blog articles, and stay
            connected with our community — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
            <Link
              to="/shop"
              className="rounded-full bg-white px-7 py-3 text-sm font-bold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl no-underline"
            >
              Shop Now
            </Link>
            <Link
              to="/blog"
              className="rounded-full border border-white/30 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/20 no-underline"
            >
              Read Blog
            </Link>
          </div>
        </div>

        {/* Hero image */}
        <div className="flex-1">
          <div className="relative mx-auto w-full max-w-md">
            {/* Animated RGB border wrapper */}
            <div className="rgb-border shadow-2xl">
              <div className="rgb-border-inner">
                <img
                  src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=700&q=80"
                  alt="Hero shopping"
                  className="w-full object-cover"
                  style={{ aspectRatio: "4/3", display: "block" }}
                />
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 rounded-2xl bg-white px-5 py-3 shadow-xl">
              <p className="text-xs font-semibold text-gray-400">Products</p>
              <p className="text-xl font-extrabold text-indigo-600">
                New Arrivals ✨
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
        <svg
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          className="block h-12 w-full sm:h-16"
        >
          <path
            d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z"
            fill="#f9fafb"
          />
        </svg>
      </div>
    </section>
  );
}

// ─── Stats bar ─────────────────────────────────────────────────────────────────
function useCountUp(end, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (end == null) return;
    let startTime = null;
    let raf;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setCount(Math.floor(eased * end));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setCount(end);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);
  return count;
}

function StatItem({ label, end, suffix, display }) {
  const count = useCountUp(end);
  const value = display ?? `${count.toLocaleString()}${suffix ?? ""}`;
  return (
    <div className="flex flex-col items-center py-8">
      <p className="text-3xl font-extrabold text-indigo-600">{value}</p>
      <p className="mt-1 text-sm font-medium text-gray-500">{label}</p>
    </div>
  );
}

function StatsBar() {
  const stats = [
    { label: "Products", end: 50, suffix: "+" },
    { label: "Happy Customers", end: 1200, suffix: "+" },
    { label: "Blog Articles", end: 30, suffix: "+" },
    { label: "Support", end: null, display: "24/7" },
  ];
  return (
    <section className="border-b border-gray-100 bg-gray-50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-gray-100 sm:grid-cols-4 sm:divide-y-0">
        {stats.map((s) => (
          <StatItem key={s.label} {...s} />
        ))}
      </div>
    </section>
  );
}

// ─── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, subtitle, linkTo, linkLabel }) {
  return (
    <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-xl text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-5 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 no-underline"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

// ─── Blog section ──────────────────────────────────────────────────────────────
function BlogSection() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getPublicPosts({ limit: 3, status: "APPROVED" })
      .then(({ data }) => {
        if (!cancelled) setPosts(data.posts || data.data || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="From the blog"
          title="Latest Articles"
          subtitle="Stay informed with our most recent stories and insights."
          linkTo="/blog"
          linkLabel="View all posts"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg no-underline"
            >
              {/* Image */}
              <div className="aspect-video w-full overflow-hidden bg-linear-to-br from-indigo-100 to-violet-100">
                {post.imageUrl ? (
                  <img
                    src={getImageUrl(post.imageUrl)}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="flex h-full items-center justify-center text-4xl"
                    style={{ fontSize: "2.5rem" }}
                  >
                    {["📝", "💡", "🚀"][i % 3]}
                  </div>
                )}
              </div>
              {/* Body */}
              <div className="p-5">
                <span className="inline-block rounded-full bg-indigo-50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-indigo-600">
                  {post.category || "General"}
                </span>
                <h3 className="mt-3 line-clamp-2 text-base font-bold text-gray-900 group-hover:text-indigo-600">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
                  {post.content?.slice(0, 120)}
                  {post.content?.length > 120 ? "…" : ""}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <span className="font-medium text-gray-600">
                    {post.user?.name || "Author"}
                  </span>
                  <span>·</span>
                  <span>
                    {post.createdAt
                      ? new Date(post.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Products section ──────────────────────────────────────────────────────────
function ProductsSection() {
  const [products, setProducts] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    getCatalog({ limit: 4 })
      .then(({ data }) => {
        if (!cancelled) setProducts(data.products || data.data || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="bg-gray-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Featured products"
          title="New Arrivals"
          subtitle="Handpicked products just for you. Shop the latest collection today."
          linkTo="/shop"
          linkLabel="View all products"
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/shop/${product.id}`}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg no-underline"
            >
              <div className="aspect-square w-full overflow-hidden bg-gray-50">
                {getPrimaryProductImage(product) && !imageErrors[product.id] ? (
                  <img
                    src={getImageUrl(getPrimaryProductImage(product))}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    onError={() =>
                      setImageErrors((p) => ({ ...p, [product.id]: true }))
                    }
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-linear-to-br from-indigo-50 to-violet-50">
                    <svg
                      className="h-16 w-16 text-indigo-200"
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
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="line-clamp-1 font-bold text-gray-900 group-hover:text-indigo-600">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="mt-1 line-clamp-1 text-xs text-gray-400">
                    {product.description}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-extrabold text-indigo-600">
                    ${Number(product.price).toFixed(2)}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      product.stock > 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {product.stock > 0
                      ? `${product.stock} left`
                      : "Out of stock"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA banner ────────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section className="bg-linear-to-r from-indigo-600 via-indigo-700 to-violet-700 py-16">
      <div className="mx-auto max-w-3xl px-6 text-center text-white">
        <h2 className="text-3xl font-extrabold sm:text-4xl">
          Ready to get started?
        </h2>
        <p className="mt-4 text-indigo-200">
          Create an account today and enjoy exclusive deals, early access to new
          products, and more.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/register"
            className="rounded-full bg-white px-8 py-3 text-sm font-bold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl no-underline"
          >
            Create Account
          </Link>
          <Link
            to="/shop"
            className="rounded-full border border-white/30 bg-transparent px-8 py-3 text-sm font-bold text-white transition hover:bg-white/10 no-underline"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <BlogSection />
      <ProductsSection />
      <CTABanner />
      <SiteFooter />
    </>
  );
}
