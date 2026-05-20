import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import useAuthStore from "../store/authStore";
import { updateProfile, changePassword } from "../api/auth";

const isValidHttpUrl = (value) => /^https?:\/\//i.test(String(value || ""));

export default function ProfilePage() {
  const { user, fetchMe, isLoading } = useAuthStore();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) fetchMe();
  }, [fetchMe, user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      profileImageUrl: String(formData.get("profileImageUrl") || "").trim(),
    };
    try {
      setSavingProfile(true);
      await updateProfile(payload);
      await fetchMe();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      setChangingPassword(true);
      await changePassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      toast.success("Password changed successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-75 items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 text-slate-600">
        Unable to load profile.
      </div>
    );
  }

  const roleBadgeClass =
    user.role?.toLowerCase() === "admin"
      ? "border border-orange-300 bg-orange-50 text-orange-700"
      : "border border-amber-300 bg-amber-50 text-amber-700";

  const profileImageSrc = isValidHttpUrl(user.profileImageUrl)
    ? user.profileImageUrl
    : "";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-slate-900">
        My Profile
      </h1>

      <section className="mb-5 grid grid-cols-1 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[auto_1fr_auto] sm:p-5">
        <div className="grid h-18 w-18 place-items-center rounded-2xl border border-orange-200 bg-linear-to-br from-orange-50 to-amber-50">
          {profileImageSrc ? (
            <img
              src={profileImageSrc}
              alt={user.name || "Profile"}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-orange-400 to-orange-500 text-2xl font-bold text-white">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h2 className="mb-1 text-2xl font-bold text-slate-900">
            {user.name}
          </h2>
          <p className="mb-2 truncate text-slate-500">{user.email}</p>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${roleBadgeClass}`}
          >
            {user.role}
          </span>
        </div>

        <div className="justify-self-start sm:justify-self-end">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${roleBadgeClass}`}
          >
            {user.role}
          </span>
        </div>
      </section>

      <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-linear-to-b from-orange-50/40 to-amber-50/40 px-5 py-4">
          <h3 className="mb-1 text-lg font-semibold text-slate-900">
            Account Settings
          </h3>
          <p className="text-sm text-slate-500">
            Update your personal information
          </p>
        </div>

        <form
          onSubmit={handleProfileSubmit}
          className="px-5 py-5"
          key={`${user.id}-${user.updatedAt || ""}`}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="profile-name"
                className="text-xs font-bold uppercase tracking-[0.08em] text-amber-700"
              >
                Name
              </label>
              <input
                id="profile-name"
                name="name"
                type="text"
                placeholder="Name"
                defaultValue={user.name || ""}
                className="w-full rounded-xl border border-orange-200 bg-orange-50/40 px-3 py-2.5 text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-200/60"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="profile-email"
                className="text-xs font-bold uppercase tracking-[0.08em] text-amber-700"
              >
                Email
              </label>
              <input
                id="profile-email"
                name="email"
                type="email"
                placeholder="Email"
                defaultValue={user.email || ""}
                disabled
                className="w-full rounded-xl border border-orange-200 bg-orange-50/40 px-3 py-2.5 text-slate-500 outline-none cursor-not-allowed opacity-60"
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label
                htmlFor="profile-image-url"
                className="text-xs font-bold uppercase tracking-[0.08em] text-amber-700"
              >
                Profile Image URL
              </label>
              <input
                id="profile-image-url"
                name="profileImageUrl"
                type="url"
                placeholder="https://example.com/my-photo.jpg"
                defaultValue={user.profileImageUrl || ""}
                className="w-full rounded-xl border border-orange-200 bg-orange-50/40 px-3 py-2.5 text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-200/60"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-orange-500 px-5 py-2.5 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={savingProfile}
            >
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>

      <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-linear-to-b from-orange-50/40 to-amber-50/40 px-5 py-4">
          <h3 className="mb-1 text-lg font-semibold text-slate-900">
            Change Password
          </h3>
          <p className="text-sm text-slate-500">
            Use a strong password to keep your account secure
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="px-5 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label
                htmlFor="current-password"
                className="text-xs font-bold uppercase tracking-[0.08em] text-amber-700"
              >
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                placeholder="Current Password"
                value={passwordForm.currentPassword}
                className="w-full rounded-xl border border-orange-200 bg-orange-50/40 px-3 py-2.5 text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-200/60"
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="new-password"
                className="text-xs font-bold uppercase tracking-[0.08em] text-amber-700"
              >
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                placeholder="New Password"
                value={passwordForm.newPassword}
                className="w-full rounded-xl border border-orange-200 bg-orange-50/40 px-3 py-2.5 text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-200/60"
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-orange-500 px-5 py-2.5 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={changingPassword}
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
