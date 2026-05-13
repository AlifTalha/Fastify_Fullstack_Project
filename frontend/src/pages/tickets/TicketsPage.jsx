import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getMyTickets, createTicket } from "../../api/tickets";
import { useForm } from "react-hook-form";

const STATUSES = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const PRIORITY_BADGE = {
  LOW: "bg-blue-100 text-blue-600",
  MEDIUM: "bg-orange-100 text-orange-600",
  HIGH: "bg-red-100 text-red-600",
  URGENT: "bg-purple-100 text-purple-700",
};
const STATUS_BADGE = {
  OPEN: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  RESOLVED: "bg-blue-100 text-blue-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeStatus, setActiveStatus] = useState("ALL");
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getMyTickets();
        setTickets(data.tickets || data.data || []);
      } catch {
        toast.error("Failed to load tickets");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const onSubmit = async (data) => {
    try {
      const { data: res } = await createTicket(data);
      setTickets((t) => [res.data || res, ...t]);
      toast.success("Ticket created");
      reset();
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const filteredTickets =
    activeStatus === "ALL"
      ? tickets
      : tickets.filter((ticket) => ticket.status === activeStatus);

  const statusCount = (status) => {
    if (status === "ALL") return tickets.length;
    return tickets.filter((ticket) => ticket.status === status).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-4 sm:py-8">
      <div className="rounded-2xl border border-gray-200 bg-linear-to-br from-white to-orange-50/30 p-4 sm:rounded-3xl sm:p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Support Tickets
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your issues, view responses, and chat with support.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-center text-sm text-gray-600 shadow-xs sm:rounded-2xl sm:text-left">
              Total:{" "}
              <span className="font-semibold text-gray-800">
                {tickets.length}
              </span>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 sm:w-auto"
            >
              <span>+</span>
              <span>New Ticket</span>
            </button>
          </div>
        </div>

        <div className="mt-5 -mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex min-w-max gap-2">
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setActiveStatus(status)}
                className={`whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeStatus === status
                    ? "border-orange-200 bg-orange-100 text-orange-700"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {status.replace("_", " ")} ({statusCount(status)})
              </button>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/35 px-3 py-3 sm:items-center sm:px-4">
          <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-xl sm:rounded-3xl sm:p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                  Create New Ticket
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Describe your issue clearly so support can help faster.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <input
                  {...register("subject", { required: true })}
                  placeholder="Brief subject of your issue"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  {...register("description", { required: true })}
                  rows={5}
                  placeholder="Describe your issue in detail..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition resize-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  {...register("priority")}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60 sm:w-auto"
                >
                  {isSubmitting ? "Submitting..." : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-6">
        {filteredTickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center sm:rounded-3xl sm:p-14">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-700">
              No tickets found
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {activeStatus === "ALL"
                ? "You have not created any support ticket yet."
                : `No tickets with status ${activeStatus.replace("_", " ")}.`}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 w-full rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 sm:w-auto"
            >
              Create your first ticket
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredTickets.map((ticket) => (
              <Link
                to={`/tickets/${ticket.id}`}
                key={ticket.id}
                className="group block rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-orange-300 hover:shadow-md sm:rounded-2xl sm:p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-gray-800 group-hover:text-orange-600">
                      {ticket.subject}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {ticket.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[ticket.status] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {ticket.status}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PRIORITY_BADGE[ticket.priority] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-400">
                    #{String(ticket.id).slice(0, 8)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {ticket.replies?.length ?? 0}{" "}
                    {(ticket.replies?.length ?? 0) === 1 ? "reply" : "replies"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
