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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        to="/tickets"
        className="group mb-5 inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-500 transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:text-orange-600"
      >
        <svg
          className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
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

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Ticket summary */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:sticky lg:top-24 lg:h-fit">
          <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
          <p className="mt-1 text-xs text-gray-400">
            Opened {new Date(ticket.createdAt).toLocaleDateString()}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-500"}`}
            >
              {ticket.status}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PRIORITY_COLORS[ticket.priority] ?? "bg-gray-100 text-gray-500"}`}
            >
              {ticket.priority}
            </span>
          </div>

          <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-orange-600">
              Description
            </p>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {ticket.description}
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-500">
            <p>Ticket ID: #{String(ticket.id).slice(0, 8)}</p>
            <p className="mt-1">Replies: {ticket.replies?.length ?? 0}</p>
          </div>
        </div>

        {/* Conversation */}
        <div className="flex min-h-130 flex-col rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-base font-semibold text-gray-800">
              Conversation
            </p>
            <p className="text-xs text-gray-400">
              Reply directly to continue the support thread.
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {(!ticket.replies || ticket.replies.length === 0) && (
              <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center">
                <p className="text-sm text-gray-400">
                  No replies yet. Start the conversation below.
                </p>
              </div>
            )}
            {ticket.replies?.map((r, i) => {
              const isAdmin = r.role === "ADMIN";
              return (
                <div
                  key={r.id ?? i}
                  className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-4/5 ${isAdmin ? "items-end" : "items-start"} flex flex-col`}
                  >
                    <p className="mb-1 px-1 text-[11px] font-semibold text-gray-400">
                      {isAdmin
                        ? "Support Team"
                        : (r.userName ?? user?.name ?? "You")}
                    </p>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                        isAdmin
                          ? "rounded-br-sm bg-orange-500 text-white"
                          : "rounded-bl-sm border border-gray-200 bg-gray-50 text-gray-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{r.message}</p>
                      <p
                        className={`mt-1 text-right text-[10px] ${
                          isAdmin ? "text-orange-200" : "text-gray-400"
                        }`}
                      >
                        {new Date(r.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Reply input */}
          {isClosed ? (
            <div className="border-t border-gray-100 px-5 py-4 text-center text-sm text-gray-400">
              This ticket is {ticket.status.toLowerCase()} and no longer accepts
              replies.
            </div>
          ) : (
            <form
              onSubmit={handleReply}
              className="border-t border-gray-100 px-5 py-4"
            >
              <div className="flex items-end gap-3">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
                >
                  <span>{sending ? "Sending" : "Send"}</span>
                  {!sending && (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h14M13 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
