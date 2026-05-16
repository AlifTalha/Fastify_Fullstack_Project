import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
  getProductFeedback,
  deleteFeedback,
} from "../../api/shop";

const BASE =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

const getProductImage = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE}${url}`;
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const FILTER_TABS = ["ALL", "ACTIVE", "OUT OF STOCK"];
const PAGE_SIZE = 6;

function StockBadge({ product }) {
  if (!product.isActive)
    return (
      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
        Inactive
      </span>
    );
  if (product.stock === 0)
    return (
      <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600">
        Out of Stock
      </span>
    );
  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
      In Stock
    </span>
  );
}

function ProductImage({ url, name, className }) {
  const src = getProductImage(url);
  if (src)
    return <img src={src} alt={name} className={`${className} object-cover`} />;
  return (
    <div
      className={`${className} flex items-center justify-center bg-linear-to-br from-indigo-50 to-violet-50`}
    >
      <svg
        className="h-1/2 w-1/2 text-indigo-200"
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
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [imageSource, setImageSource] = useState("file"); // "file" | "url"
  const [filePreview, setFilePreview] = useState(null);

  // Feedback modal state
  const [fbModal, setFbModal] = useState({
    open: false,
    product: null,
    feedbacks: [],
    stats: { average: 0, count: 0 },
    loading: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  // â”€â”€ Load products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await getAllProducts({ limit: 100 });
        if (!cancelled) setProducts(data.products || data.data || []);
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
  }, []);

  // â”€â”€ Derived data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const stats = {
    total: products.length,
    active: products.filter((p) => p.isActive).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
  };

  const filtered = products.filter((p) => {
    if (filter === "ACTIVE") return p.isActive;
    if (filter === "OUT OF STOCK") return p.stock === 0;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // â”€â”€ Modal helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openCreate = () => {
    setEditTarget(null);
    setImageSource("file");
    setFilePreview(null);
    reset();
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditTarget(product);
    setValue("name", product.name);
    setValue("description", product.description || "");
    setValue("price", product.price);
    setValue("stock", product.stock);
    setValue("isActive", product.isActive);
    if (product.imageUrl && /^https?:\/\//i.test(product.imageUrl)) {
      setImageSource("url");
      setValue("imageUrl", product.imageUrl);
      setFilePreview(null);
    } else {
      setImageSource("file");
      setValue("imageUrl", "");
      setFilePreview(
        product.imageUrl ? getProductImage(product.imageUrl) : null,
      );
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setFilePreview(null);
    reset();
  };

  // â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const onSubmit = async (values) => {
    try {
      const fd = new FormData();
      fd.append("name", values.name);
      if (values.description) fd.append("description", values.description);
      fd.append("price", values.price);
      fd.append("stock", values.stock);
      if (editTarget) fd.append("isActive", String(values.isActive ?? true));

      if (imageSource === "file") {
        if (values.image?.[0]) fd.append("image", values.image[0]);
      } else {
        if (values.imageUrl?.trim())
          fd.append("imageUrl", values.imageUrl.trim());
      }

      if (editTarget) {
        const { data } = await updateProduct(editTarget.id, fd);
        const updated = data.product || data.data;
        setProducts((prev) =>
          prev.map((p) => (p.id === editTarget.id ? updated : p)),
        );
        toast.success("Product updated");
      } else {
        const { data } = await createProduct(fd);
        const created = data.product || data.data;
        setProducts((prev) => [created, ...prev]);
        toast.success("Product created");
      }
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
    }
  };

  // â”€â”€ Feedback actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleViewFeedback = async (product) => {
    setFbModal({
      open: true,
      product,
      feedbacks: [],
      stats: { average: 0, count: 0 },
      loading: true,
    });
    try {
      const { data } = await getProductFeedback(product.id);
      setFbModal((prev) => ({
        ...prev,
        feedbacks: data.data.feedbacks,
        stats: data.data.stats,
        loading: false,
      }));
    } catch {
      toast.error("Failed to load feedback");
      setFbModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    const result = await Swal.fire({
      title: "Delete this review?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!result.isConfirmed) return;
    try {
      await deleteFeedback(feedbackId);
      setFbModal((prev) => ({
        ...prev,
        feedbacks: prev.feedbacks.filter((f) => f.id !== feedbackId),
        stats: {
          ...prev.stats,
          count: prev.stats.count - 1,
        },
      }));
      toast.success("Review deleted");
    } catch {
      toast.error("Failed to delete review");
    }
  };

  // â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleView = async (id) => {
    try {
      const { data } = await getProductById(id);
      const p = data.product || data.data || data;
      const imgSrc = getProductImage(p.imageUrl);
      const imageBlock = imgSrc
        ? `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(p.name)}" style="width:100%;max-height:240px;object-fit:cover;border-radius:14px;border:1px solid #e5e7eb;"/>`
        : `<div style="width:100%;height:140px;border:1px dashed #d1d5db;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#9ca3af;background:#f9fafb;font-size:13px;">No image available</div>`;

      const statusStyle = p.isActive
        ? "background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;"
        : "background:#f3f4f6;color:#6b7280;border:1px solid #e5e7eb;";
      const stockStyle =
        p.stock === 0
          ? "background:#fff1f2;color:#be123c;border:1px solid #fecdd3;"
          : "background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;";

      await Swal.fire({
        width: 680,
        showCloseButton: true,
        confirmButtonText: "Close",
        confirmButtonColor: "#6366f1",
        html: `
          <div style="text-align:left;font-family:inherit;color:#111827;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6366f1;font-weight:700;">Product Detail</p>
            <h2 style="margin:0 0 14px;font-size:22px;font-weight:800;line-height:1.2;">${escapeHtml(p.name)}</h2>
            ${imageBlock}
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin:14px 0;">
              <span style="padding:4px 12px;border-radius:999px;background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;font-size:12px;font-weight:700;">$${Number(p.price).toFixed(2)}</span>
              <span style="padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;${stockStyle}">${p.stock} in stock</span>
              <span style="padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;${statusStyle}">${p.isActive ? "Active" : "Inactive"}</span>
            </div>
            ${p.description ? `<div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;background:#f9fafb;font-size:13px;line-height:1.6;color:#374151;">${escapeHtml(p.description)}</div>` : ""}
            <p style="margin-top:12px;font-size:11px;color:#9ca3af;">Created: ${p.createdAt ? new Date(p.createdAt).toLocaleString() : "â€”"}</p>
          </div>
        `,
      });
    } catch {
      toast.error("Failed to load product details");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete this product?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!result.isConfirmed) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleRestock = async (id, name) => {
    const { value, isConfirmed } = await Swal.fire({
      title: `Restock "${name}"`,
      input: "number",
      inputLabel: "Quantity to add",
      inputPlaceholder: "e.g. 50",
      inputAttributes: { min: 1 },
      showCancelButton: true,
      confirmButtonText: "Add Stock",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#6366f1",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true,
      inputValidator: (v) =>
        !v || isNaN(v) || Number(v) < 1
          ? "Enter a valid positive quantity"
          : undefined,
    });
    if (!isConfirmed || !value) return;
    try {
      const { data } = await restockProduct(id, { quantity: Number(value) });
      const updated = data.product || data.data;
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success("Stock updated");
    } catch {
      toast.error("Failed to restock");
    }
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Page header + stats */}
      <div className="mb-6 overflow-hidden rounded-3xl border border-gray-200 bg-linear-to-br from-white via-indigo-50/30 to-violet-50/40 p-6 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500">
                Admin
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Products
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Create, edit, and manage all products from one dashboard.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="shrink-0 self-start rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md"
            >
              + Add Product
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total", value: stats.total, color: "text-indigo-600" },
              {
                label: "Active",
                value: stats.active,
                color: "text-emerald-600",
              },
              {
                label: "Out of Stock",
                value: stats.outOfStock,
                color: "text-rose-600",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-indigo-300 via-indigo-400 to-violet-300" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {s.label}
                </p>
                <p
                  className={`mt-1 text-2xl font-extrabold leading-none sm:text-3xl ${s.color}`}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTER_TABS.map((t) => (
          <button
            key={t}
            onClick={() => {
              setFilter(t);
              setPage(1);
            }}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
              filter === t
                ? "border-indigo-200 bg-indigo-100 text-indigo-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="page-loader">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-14 text-center text-sm text-gray-400">
          No products found.
        </div>
      ) : (
        <>
          {/* Mobile cards (hidden on md+) */}
          <div className="grid gap-4 sm:grid-cols-2 md:hidden">
            {paginated.map((p) => (
              <article
                key={p.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="flex gap-4 p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    <ProductImage
                      url={p.imageUrl}
                      name={p.name}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-bold text-gray-900">
                        {p.name}
                      </p>
                      <StockBadge product={p} />
                    </div>
                    {p.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
                        {p.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span className="font-bold text-indigo-600">
                        ${Number(p.price).toFixed(2)}
                      </span>
                      <span className="text-gray-400">{p.stock} in stock</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap border-t border-gray-100">
                  {[
                    {
                      label: "View",
                      fn: () => handleView(p.id),
                      cls: "text-indigo-600",
                    },
                    {
                      label: "Edit",
                      fn: () => openEdit(p),
                      cls: "text-gray-700",
                    },
                    {
                      label: "Restock",
                      fn: () => handleRestock(p.id, p.name),
                      cls: "text-emerald-600",
                    },
                    {
                      label: "Reviews",
                      fn: () => handleViewFeedback(p),
                      cls: "text-amber-600",
                    },
                    {
                      label: "Delete",
                      fn: () => handleDelete(p.id),
                      cls: "text-rose-600",
                    },
                  ].map((a) => (
                    <button
                      key={a.label}
                      onClick={a.fn}
                      className={`w-1/2 border-b border-r border-gray-100 py-3 text-xs font-semibold transition hover:bg-gray-50 last:border-b-0 sm:w-1/4 sm:border-b-0 ${a.cls}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {/* Desktop table (visible on md+) */}
          <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/80 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="w-16 px-4 py-3">Image</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((p) => (
                  <tr key={p.id} className="hover:bg-indigo-50/20">
                    <td className="px-4 py-3">
                      <div className="h-12 w-12 overflow-hidden rounded-xl">
                        <ProductImage
                          url={p.imageUrl}
                          name={p.name}
                          className="h-full w-full"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      {p.description && (
                        <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-gray-400">
                          {p.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo-600">
                      ${Number(p.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.stock}</td>
                    <td className="px-4 py-3">
                      <StockBadge product={p} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleView(p.id)}
                          className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRestock(p.id, p.name)}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Restock
                        </button>
                        <button
                          onClick={() => handleViewFeedback(p)}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                        >
                          Reviews
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {(safePage - 1) * PAGE_SIZE + 1}â€“
                  {Math.min(safePage * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {filtered.length}
                </span>{" "}
                products
              </p>

              <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
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

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => {
                    if (totalPages <= 7) return true;
                    if (n === 1 || n === totalPages) return true;
                    if (Math.abs(n - safePage) <= 1) return true;
                    return false;
                  })
                  .reduce((acc, n, idx, arr) => {
                    if (idx > 0 && n - arr[idx - 1] > 1) acc.push("â€¦");
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "â€¦" ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="flex h-8 w-8 items-center justify-center text-xs text-gray-400"
                      >
                        â€¦
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                          safePage === item
                            ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                            : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                        }`}
                      >
                        {item}
                      </button>
                    ),
                  )}

                {/* Next */}
                <button
                  disabled={safePage === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
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
        </>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
                  {editTarget ? "Edit" : "New"}
                </p>
                <h2 className="text-xl font-bold text-gray-900">
                  {editTarget ? "Edit Product" : "Create Product"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
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

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5 px-4 py-5 sm:px-6 sm:py-6"
            >
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register("name", { required: "Name is required" })}
                  placeholder="e.g. iPhone 15 Pro"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Product description..."
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700">
                    Price ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    {...register("price", { required: "Price is required" })}
                    placeholder="e.g. 999"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                  {errors.price && (
                    <p className="mt-1 text-xs text-rose-500">
                      {errors.price.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700">
                    Stock <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register("stock", { required: "Stock is required" })}
                    placeholder="e.g. 50"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                  {errors.stock && (
                    <p className="mt-1 text-xs text-rose-500">
                      {errors.stock.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Image source toggle */}
              <div>
                <label className="mb-2 block text-xs font-bold text-gray-700">
                  Product Image
                </label>
                <div className="mb-3 flex overflow-hidden rounded-xl border border-gray-200">
                  {[
                    { value: "file", label: "Upload File" },
                    { value: "url", label: "Image URL" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setImageSource(opt.value)}
                      className={`flex-1 py-2 text-xs font-semibold transition-colors ${imageSource === opt.value ? "bg-indigo-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {imageSource === "file" ? (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      {...register("image", {
                        onChange: (e) => {
                          const file = e.target.files?.[0];
                          setFilePreview(
                            file
                              ? URL.createObjectURL(file)
                              : editTarget?.imageUrl
                                ? getProductImage(editTarget.imageUrl)
                                : null,
                          );
                        },
                      })}
                      className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {filePreview && (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="mt-3 h-36 w-full rounded-xl border border-gray-200 object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      {...register("imageUrl")}
                      placeholder="https://example.com/product.jpg"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                    {watch("imageUrl") && (
                      <img
                        src={watch("imageUrl")}
                        alt="URL preview"
                        className="mt-3 h-36 w-full rounded-xl border border-gray-200 object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                        onLoad={(e) => {
                          e.target.style.display = "block";
                        }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* isActive toggle — edit only */}
              {editTarget && (
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Active
                    </p>
                    <p className="text-xs text-gray-400">
                      Inactive products are hidden from the catalog
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      {...register("isActive")}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full" />
                  </label>
                </div>
              )}

              {/* Submit buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving…"
                    : editTarget
                      ? "Update Product"
                      : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {fbModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) =>
            e.target === e.currentTarget &&
            setFbModal((prev) => ({ ...prev, open: false }))
          }
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">
                  Reviews
                </p>
                <h2 className="text-xl font-bold text-gray-900">
                  {fbModal.product?.name}
                </h2>
                {!fbModal.loading && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    {fbModal.stats.count} review
                    {fbModal.stats.count !== 1 ? "s" : ""}
                    {fbModal.stats.count > 0
                      ? ` avg ${fbModal.stats.average}`
                      : ""}
                  </p>
                )}
              </div>
              <button
                onClick={() => setFbModal((prev) => ({ ...prev, open: false }))}
                className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
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

            {/* Body */}
            <div className="px-5 py-5 sm:px-6 sm:py-6">
              {fbModal.loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-xl bg-gray-100 h-20"
                    />
                  ))}
                </div>
              ) : fbModal.feedbacks.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">
                  No reviews yet for this product.
                </p>
              ) : (
                <div className="space-y-4">
                  {fbModal.feedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 shrink-0">
                            {fb.user.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {fb.user.name}
                            </p>
                            <span className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <svg
                                  key={s}
                                  viewBox="0 0 20 20"
                                  className="h-4 w-4"
                                  fill={s <= fb.rating ? "#f59e0b" : "none"}
                                  stroke={
                                    s <= fb.rating ? "#f59e0b" : "#d1d5db"
                                  }
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-400">
                            {new Date(fb.createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                          <button
                            onClick={() => handleDeleteFeedback(fb.id)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-gray-600">
                        {fb.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
