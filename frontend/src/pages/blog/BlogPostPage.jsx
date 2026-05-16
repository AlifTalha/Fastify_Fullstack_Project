import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import {
  getPublicPostBySlug,
  incrementPostView,
  reactToPost,
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
  const viewedRef = useRef(false);
  // local reaction state (no server-side user tracking)
  const [userReaction, setUserReaction] = useState(null); // "LIKE" | "DISLIKE" | null
  const [reacting, setReacting] = useState(false);
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
        const loadedPost = data.data || data.post || data;
        setPost(loadedPost);
        // Restore reaction from localStorage
        if (user?.id && loadedPost?.id) {
          const stored = localStorage.getItem(
            `blog_reaction_${user.id}_${loadedPost.id}`,
          );
          if (stored === "LIKE" || stored === "DISLIKE")
            setUserReaction(stored);
        }
        if (!viewedRef.current) {
          viewedRef.current = true;
          incrementPostView(slug).catch(() => {});
        }
      } catch {
        toast.error("Post not found");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              {post.views != null && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    {post.views.toLocaleString()}{" "}
                    {post.views === 1 ? "view" : "views"}
                  </span>
                </>
              )}
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

          {/* ── Like / Dislike ────────────────────────────────────── */}
          {user && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={reacting}
                onClick={async () => {
                  if (reacting) return;
                  const wasLiked = userReaction === "LIKE";
                  const wasDisliked = userReaction === "DISLIKE";
                  const likeDelta = wasLiked ? -1 : 1;
                  const dislikeDelta = wasDisliked ? -1 : 0;
                  const newReaction = wasLiked ? null : "LIKE";
                  const prevReaction = userReaction;
                  const lsKey = `blog_reaction_${user.id}_${post.id}`;
                  setUserReaction(newReaction);
                  setPost((p) => ({
                    ...p,
                    likes: (p.likes || 0) + likeDelta,
                    dislikes: (p.dislikes || 0) + dislikeDelta,
                  }));
                  setReacting(true);
                  try {
                    const { data } = await reactToPost(
                      post.id,
                      likeDelta,
                      dislikeDelta,
                    );
                    const updated = data.data || data;
                    setPost((p) => ({
                      ...p,
                      likes: updated.likes,
                      dislikes: updated.dislikes,
                    }));
                    if (newReaction) localStorage.setItem(lsKey, newReaction);
                    else localStorage.removeItem(lsKey);
                  } catch {
                    setUserReaction(prevReaction);
                    setPost((p) => ({
                      ...p,
                      likes: (p.likes || 0) - likeDelta,
                      dislikes: (p.dislikes || 0) - dislikeDelta,
                    }));
                    toast.error("Failed to react");
                  } finally {
                    setReacting(false);
                  }
                }}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                  userReaction === "LIKE"
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                }`}
              >
                <svg
                  className="h-5 w-5"
                  fill={userReaction === "LIKE" ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
                <span>{post.likes ?? 0}</span>
              </button>

              <button
                type="button"
                disabled={reacting}
                onClick={async () => {
                  if (reacting) return;
                  const wasDisliked = userReaction === "DISLIKE";
                  const wasLiked = userReaction === "LIKE";
                  const dislikeDelta = wasDisliked ? -1 : 1;
                  const likeDelta = wasLiked ? -1 : 0;
                  const newReaction = wasDisliked ? null : "DISLIKE";
                  const prevReaction = userReaction;
                  const lsKey = `blog_reaction_${user.id}_${post.id}`;
                  setUserReaction(newReaction);
                  setPost((p) => ({
                    ...p,
                    likes: (p.likes || 0) + likeDelta,
                    dislikes: (p.dislikes || 0) + dislikeDelta,
                  }));
                  setReacting(true);
                  try {
                    const { data } = await reactToPost(
                      post.id,
                      likeDelta,
                      dislikeDelta,
                    );
                    const updated = data.data || data;
                    setPost((p) => ({
                      ...p,
                      likes: updated.likes,
                      dislikes: updated.dislikes,
                    }));
                    if (newReaction) localStorage.setItem(lsKey, newReaction);
                    else localStorage.removeItem(lsKey);
                  } catch {
                    setUserReaction(prevReaction);
                    setPost((p) => ({
                      ...p,
                      likes: (p.likes || 0) - likeDelta,
                      dislikes: (p.dislikes || 0) - dislikeDelta,
                    }));
                    toast.error("Failed to react");
                  } finally {
                    setReacting(false);
                  }
                }}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                  userReaction === "DISLIKE"
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                }`}
              >
                <svg
                  className="h-5 w-5"
                  fill={userReaction === "DISLIKE" ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                  />
                </svg>
                <span>{post.dislikes ?? 0}</span>
              </button>
            </div>
          )}

          {/* ── Share Bar ─────────────────────────────────────────── */}
          {(() => {
            const postUrl = encodeURIComponent(window.location.href);
            const postText = encodeURIComponent(
              `${post.title} — check this out!`,
            );
            const shares = [
              {
                label: "Facebook",
                href: `https://www.facebook.com/sharer/sharer.php?u=${postUrl}`,
                color:
                  "hover:bg-[#1877F2]/10 hover:text-[#1877F2] hover:border-[#1877F2]/30",
                icon: (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                ),
              },
              {
                label: "WhatsApp",
                href: `https://api.whatsapp.com/send?text=${postText}%20${postUrl}`,
                color:
                  "hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/30",
                icon: (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                ),
              },
              {
                label: "Telegram",
                href: `https://t.me/share/url?url=${postUrl}&text=${postText}`,
                color:
                  "hover:bg-[#229ED9]/10 hover:text-[#229ED9] hover:border-[#229ED9]/30",
                icon: (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                ),
              },
              {
                label: "X",
                href: `https://twitter.com/intent/tweet?text=${postText}&url=${postUrl}`,
                color:
                  "hover:bg-gray-900/10 hover:text-gray-900 hover:border-gray-400/40",
                icon: (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                ),
              },
            ];
            return (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Share
                </span>
                {shares.map(({ label, href, color, icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Share on ${label}`}
                    className={`flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all ${color}`}
                  >
                    {icon}
                    {label}
                  </a>
                ))}
                <button
                  type="button"
                  title="Copy link"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(window.location.href)
                      .then(() => toast.success("Link copied!"));
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300"
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
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  Copy link
                </button>
              </div>
            );
          })()}

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
