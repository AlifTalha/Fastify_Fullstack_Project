import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getPublicPosts, getMyPosts, updatePost } from "../../api/blog";

const CATEGORIES = [
  "ALL",
  "TECHNOLOGY",
  "HEALTH",
  "EDUCATION",
  "BUSINESS",
  "LIFESTYLE",
  "TRAVEL",
  "FOOD",
  "SPORTS",
  "ENTERTAINMENT",
  "OTHER",
];

const CATEGORY_LABELS = {
  TECHNOLOGY: "Technology",
  HEALTH: "Health",
  EDUCATION: "Education",
  BUSINESS: "Business",
  LIFESTYLE: "Lifestyle",
  TRAVEL: "Travel",
  FOOD: "Food",
  SPORTS: "Sports",
  ENTERTAINMENT: "Entertainment",
  OTHER: "Other",
};

const BASE =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

const getImageUrl = (imageUrl) =>
  /^https?:\/\//i.test(imageUrl) ? imageUrl : `${BASE}${imageUrl}`;

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "APPROVED":
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
};

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingPost, setEditingPost] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    category: "OTHER",
    videoLink: "",
    imageUrl: "",
  });
  const [editFile, setEditFile] = useState(null);

  const location = useLocation();
  const isMyPosts = new URLSearchParams(location.search).get("mine") === "true";

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const params = { page, limit: 10 };
        if (!isMyPosts && category !== "ALL") params.category = category;
        const { data } = isMyPosts
          ? await getMyPosts(params)
          : await getPublicPosts(params);
        const payload = data.data || data;
        setPosts(payload.posts || []);
        const total = Number(payload.total || 0);
        const limit = Number(payload.limit || 10);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      } catch {
        toast.error("Failed to load posts");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [page, category, isMyPosts]);

  const selectedLabel = useMemo(
    () => (category === "ALL" ? "All Categories" : CATEGORY_LABELS[category]),
    [category],
  );

  const handleOpenEdit = (post) => {
    setEditingPost(post);
    setEditForm({
      title: post.title || "",
      content: post.content || "",
      category: post.category || "OTHER",
      videoLink: post.videoLink || "",
      imageUrl: post.imageUrl || "",
    });
    setEditFile(null);
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editingPost) return;

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("content", editForm.content);
      formData.append("category", editForm.category);
      if (editForm.videoLink) formData.append("videoLink", editForm.videoLink);
      if (editForm.imageUrl) formData.append("imageUrl", editForm.imageUrl);
      if (editFile) formData.append("image", editFile);

      const { data } = await updatePost(editingPost.id, formData);
      const updated = data.data || data;
      setPosts((prev) =>
        prev.map((post) => (post.id === updated.id ? updated : post)),
      );
      setEditingPost(null);
      toast.success("Post updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-orange-100/80 bg-linear-to-br from-orange-50/90 via-white to-sky-50/80 p-6 shadow-[0_14px_40px_-24px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.9)]">
        <div className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full bg-linear-to-br from-orange-300/35 to-rose-300/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-linear-to-tr from-sky-300/30 to-indigo-300/10 blur-2xl" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/55 via-transparent to-transparent" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">
              {isMyPosts ? "My Posts" : "Blog"}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {isMyPosts
                ? "Manage and update your published drafts"
                : "Stories, tutorials, and updates"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
              {isMyPosts
                ? "Edit your own posts, update the image section, and keep content fresh."
                : "Explore approved posts across technology, health, education, and more."}
            </p>
          </div>
          <Link
            to="/blog/new"
            className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            Write Post
          </Link>
        </div>
      </div>

      {!isMyPosts && (
        <div className="mb-5 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                  category === cat
                    ? "border-orange-200 bg-orange-100 text-orange-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => {
                  setCategory(cat);
                  setPage(1);
                }}
              >
                {cat === "ALL" ? "All" : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isMyPosts && (
        <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {selectedLabel}</span>
        </div>
      )}

      {loading ? (
        <div className="page-loader">Loading posts...</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {posts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 sm:col-span-2 xl:col-span-3">
              {isMyPosts ? "You have no posts yet." : "No posts found."}
            </div>
          )}
          {posts.map((post) =>
            isMyPosts ? (
              <div
                key={post.id}
                className={`group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all ${post.status === "PENDING" ? "opacity-95" : "hover:-translate-y-1 hover:shadow-lg"}`}
              >
                <Link
                  to={`/blog/${post.slug}`}
                  className={`block ${post.status === "PENDING" ? "pointer-events-none cursor-not-allowed" : ""}`}
                  aria-disabled={post.status === "PENDING"}
                >
                  <div
                    className="relative bg-gray-100"
                    style={{ aspectRatio: "16 / 10" }}
                  >
                    {post.imageUrl ? (
                      <img
                        src={getImageUrl(post.imageUrl)}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 text-gray-400">
                        No image
                      </div>
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                      {CATEGORY_LABELS[post.category] || post.category}
                    </span>
                  </div>
                  <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold text-gray-900 transition-colors group-hover:text-orange-600">
                          {post.title}
                        </h2>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                          {post.content?.slice(0, 150)}...
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusBadgeClass(post.status || "APPROVED")}`}
                      >
                        {post.status || "APPROVED"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">
                        {post.user?.name || "Unknown"}
                      </span>
                      <div className="flex items-center gap-3">
                        {post.views != null && (
                          <span className="flex items-center gap-1">
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            {post.views.toLocaleString()}
                          </span>
                        )}
                        <span>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {post.status === "PENDING" && (
                      <p className="text-xs font-medium text-amber-600">
                        Pending posts cannot be opened until approved.
                      </p>
                    )}
                  </div>
                </Link>
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/70 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(post)}
                    disabled={post.status === "PENDING"}
                    className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Edit Post
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to={`/blog/${post.slug}`}
                key={post.id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className="relative bg-gray-100"
                  style={{ aspectRatio: "16 / 10" }}
                >
                  {post.imageUrl ? (
                    <img
                      src={getImageUrl(post.imageUrl)}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 text-gray-400">
                      No image
                    </div>
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                    {CATEGORY_LABELS[post.category] || post.category}
                  </span>
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold text-gray-900 transition-colors group-hover:text-orange-600">
                        {post.title}
                      </h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                        {post.content?.slice(0, 150)}...
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusBadgeClass(post.status || "APPROVED")}`}
                    >
                      {post.status || "APPROVED"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">
                      {post.user?.name || "Unknown"}
                    </span>
                    <div className="flex items-center gap-3">
                      {post.views != null && (
                        <span className="flex items-center gap-1">
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          {post.views.toLocaleString()}
                        </span>
                      )}
                      <span>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ),
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm font-medium text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 sm:items-center sm:p-4">
          <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex flex-col items-start justify-between gap-3 border-b border-gray-100 bg-linear-to-r from-orange-50 via-white to-indigo-50 px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500">
                  Edit Post
                </p>
                <h2 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
                  Update your blog post
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpdatePost} className="grid gap-5 p-4 sm:p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Post title"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    required
                  >
                    {CATEGORIES.filter((item) => item !== "ALL").map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={editForm.content}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  rows={8}
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="form-group">
                  <label>Video Link (optional)</label>
                  <input
                    value={editForm.videoLink}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        videoLink: e.target.value,
                      }))
                    }
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div className="form-group">
                  <label>Image URL (optional)</label>
                  <input
                    value={editForm.imageUrl}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        imageUrl: e.target.value,
                      }))
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Replace Image Upload (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                />
                {editingPost.imageUrl && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                    <div className="p-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Current Image
                    </div>
                    <img
                      src={getImageUrl(editingPost.imageUrl)}
                      alt={editingPost.title}
                      className="h-48 w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving ? "Saving..." : "Update Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
