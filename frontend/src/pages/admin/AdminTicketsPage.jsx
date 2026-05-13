import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  getAllTickets,
  getTicketById,
  addReply,
  updateTicketStatus,
  deleteTicket,
} from "../../api/tickets";

const STATUSES = ["OPEN", "IN_PROGRESS", "CLOSED"];

const STATUS_COLORS = {
  OPEN: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

const PRIORITY_COLORS = {
  LOW: "bg-blue-100 text-blue-600",
  MEDIUM: "bg-orange-100 text-orange-600",
  HIGH: "bg-red-100 text-red-600",
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  // Detail panel
  const [selected, setSelected] = useState(null); // full ticket with replies
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [replying, setReplying] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const { data } = await getAllTickets(params);
      setTickets(data.tickets || data.data || []);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const openTicket = async (id) => {
    setDetailLoading(true);
    setSelected(null);
    try {
      const { data } = await getTicketById(id);
      const ticket = data.data;
      setSelected(ticket);
      setReplyStatus(ticket.status);
      setReplyText("");
    } catch {
      toast.error("Failed to load ticket");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateTicketStatus(id, { status });
      toast.success("Status updated");
      setTickets((t) => t.map((tk) => (tk.id === id ? { ...tk, status } : tk)));
      if (selected?.id === id) setSelected((s) => ({ ...s, status }));
    } catch {
      toast.error("Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this ticket?")) return;
    try {
      await deleteTicket(id);
      toast.success("Ticket deleted");
      setTickets((t) => t.filter((tk) => tk.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {
      toast.error("Failed");
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const payload = { message: replyText.trim() };
      if (replyStatus && replyStatus !== selected.status)
        payload.status = replyStatus;
      const { data } = await addReply(selected.id, payload);
      const updated = data.data;
      setSelected(updated);
      setReplyText("");
      setReplyStatus(updated.status);
      toast.success("Reply sent");
      // update status in list too
      setTickets((t) =>
        t.map((tk) =>
          tk.id === updated.id ? { ...tk, status: updated.status } : tk,
        ),
      );
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* ── Left: ticket list ── */}
      <div
        className={`flex flex-col flex-1 min-w-0 p-6 overflow-auto ${selected ? "hidden md:flex" : "flex"}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Tickets</h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">
            Loading…
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-gray-400 text-sm">No tickets found.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => openTicket(ticket.id)}
                className={`bg-white rounded-xl border p-4 cursor-pointer hover:border-orange-300 transition-colors ${selected?.id === ticket.id ? "border-orange-400 shadow-sm" : "border-gray-200"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ticket.user?.name} · #{ticket.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {ticket.status}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[ticket.priority] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <select
                    value={ticket.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStatusChange(ticket.id, e.target.value);
                    }}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(ticket.id);
                    }}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: detail + reply panel ── */}
      {(selected || detailLoading) && (
        <div className="w-full md:w-130 shrink-0 border-l border-gray-200 bg-white flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <button
              onClick={() => setSelected(null)}
              className="md:hidden text-gray-400 hover:text-gray-700"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            {detailLoading ? (
              <span className="text-sm text-gray-400">Loading…</span>
            ) : (
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-800 truncate">
                  {selected?.subject}
                </p>
                <p className="text-xs text-gray-400">
                  {selected?.user?.name} · {selected?.user?.email}
                </p>
              </div>
            )}
          </div>

          {!detailLoading && selected && (
            <>
              {/* Original description */}
              <div className="px-5 py-4 border-b border-gray-100 bg-orange-50">
                <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">
                  Original Message
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selected.description}
                </p>
                <div className="flex gap-2 mt-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selected.status] ?? ""}`}
                  >
                    {selected.status}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[selected.priority] ?? ""}`}
                  >
                    {selected.priority}
                  </span>
                </div>
              </div>

              {/* Replies thread */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {(!selected.replies || selected.replies.length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No replies yet.
                  </p>
                )}
                {selected.replies?.map((r, i) => {
                  const isAdmin = r.role === "ADMIN" || r.isAdmin;
                  return (
                    <div
                      key={r.id ?? i}
                      className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${isAdmin ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-800"}`}
                      >
                        <p
                          className={`text-[10px] font-semibold mb-1 ${isAdmin ? "text-orange-100" : "text-gray-400"}`}
                        >
                          {isAdmin
                            ? "Admin"
                            : (r.user?.name ?? r.userName ?? "User")}
                        </p>
                        <p className="whitespace-pre-wrap">{r.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply form */}
              <form
                onSubmit={handleReply}
                className="border-t border-gray-100 px-5 py-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 shrink-0">
                    Change status:
                  </label>
                  <select
                    value={replyStatus}
                    onChange={(e) => setReplyStatus(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                <button
                  type="submit"
                  disabled={replying || !replyText.trim()}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-xl transition-colors"
                >
                  {replying ? "Sending…" : "Send Reply"}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
