import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getPublicPosts } from "../../api/blog";

const CATEGORIES = ["All", "Tech", "Lifestyle", "News", "Tutorial"];

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const params = { page, limit: 10 };
        if (category) params.category = category;
        const { data } = await getPublicPosts(params);
        setPosts(data.posts || data.data || []);
        setTotalPages(data.totalPages || 1);
      } catch {
        toast.error("Failed to load posts");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [page, category]);

  return (
    <div className="container">
      <div className="blog-header">
        <h1>Blog</h1>
        <Link to="/blog/new" className="btn-primary">
          Write Post
        </Link>
      </div>

      <div className="category-filter">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${category === (cat === "All" ? "" : cat) ? "active" : ""}`}
            onClick={() => {
              setCategory(cat === "All" ? "" : cat);
              setPage(1);
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loader">Loading posts...</div>
      ) : (
        <div className="post-list">
          {posts.length === 0 && <p>No posts found.</p>}
          {posts.map((post) => (
            <Link to={`/blog/${post.slug}`} key={post.id} className="post-card">
              {post.imageUrl && (
                <img
                  src={`${import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:3000"}${post.imageUrl}`}
                  alt={post.title}
                  className="post-thumbnail"
                />
              )}
              <div className="post-card-body">
                <span className="post-category">{post.category}</span>
                <h2>{post.title}</h2>
                <p>{post.content?.slice(0, 150)}...</p>
                <div className="post-meta">
                  <span>{post.author?.name || "Unknown"}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
