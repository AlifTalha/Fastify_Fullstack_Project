import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getMyTickets, createTicket } from "../../api/tickets";
import { useForm } from "react-hook-form";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Support Tickets</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          {showForm ? "Cancel" : "+ New Ticket"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 space-y-4"
        >
          <h2 className="font-semibold text-gray-800">New Ticket</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              {...register("subject", { required: true })}
              placeholder="Brief subject of your issue"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register("description", { required: true })}
              rows={4}
              placeholder="Describe your issue in detail…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              {...register("priority")}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            {isSubmitting ? "Submitting…" : "Create Ticket"}
          </button>
        </form>
      )}

      {tickets.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium mb-1">No tickets yet</p>
          <p className="text-sm">Click "+ New Ticket" to get support</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              to={`/tickets/${ticket.id}`}
              key={ticket.id}
              className="block bg-white rounded-2xl border border-gray-200 p-4 hover:border-orange-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-800 truncate">
                  {ticket.subject}
                </p>
                <div className="flex gap-2 shrink-0">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[ticket.status] ?? "bg-gray-100 text-gray-500"}`}
                  >
                    {ticket.status}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[ticket.priority] ?? "bg-gray-100 text-gray-500"}`}
                  >
                    {ticket.priority}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
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
  );
}
