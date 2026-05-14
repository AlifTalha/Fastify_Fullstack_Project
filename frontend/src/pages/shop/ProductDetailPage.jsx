import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getCatalogItem, createOrder } from "../../api/shop";
import useAuthStore from "../../store/authStore";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await getCatalogItem(id);
        setProduct(data.product || data);
      } catch {
        toast.error("Product not found");
        navigate("/shop");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleOrder = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      setOrdering(true);
      const { data } = await createOrder({
        items: [{ productId: product.id, quantity }],
      });
      const orderId = data.order?.id || data.id;
      toast.success("Order created!");
      navigate(`/orders/${orderId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Order failed");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <div className="page-loader">Loading...</div>;
  if (!product) return null;

  const BASE =
    import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
    "http://localhost:3000";
  const productImageSrc = product.imageUrl
    ? /^https?:\/\//i.test(product.imageUrl)
      ? product.imageUrl
      : `${BASE}${product.imageUrl}`
    : "";

  return (
    <div className="container product-detail">
      {product.imageUrl && <img src={productImageSrc} alt={product.name} />}

      <div className="product-detail-info">
        <h1>{product.name}</h1>
        <p className="product-price">${Number(product.price).toFixed(2)}</p>
        <p>{product.description}</p>
        <p className="product-stock">
          {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
        </p>

        {product.stock > 0 && (
          <div className="order-controls">
            <div className="quantity-control">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                −
              </button>
              <span>{quantity}</span>
              <button
                onClick={() =>
                  setQuantity((q) => Math.min(product.stock, q + 1))
                }
              >
                +
              </button>
            </div>
            <button
              className="btn-primary"
              onClick={handleOrder}
              disabled={ordering}
            >
              {ordering ? "Placing order..." : "Buy Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
