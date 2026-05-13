import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { getAllOrders } from "../../api/shop";

const STATUS_COLORS = {
  PENDING: "#f59e0b",
  PAID: "#10b981",
  SHIPPED: "#3b82f6",
  DELIVERED: "#6366f1",
  CANCELLED: "#ef4444",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const { data } = await getAllOrders({ page, limit: 20 });
        setOrders(data.orders || data.data || []);
        setTotalPages(data.totalPages || 1);
      } catch {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page]);

  return (
    <div className="container">
      <h1>All Orders</h1>

      {loading ? (
        <div className="page-loader">Loading...</div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id.slice(0, 8)}</td>
                  <td>{o.user?.name || o.user?.email || "—"}</td>
                  <td>${Number(o.total).toFixed(2)}</td>
                  <td>
                    <span style={{ color: STATUS_COLORS[o.status] }}>
                      {o.status}
                    </span>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
