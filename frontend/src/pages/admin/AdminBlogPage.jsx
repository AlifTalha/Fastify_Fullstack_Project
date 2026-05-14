import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import {
  adminGetPosts,
  getBlogStats,
  updatePostStatus,
  adminDeletePost,
  getPublicPostBySlug,
} from "../../api/blog";

const STATUS_TABS = ["ALL", "PENDING", "APPROVED", "REJECTED"];
const BASE =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

const getImageUrl = (imageUrl) =>
  /^https?:\/\//i.test(imageUrl) ? imageUrl : `${BASE}${imageUrl}`;

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const getStatusBadgeStyle = (status) => {
  if (status === "APPROVED") {
    return "background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;";
  }
  if (status === "REJECTED") {
    return "background:#fff1f2;color:#be123c;border:1px solid #fecdd3;";
  }
  return "background:#fffbeb;color:#b45309;border:1px solid #fde68a;";
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [stats, setStats] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = status !== "ALL" ? { status, limit: 20 } : { limit: 20 };
      const [postsRes, statsRes] = await Promise.all([
        adminGetPosts(params),
        getBlogStats(),
      ]);
      setPosts(postsRes.data.posts || postsRes.data.data || []);
      setStats(statsRes.data.data || statsRes.data);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status]);

  const handleApprove = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Approve this post?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      await updatePostStatus(id, "APPROVED");
      toast.success("Post approved");
      setPosts((p) =>
        p.map((post) =>
          post.id === id ? { ...post, status: "APPROVED" } : post,
        ),
      );
    } catch {
      toast.error("Failed");
    }
  };

  const handleReject = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Reject this post?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      await updatePostStatus(id, "REJECTED");
      toast.success("Post rejected");
      setPosts((p) =>
        p.map((post) =>
          post.id === id ? { ...post, status: "REJECTED" } : post,
        ),
      );
    } catch {
      toast.error("Failed");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      await adminDeletePost(id);
      toast.success("Post deleted");
      setPosts((p) => p.filter((post) => post.id !== id));
    } catch {
      toast.error("Failed");
    }
  };

  const handleViewPost = async (slug) => {
    try {
      const { data } = await getPublicPostBySlug(slug);
      const post = data.data || data.post || data;

      const safeTitle = escapeHtml(post.title || "Untitled");
      const safeAuthor = escapeHtml(post.user?.name || "Unknown");
      const safeCategory = escapeHtml(post.category || "-");
      const safeStatus = escapeHtml(post.status || "PENDING");
      const safeContent = escapeHtml(post.content || "No content").replaceAll(
        "\n",
        "<br/>",
      );
      const safeDate = escapeHtml(
        post.createdAt ? new Date(post.createdAt).toLocaleString() : "-",
      );
      const imageBlock = post.imageUrl
        ? `<img src="${escapeHtml(getImageUrl(post.imageUrl))}" alt="${safeTitle}" style="width:100%;max-height:260px;object-fit:cover;border-radius:14px;border:1px solid #e5e7eb;"/>`
        : `<div style="width:100%;height:180px;border:1px dashed #d1d5db;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#9ca3af;background:#f9fafb;">No image available</div>`;

      await Swal.fire({
        width: 900,
        showCloseButton: true,
        confirmButtonText: "Close",
        confirmButtonColor: "#f97316",
        html: `
          <div style="text-align:left; font-family:inherit; color:#111827;">
            <p style="margin:0 0 8px; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#f97316; font-weight:700;">Blog Detail</p>
            <h2 style="margin:0 0 16px; font-size:28px; line-height:1.15; font-weight:800;">${safeTitle}</h2>
            ${imageBlock}
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin:14px 0 14px;">
              <span style="padding:4px 10px; border-radius:999px; border:1px solid #d1d5db; background:#f9fafb; font-size:12px; font-weight:700;">${safeCategory}</span>
              <span style="padding:4px 10px; border-radius:999px; font-size:12px; font-weight:700; ${getStatusBadgeStyle(post.status)}">${safeStatus}</span>
              <span style="padding:4px 10px; border-radius:999px; border:1px solid #d1d5db; background:#f9fafb; font-size:12px;">${safeAuthor}</span>
              <span style="padding:4px 10px; border-radius:999px; border:1px solid #d1d5db; background:#f9fafb; font-size:12px;">${safeDate}</span>
            </div>
            <div style="margin-top:10px; border:1px solid #e5e7eb; border-radius:14px; padding:14px; background:#ffffff; max-height:260px; overflow:auto; line-height:1.7; color:#374151;">${safeContent}</div>
          </div>
        `,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load post detail");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 overflow-hidden rounded-3xl border border-gray-200 bg-linear-to-br from-white via-orange-50/30 to-indigo-50/40 p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500">
              Moderation
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Blog Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Approve, reject, and manage blog posts from one dashboard.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Total", value: stats?.total ?? 0 },
              { label: "Pending", value: stats?.pending ?? 0 },
              { label: "Approved", value: stats?.approved ?? 0 },
              { label: "Rejected", value: stats?.rejected ?? 0 },
              { label: "Latest", value: stats?.latest?.length ?? 0 },
            ].map((item) => (
              <div
                key={item.label}
                className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-orange-300 via-orange-400 to-amber-300" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-extrabold leading-none text-gray-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
              status === s
                ? "border-orange-200 bg-orange-100 text-orange-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loader">Loading...</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/80 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-gray-400"
                    >
                      No posts found.
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="hover:bg-orange-50/30">
                      <td className="px-4 py-3">
                        <div className="max-w-md">
                          <p className="font-semibold text-gray-900">
                            {post.title}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                            {post.slug}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {post.user?.name || post.author?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {post.category}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${post.status === "APPROVED" ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : post.status === "REJECTED" ? "border border-rose-200 bg-rose-50 text-rose-700" : "border border-amber-200 bg-amber-50 text-amber-700"}`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                            onClick={() => handleViewPost(post.slug)}
                          >
                            View
                          </button>
                          {post.status === "PENDING" && (
                            <>
                              <button
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                onClick={() => handleApprove(post.id)}
                              >
                                Approve
                              </button>
                              <button
                                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                                onClick={() => handleReject(post.id)}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                            onClick={() => handleDelete(post.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
