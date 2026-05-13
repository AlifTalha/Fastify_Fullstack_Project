import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getCatalog } from "../../api/shop";

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await getCatalog({ page, limit: 12 });
        setProducts(data.products || data.data || []);
        setTotalPages(data.totalPages || 1);
      } catch {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page]);

  if (loading) return <div className="page-loader">Loading products...</div>;

  return (
    <div className="container">
      <h1>Shop</h1>

      <div className="product-grid">
        {products.map((product) => (
          <Link
            to={`/shop/${product.id}`}
            key={product.id}
            className="product-card"
          >
            {product.imageUrl && (
              <img
                src={`${import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:3000"}${product.imageUrl}`}
                alt={product.name}
              />
            )}
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="product-price">
                ${Number(product.price).toFixed(2)}
              </p>
              <p className="product-stock">
                {product.stock > 0
                  ? `${product.stock} in stock`
                  : "Out of stock"}
              </p>
            </div>
          </Link>
        ))}
      </div>

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
