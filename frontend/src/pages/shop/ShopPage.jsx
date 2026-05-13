import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getCatalog } from "../../api/shop";

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [imageErrorIds, setImageErrorIds] = useState({});

  const getProductImage = (imageUrl) => {
    if (!imageUrl) return "";
    const baseUrl =
      import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
      "http://localhost:3000";
    return `${baseUrl}${imageUrl}`;
  };

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
      <h1 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
        Shop
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <Link
            to={`/shop/${product.id}`}
            key={product.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-900 no-underline shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="aspect-4/3 w-full bg-gray-100">
              {product.imageUrl && !imageErrorIds[product.id] ? (
                <img
                  src={getProductImage(product.imageUrl)}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={() => {
                    setImageErrorIds((prev) => ({
                      ...prev,
                      [product.id]: true,
                    }));
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-3 text-center text-sm font-medium text-gray-400">
                  No image available
                </div>
              )}
            </div>

            <div className="space-y-1 p-3 sm:p-4">
              <h3 className="line-clamp-1 text-lg font-semibold text-gray-900">
                {product.name}
              </h3>
              <p className="text-xl font-bold text-indigo-500">
                ${Number(product.price).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">
                {product.stock > 0
                  ? `${product.stock} in stock`
                  : "Out of stock"}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm font-medium text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
