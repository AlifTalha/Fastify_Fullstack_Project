import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  adminGetPosts,
  approvePost,
  rejectPost,
  adminDeletePost,
} from "../../api/blog";

const STATUS_TABS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = status !== "ALL" ? { status } : {};
      const { data } = await adminGetPosts(params);
      setPosts(data.posts || data.data || []);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [status]);

  const handleApprove = async (id) => {
    try {
      await approvePost(id);
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
    try {
      await rejectPost(id);
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
    if (!window.confirm("Delete this post?")) return;
    try {
      await adminDeletePost(id);
      toast.success("Post deleted");
      setPosts((p) => p.filter((post) => post.id !== id));
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="container">
      <h1>Blog Moderation</h1>

      <div className="tabs">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            className={`tab ${status === s ? "active" : ""}`}
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loader">Loading...</div>
      ) : (
        <div className="admin-list">
          {posts.length === 0 && <p>No posts found.</p>}
          {posts.map((post) => (
            <div key={post.id} className="admin-list-item">
              <div>
                <strong>{post.title}</strong>
                <span className="text-muted"> by {post.author?.name}</span>
                <span className={`badge badge-${post.status?.toLowerCase()}`}>
                  {post.status}
                </span>
              </div>
              <div className="admin-actions">
                {post.status === "PENDING" && (
                  <>
                    <button
                      className="btn-success"
                      onClick={() => handleApprove(post.id)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-warning"
                      onClick={() => handleReject(post.id)}
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(post.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
