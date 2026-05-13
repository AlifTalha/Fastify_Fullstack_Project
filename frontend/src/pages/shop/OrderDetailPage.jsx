import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  getMyOrderById,
  createCheckoutSession,
  downloadInvoice,
  cancelMyOrder,
} from "../../api/shop";

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await getMyOrderById(id);
        setOrder(data.order || data);
      } catch {
        toast.error("Order not found");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleCheckout = async () => {
    try {
      setActionLoading(true);
      const { data } = await createCheckoutSession(id);
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || "Checkout failed");
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      setActionLoading(true);
      await cancelMyOrder(id);
      toast.success("Order cancelled");
      setOrder((o) => ({ ...o, status: "CANCELLED" }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancel failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download invoice");
    }
  };

  if (loading) return <div className="page-loader">Loading...</div>;
  if (!order) return null;

  return (
    <div className="container">
      <h1>Order #{order.id.slice(0, 8)}</h1>
      <p className="order-status">
        Status: <strong>{order.status}</strong>
      </p>

      <div className="order-items">
        <h3>Items</h3>
        {order.items?.map((item) => (
          <div key={item.id} className="order-item">
            <span>{item.product?.name || "Product"}</span>
            <span>x{item.quantity}</span>
            <span>${Number(item.price).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="order-total">
        <strong>Total: ${Number(order.total).toFixed(2)}</strong>
      </div>

      <div className="order-actions">
        {order.status === "PENDING" && (
          <>
            <button
              className="btn-primary"
              onClick={handleCheckout}
              disabled={actionLoading}
            >
              {actionLoading ? "Redirecting..." : "Pay Now"}
            </button>
            <button
              className="btn-danger"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              Cancel Order
            </button>
          </>
        )}
        {(order.status === "PAID" || order.status === "DELIVERED") && (
          <button className="btn-secondary" onClick={handleDownloadInvoice}>
            Download Invoice
          </button>
        )}
      </div>
    </div>
  );
}
