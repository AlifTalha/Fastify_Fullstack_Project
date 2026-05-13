import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import {
  getAllTickets,
  getTicketById,
  addReply,
  deleteTicket,
} from "../../api/tickets";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const STATUS_TABS = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const STATUS_COLORS = {
  OPEN: "bg-blue-50 text-blue-700 border border-blue-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border border-amber-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CLOSED: "bg-gray-100 text-gray-600 border border-gray-200",
};

const PRIORITY_COLORS = {
  LOW: "bg-sky-50 text-sky-700 border border-sky-200",
  MEDIUM: "bg-orange-50 text-orange-700 border border-orange-200",
  HIGH: "bg-rose-50 text-rose-700 border border-rose-200",
  URGENT: "bg-red-50 text-red-700 border border-red-200",
};

const TABLE_HEADERS = [
  "TICKET ID",
  "SUBJECT",
  "STATUS",
  "PRIORITY",
  "REQUESTER",
  "CREATED",
  "DELETE",
];

const normalizeCount = (value) => Math.max(0, Number(value || 0));

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    ALL: 0,
    OPEN: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    CLOSED: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [tab, setTab] = useState("ALL");
  const [nowTs, setNowTs] = useState(0);

  // Detail panel
  const [selected, setSelected] = useState(null); // full ticket with replies
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [replying, setReplying] = useState(false);

  const applyStatusChangeToCounts = (currentCounts, fromStatus, toStatus) => {
    if (!fromStatus || !toStatus || fromStatus === toStatus)
      return currentCounts;
    return {
      ...currentCounts,
      [fromStatus]: normalizeCount(currentCounts[fromStatus]) - 1,
      [toStatus]: normalizeCount(currentCounts[toStatus]) + 1,
    };
  };

  const applyDeleteToCounts = (currentCounts, status) => {
    if (!status) return currentCounts;
    return {
      ...currentCounts,
      ALL: normalizeCount(currentCounts.ALL) - 1,
      [status]: normalizeCount(currentCounts[status]) - 1,
    };
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const params = statusFilter ? { status: statusFilter } : {};
        const { data } = await getAllTickets(params);
        if (active) {
          setTickets(data.tickets || data.data || []);
          setStatusCounts(
            data.statusCounts || {
              ALL: (data.tickets || data.data || []).length,
              OPEN: 0,
              IN_PROGRESS: 0,
              RESOLVED: 0,
              CLOSED: 0,
            },
          );
          setNowTs(Date.now());
        }
      } catch {
        toast.error("Failed to load tickets");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [statusFilter]);

  const filteredTickets = useMemo(() => {
    if (tab === "ALL") return tickets;
    return tickets.filter((t) => t.status === tab);
  }, [tickets, tab]);

  const statusSummary = useMemo(
    () => [
      {
        key: "ALL",
        label: "All Tickets",
        value: statusCounts.ALL ?? 0,
        card: "border-indigo-200",
      },
      {
        key: "OPEN",
        label: "Open",
        value: statusCounts.OPEN ?? 0,
        card: "border-blue-200",
      },
      {
        key: "IN_PROGRESS",
        label: "In Progress",
        value: statusCounts.IN_PROGRESS ?? 0,
        card: "border-amber-200",
      },
      {
        key: "RESOLVED",
        label: "Resolved",
        value: statusCounts.RESOLVED ?? 0,
        card: "border-emerald-200",
      },
      {
        key: "CLOSED",
        label: "Closed",
        value: statusCounts.CLOSED ?? 0,
        card: "border-gray-200",
      },
    ],
    [statusCounts],
  );

  const formatAgo = (dateString) => {
    if (!dateString) return "-";
    const diff = nowTs - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const tabCount = (value) => {
    return statusCounts[value] ?? 0;
  };

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

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete this ticket?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "No",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      const ticketToDelete = tickets.find((tk) => tk.id === id);
      await deleteTicket(id);
      toast.success("Ticket deleted");
      setTickets((t) => t.filter((tk) => tk.id !== id));
      if (ticketToDelete?.status) {
        setStatusCounts((prev) =>
          applyDeleteToCounts(prev, ticketToDelete.status),
        );
      }
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
      const previousStatus = selected.status;
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
      setStatusCounts((prev) =>
        applyStatusChangeToCounts(prev, previousStatus, updated.status),
      );
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="flex h-full bg-gray-50 text-gray-900">
      <div
        className={`flex min-w-0 flex-1 flex-col overflow-auto p-6 ${selected ? "hidden xl:flex" : "flex"}`}
      >
        <div className="mx-auto w-full max-w-7xl space-y-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {statusSummary.map((item) => (
              <div
                key={item.key}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${item.card}`}
              >
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {item.label}
                </p>
                <p className="mt-2 text-4xl font-bold text-gray-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_TABS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setTab(value);
                    setStatusFilter(value === "ALL" ? "" : value);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    tab === value
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {value.replace("_", " ")} ({tabCount(value)})
                </button>
              ))}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setTab(e.target.value || "ALL");
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="grid grid-cols-[120px_2fr_120px_120px_1.2fr_120px_80px] gap-3 border-b border-gray-100 px-4 py-3 text-[11px] font-semibold tracking-wide text-gray-500">
              {TABLE_HEADERS.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>

            {loading ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                Loading tickets...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                No tickets found.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => openTicket(ticket.id)}
                    className="grid cursor-pointer grid-cols-[120px_2fr_120px_120px_1.2fr_120px_80px] gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50"
                  >
                    <span className="font-semibold text-indigo-600">
                      #{ticket.id.slice(0, 8)}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {ticket.subject}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {ticket.user?.name || "Unknown user"} ·{" "}
                        {ticket.user?.email || "no-email"}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_COLORS[ticket.priority] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}
                      >
                        {ticket.priority}
                      </span>
                    </div>

                    <span className="truncate text-gray-700">
                      {ticket.user?.name || "-"}
                    </span>
                    <span className="text-gray-500">
                      {formatAgo(ticket.createdAt)}
                    </span>

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center"
                    >
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        className="inline-flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {(selected || detailLoading) && (
        <div className="flex h-full w-full shrink-0 flex-col border-l border-gray-200 bg-white xl:w-130">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <button
              onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-gray-700 xl:hidden"
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
              <span className="text-sm text-gray-400">Loading...</span>
            ) : (
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900">
                  {selected?.subject}
                </p>
                <p className="text-xs text-gray-500">
                  {selected?.user?.name} · {selected?.user?.email}
                </p>
              </div>
            )}
            <button
              onClick={() => setSelected(null)}
              className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
            >
              Back to List
            </button>
          </div>

          {!detailLoading && selected && (
            <>
              <div className="border-b border-gray-100 bg-orange-50 px-5 py-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
                  Original Message
                </p>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {selected.description}
                </p>
                <div className="mt-2 flex gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[selected.status] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}
                  >
                    {selected.status}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[selected.priority] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}
                  >
                    {selected.priority}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {(!selected.replies || selected.replies.length === 0) && (
                  <p className="py-6 text-center text-sm text-gray-400">
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
                        className={`max-w-4/5 rounded-xl px-4 py-2.5 text-sm ${isAdmin ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-800"}`}
                      >
                        <p
                          className={`mb-1 text-[10px] font-semibold ${isAdmin ? "text-orange-100" : "text-gray-400"}`}
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

              <form
                onSubmit={handleReply}
                className="space-y-3 border-t border-gray-100 px-5 py-4"
              >
                <div className="flex items-center gap-2">
                  <label className="shrink-0 text-xs text-gray-500">
                    Change status:
                  </label>
                  <select
                    value={replyStatus}
                    onChange={(e) => setReplyStatus(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none"
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
                  placeholder="Type your reply..."
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none"
                />
                <button
                  type="submit"
                  disabled={replying || !replyText.trim()}
                  className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
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
