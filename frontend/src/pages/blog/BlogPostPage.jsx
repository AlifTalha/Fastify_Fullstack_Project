import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import {
  getPublicPostBySlug,
  addComment,
  editComment,
  deleteComment,
  updatePost,
  deletePost,
} from "../../api/blog";
import useAuthStore from "../../store/authStore";

const BASE =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

const getImageUrl = (imageUrl) =>
  /^https?:\/\//i.test(imageUrl) ? imageUrl : `${BASE}${imageUrl}`;

const getEmbedUrl = (videoLink) => {
  if (!videoLink) return "";

  try {
    const url = new URL(videoLink);
    const host = url.hostname.replace(/^www\./, "");

    if (host.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      if (!videoId) return "";
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`;
    }

    if (host.includes("youtu.be")) {
      const videoId = url.pathname.replace("/", "");
      if (!videoId) return "";
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`;
    }

    return "";
  } catch {
    return "";
  }
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

export default function BlogPostPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingPost, setEditingPost] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuthStore();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await getPublicPostBySlug(slug);
        setPost(data.data || data.post || data);
      } catch {
        toast.error("Post not found");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  const onCommentSubmit = async ({ content }) => {
    try {
      if (editingCommentId) {
        const { data } = await editComment(post.id, editingCommentId, {
          content,
        });
        const updatedComment = data.data || data.comment || data;
        setPost((p) => ({
          ...p,
          comments: p.comments.map((c) =>
            c.id === editingCommentId
              ? {
                  ...c,
                  ...updatedComment,
                  content: updatedComment.content || content,
                }
              : c,
          ),
        }));
        setEditingCommentId(null);
        toast.success("Comment updated");
      } else {
        const { data } = await addComment(post.id, { content });
        const newComment = data.data || data.comment || data;
        setPost((p) => ({
          ...p,
          comments: [
            ...(p.comments || []),
            newComment?.id ? newComment : { content, user },
          ],
        }));
        toast.success("Comment added");
      }
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const onDeleteComment = async (commentId) => {
    const result = await Swal.fire({
      title: "Delete this comment?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "No",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteComment(post.id, commentId);
      setPost((p) => ({
        ...p,
        comments: p.comments.filter((c) => c.id !== commentId),
      }));
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setValue("content", comment.content);
  };

  const onEditPost = () => {
    setEditingPost(true);
    setValue("title", post.title);
    setValue("category", post.category);
    setValue("content", post.content);
    setValue("videoLink", post.videoLink || "");
    setValue("imageUrl", post.imageUrl || "");
  };

  const onUpdatePost = async (data) => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("category", data.category);
      formData.append("content", data.content);
      if (data.videoLink) formData.append("videoLink", data.videoLink);
      if (data.imageUrl) formData.append("imageUrl", data.imageUrl);

      // Handle file upload if present
      if (data.imageFile?.[0]) {
        formData.append("imageFile", data.imageFile[0]);
      }

      await updatePost(post.id, formData);
      setPost((p) => ({
        ...p,
        title: data.title,
        category: data.category,
        content: data.content,
        videoLink: data.videoLink || p.videoLink,
        imageUrl: data.imageUrl || p.imageUrl,
      }));
      setEditingPost(false);
      reset();
      toast.success("Blog updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update blog");
    } finally {
      setIsUpdating(false);
    }
  };

  const onDeletePost = async () => {
    const result = await Swal.fire({
      title: "Delete this blog post?",
      text: "This action cannot be undone. All comments will be deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "No",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deletePost(post.id);
      toast.success("Blog deleted successfully");
      setTimeout(() => (window.location.href = "/blog"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete blog");
    }
  };

  if (loading) return <div className="page-loader">Loading...</div>;
  if (!post) return null;

  const embedUrl = getEmbedUrl(post.videoLink);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate("/blog")}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Back to Blog
        </button>
      </div>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
      <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
        {/* Upper Section: Featured Image with Title Overlay */}
        {post.imageUrl ? (
          <div
            className="group relative overflow-hidden transition-transform duration-300 ease-out animate-fade-in"
            style={{ aspectRatio: "32 / 9" }}
          >
            <img
              src={getImageUrl(post.imageUrl)}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute left-6 bottom-6 right-6 text-white">
              <span className="inline-flex rounded-full bg-linear-to-r from-orange-500 to-rose-500 px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-lg backdrop-blur-sm">
                {post.category}
              </span>
              <h1 className="mt-4 max-w-3xl text-5xl font-bold tracking-tighter drop-shadow-lg sm:text-6xl">
                {post.title}
              </h1>
            </div>
          </div>
        ) : (
          <div className="border-b border-gray-100 bg-linear-to-br from-indigo-50 via-white to-orange-50 px-8 py-12">
            <span className="inline-flex rounded-full border-2 border-orange-300 bg-linear-to-r from-orange-50 to-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-700 shadow-sm">
              {post.category}
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tighter text-gray-900 sm:text-6xl">
              {post.title}
            </h1>
          </div>
        )}

        {/* Divider Gap */}
        {post.imageUrl && post.videoLink && (
          <div className="h-1 bg-linear-to-r from-transparent via-orange-200 to-transparent" />
        )}

        {/* Lower Section: Video */}
        {post.videoLink && (
          <div
            className="relative overflow-hidden animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            {embedUrl ? (
              <div
                className="relative overflow-hidden bg-black"
                style={{ aspectRatio: "16 / 9" }}
              >
                <div className="absolute inset-0 bg-linear-to-br from-gray-900/10 to-transparent pointer-events-none" />
                <iframe
                  src={embedUrl}
                  title={post.title}
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-4 bg-linear-to-r from-indigo-600 to-indigo-700 p-6 text-white"
                style={{ aspectRatio: "16 / 9" }}
              >
                <div className="text-center">
                  <p className="font-semibold text-lg">Video available</p>
                  <p className="text-indigo-100 text-sm mt-1">Click to watch</p>
                </div>
                <a
                  href={post.videoLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white px-6 py-2 font-bold text-indigo-600 hover:bg-indigo-50 transition-colors shadow-lg"
                >
                  Open Video
                </a>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-gray-700">
                {post.user?.name}
              </span>
              <span>•</span>
              <span>{formatDate(post.createdAt)}</span>
            </div>
            {user && user.id === post.user?.id && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onEditPost}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={onDeletePost}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="prose max-w-none prose-gray prose-headings:tracking-tight prose-a:text-orange-600">
            <div className="whitespace-pre-wrap text-base leading-8 text-gray-700">
              {post.content}
            </div>
          </div>

          <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-gray-900">
                Comments ({post.comments?.length || 0})
              </h3>
              <span className="text-xs text-gray-500">
                Share your thoughts below
              </span>
            </div>

            <div className="space-y-3">
              {post.comments?.length ? (
                post.comments.map((comment) => {
                  const ownerId = comment.user?.id || comment.authorId;
                  const canManage = user && ownerId === user.id;
                  return (
                    <div
                      key={comment.id}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {comment.user?.name ||
                              comment.author?.name ||
                              "User"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(comment.createdAt)}
                          </p>
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEditComment(comment)}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteComment(comment.id)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap leading-7 text-gray-700">
                        {comment.content}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                  No comments yet.
                </div>
              )}
            </div>
          </section>

          {user && (
            <form
              onSubmit={handleSubmit(onCommentSubmit)}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h4 className="text-lg font-bold text-gray-900">
                  {editingCommentId ? "Edit Comment" : "Add Comment"}
                </h4>
                {editingCommentId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCommentId(null);
                      reset();
                    }}
                    className="text-sm font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <textarea
                {...register("content", { required: true })}
                placeholder="Write a comment..."
                rows={4}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {editingCommentId ? "Update Comment" : "Post Comment"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Edit Post Modal */}
        {editingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4 sm:px-8">
                <h3 className="text-2xl font-bold text-gray-900">
                  Edit Blog Post
                </h3>
              </div>

              <form
                onSubmit={handleSubmit(onUpdatePost)}
                className="space-y-6 p-6 sm:p-8"
              >
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    {...register("title", { required: "Title is required" })}
                    type="text"
                    placeholder="Enter title"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      {...register("category", {
                        required: "Category is required",
                      })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                    >
                      <option value="TRAVEL">Travel</option>
                      <option value="TECHNOLOGY">Technology</option>
                      <option value="LIFESTYLE">Lifestyle</option>
                      <option value="FOOD">Food</option>
                      <option value="BUSINESS">Business</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Video Link
                    </label>
                    <input
                      {...register("videoLink")}
                      type="url"
                      placeholder="YouTube URL"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    {...register("imageUrl")}
                    type="url"
                    placeholder="Paste image URL"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Upload Image
                  </label>
                  <input
                    {...register("imageFile")}
                    type="file"
                    accept="image/*"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    {...register("content", {
                      required: "Content is required",
                    })}
                    placeholder="Write your blog content..."
                    rows={8}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(false);
                      reset();
                    }}
                    className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Update Post"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
