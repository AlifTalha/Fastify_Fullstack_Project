import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import {
  getPublicPostBySlug,
  addComment,
  editComment,
  deleteComment,
} from "../../api/blog";
import useAuthStore from "../../store/authStore";

const BASE =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingCommentId, setEditingCommentId] = useState(null);
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
        setPost(data.post || data);
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
        setPost((p) => ({
          ...p,
          comments: p.comments.map((c) =>
            c.id === editingCommentId
              ? { ...c, content: data.comment?.content || content }
              : c,
          ),
        }));
        setEditingCommentId(null);
        toast.success("Comment updated");
      } else {
        const { data } = await addComment(post.id, { content });
        setPost((p) => ({
          ...p,
          comments: [
            ...(p.comments || []),
            data.comment || { content, author: user },
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
    if (!window.confirm("Delete this comment?")) return;
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

  if (loading) return <div className="page-loader">Loading...</div>;
  if (!post) return null;

  return (
    <div className="container blog-post">
      {post.imageUrl && (
        <img
          src={`${BASE}${post.imageUrl}`}
          alt={post.title}
          className="post-hero"
        />
      )}

      <div className="post-meta">
        <span className="post-category">{post.category}</span>
        <span>{post.author?.name}</span>
        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
      </div>

      <h1>{post.title}</h1>
      <div className="post-content">{post.content}</div>

      {post.videoLink && (
        <div className="post-video">
          <a href={post.videoLink} target="_blank" rel="noreferrer">
            Watch Video
          </a>
        </div>
      )}

      <hr />
      <h3>Comments ({post.comments?.length || 0})</h3>

      <div className="comment-list">
        {post.comments?.map((comment) => (
          <div key={comment.id} className="comment">
            <div className="comment-header">
              <strong>{comment.author?.name || "User"}</strong>
              <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
            <p>{comment.content}</p>
            {user && comment.authorId === user.id && (
              <div className="comment-actions">
                <button onClick={() => startEditComment(comment)}>Edit</button>
                <button onClick={() => onDeleteComment(comment.id)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {user && (
        <form onSubmit={handleSubmit(onCommentSubmit)} className="comment-form">
          <h4>{editingCommentId ? "Edit Comment" : "Add Comment"}</h4>
          <textarea
            {...register("content", { required: true })}
            placeholder="Write a comment..."
            rows={3}
          />
          <div className="comment-form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {editingCommentId ? "Update" : "Post Comment"}
            </button>
            {editingCommentId && (
              <button
                type="button"
                onClick={() => {
                  setEditingCommentId(null);
                  reset();
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
