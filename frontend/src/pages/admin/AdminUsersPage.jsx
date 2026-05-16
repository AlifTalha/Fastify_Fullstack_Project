import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { getUsers, getUserById, updateUser, deleteUser } from "../../api/auth";

const ROLE_BADGE = {
  ADMIN: "border border-orange-200 bg-orange-50 text-orange-700",
  USER: "border border-sky-200 bg-sky-50 text-sky-700",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "USER",
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getUsers({ page, limit });
      const payload = data?.data || data || {};
      const list = payload.users || [];
      const totalCount = Number(payload.total || 0);
      const perPage = Number(payload.limit || limit);

      setUsers(list);
      setTotal(totalCount);
      setTotalPages(Math.max(1, Math.ceil(totalCount / perPage)));
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const startingIndex = useMemo(() => (page - 1) * limit, [page, limit]);

  const handleView = async (id) => {
    try {
      const { data } = await getUserById(id);
      const user = data?.data || data;
      setViewUser(user);
    } catch {
      toast.error("Failed to load user details");
    }
  };

  const handleOpenEdit = async (id) => {
    try {
      const { data } = await getUserById(id);
      const user = data?.data || data;
      setEditUser(user);
      setEditForm({
        name: user?.name || "",
        email: user?.email || "",
        role: user?.role || "USER",
      });
    } catch {
      toast.error("Failed to load user details");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editUser) return;

    const payload = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      role: editForm.role,
    };

    try {
      setSaving(true);
      const { data } = await updateUser(editUser.id, payload);
      const updated = data?.data || data;

      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setViewUser((prev) => (prev?.id === updated.id ? updated : prev));
      setEditUser(null);
      toast.success("User updated");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete this user?",
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
      await deleteUser(id);
      toast.success("User deleted");
      setUsers((prev) => prev.filter((user) => user.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));

      if (users.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      }
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      {/* Page header */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-linear-to-r from-white via-orange-50/40 to-indigo-50/40 p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
              Admin
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Users
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage user accounts, roles, and access from one place.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-xs">
            Total: <span className="font-semibold text-gray-900">{total}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* ── Mobile cards (< md) ── */}
          <div className="flex flex-col gap-3 md:hidden">
            {users.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-400">
                No users found.
              </div>
            ) : (
              users.map((u, index) => (
                <div
                  key={u.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                      {u.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900">
                        {u.name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {u.email}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE[u.role] || "border border-gray-200 bg-gray-50 text-gray-600"}`}
                    >
                      {u.role}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-400">
                      #{startingIndex + index + 1} · Joined{" "}
                      {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => handleView(u.id)}
                        className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleOpenEdit(u.id)}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Desktop table (md+) ── */}
          <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/80 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-gray-400"
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u, index) => (
                      <tr
                        key={u.id}
                        className="transition-colors hover:bg-orange-50/40"
                      >
                        <td className="px-4 py-3 text-gray-500">
                          {startingIndex + index + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {u.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE[u.role] || "border border-gray-200 bg-gray-50 text-gray-600"}`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(u.id)}
                              className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleOpenEdit(u.id)}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm font-medium text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-linear-to-r from-indigo-50 via-white to-orange-50 px-5 py-4">
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => setViewUser(null)}
                className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-white"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 p-5 text-sm">
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {viewUser.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-gray-900">
                    {viewUser.name}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {viewUser.email}
                  </p>
                </div>
                <span
                  className={`ml-auto inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE[viewUser.role] || "border border-gray-200 bg-gray-50 text-gray-600"}`}
                >
                  {viewUser.role}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Name
                  </p>
                  <p className="mt-1 font-medium text-gray-800">
                    {viewUser.name}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Role
                  </p>
                  <p className="mt-1 font-medium text-gray-800">
                    {viewUser.role}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-3 sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Email
                  </p>
                  <p className="mt-1 break-all font-medium text-gray-800">
                    {viewUser.email}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Joined
                  </p>
                  <p className="mt-1 font-medium text-gray-800">
                    {new Date(viewUser.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Updated
                  </p>
                  <p className="mt-1 font-medium text-gray-800">
                    {viewUser.updatedAt
                      ? new Date(viewUser.updatedAt).toLocaleString()
                      : "Not updated"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Update User</h2>
              <button
                onClick={() => setEditUser(null)}
                className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
