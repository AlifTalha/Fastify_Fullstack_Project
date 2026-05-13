import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getMyTicket, addReply } from "../../api/tickets";
import useAuthStore from "../../store/authStore";

const STATUS_COLORS = {
  OPEN: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  RESOLVED: "bg-blue-100 text-blue-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

const PRIORITY_COLORS = {
  LOW: "bg-blue-100 text-blue-600",
  MEDIUM: "bg-orange-100 text-orange-600",
  HIGH: "bg-red-100 text-red-600",
  URGENT: "bg-purple-100 text-purple-700",
};

export default function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAuthStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMyTicket(id);
        setTicket(data.data);
      } catch {
        toast.error("Ticket not found");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.replies]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const { data } = await addReply(id, { message: replyText.trim() });
      setTicket(data.data);
      setReplyText("");
      toast.success("Reply sent");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    );
  }
  if (!ticket) return null;

  const isClosed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        to="/tickets"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 mb-5 transition-colors"
      >
        <svg
          className="w-4 h-4"
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
        Back to Tickets
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-800">{ticket.subject}</h1>
          <div className="flex gap-2 shrink-0">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-500"}`}
            >
              {ticket.status}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PRIORITY_COLORS[ticket.priority] ?? "bg-gray-100 text-gray-500"}`}
            >
              {ticket.priority}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Opened {new Date(ticket.createdAt).toLocaleDateString()}
        </p>
        <div className="mt-3 p-3 bg-orange-50 rounded-xl">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">
            Description
          </p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>
      </div>

      {/* Reply thread */}
      <div className="bg-white rounded-2xl border border-gray-200 flex flex-col">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">
            Replies{" "}
            <span className="text-gray-400 font-normal">
              ({ticket.replies?.length ?? 0})
            </span>
          </p>
        </div>

        <div className="flex-1 px-5 py-4 space-y-3 min-h-32">
          {(!ticket.replies || ticket.replies.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-6">
              No replies yet. Send a message below.
            </p>
          )}
          {ticket.replies?.map((r, i) => {
            const isAdmin = r.role === "ADMIN";
            return (
              <div
                key={r.id ?? i}
                className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    isAdmin
                      ? "bg-orange-500 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  <p
                    className={`text-[10px] font-semibold mb-1 ${isAdmin ? "text-orange-200" : "text-gray-400"}`}
                  >
                    {isAdmin
                      ? "Support Team"
                      : (r.userName ?? user?.name ?? "You")}
                  </p>
                  <p className="whitespace-pre-wrap">{r.message}</p>
                  <p
                    className={`text-[10px] mt-1 text-right ${isAdmin ? "text-orange-200" : "text-gray-400"}`}
                  >
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply input */}
        {isClosed ? (
          <div className="px-5 py-4 border-t border-gray-100 text-center text-sm text-gray-400">
            This ticket is {ticket.status.toLowerCase()} and no longer accepts
            replies.
          </div>
        ) : (
          <form
            onSubmit={handleReply}
            className="border-t border-gray-100 px-5 py-4 flex gap-3 items-end"
          >
            <textarea
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply…"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              type="submit"
              disabled={sending || !replyText.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors"
            >
              {sending ? "…" : "Send"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
