import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getMyOrders } from "../../api/shop";

const STATUS_COLORS = {
  PENDING: "#f59e0b",
  PAID: "#10b981",
  SHIPPED: "#3b82f6",
  DELIVERED: "#6366f1",
  CANCELLED: "#ef4444",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getMyOrders();
        setOrders(data.orders || data.data || []);
      } catch {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="page-loader">Loading orders...</div>;

  return (
    <div className="container">
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <p>
          No orders yet. <Link to="/shop">Go shopping!</Link>
        </p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <Link
              to={`/orders/${order.id}`}
              key={order.id}
              className="order-card"
            >
              <div className="order-card-header">
                <span>Order #{order.id.slice(0, 8)}</span>
                <span
                  className="order-status"
                  style={{ color: STATUS_COLORS[order.status] }}
                >
                  {order.status}
                </span>
              </div>
              <div className="order-card-body">
                <span>{order.items?.length || 0} item(s)</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
