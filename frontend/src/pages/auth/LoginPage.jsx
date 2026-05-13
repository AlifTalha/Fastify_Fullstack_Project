import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import useAuthStore from "../../store/authStore";

const LOGIN_IMAGE =
  "https://thumbs.dreamstime.com/b/security-concept-login-digital-background-pixelated-words-d-render-30468616.jpg";

const DEMO = {
  user: { email: "user@example.com", password: "password123" },
  admin: { email: "admin@example.com", password: "admin123" },
};

export default function LoginPage() {
  const [role, setRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: DEMO.user,
  });

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const switchRole = (r) => {
    setRole(r);
    setLoginError("");
    setValue("email", DEMO[r].email);
    setValue("password", DEMO[r].password);
  };

  const onSubmit = async (data) => {
    setLoginError("");
    try {
      const result = await login(data);
      const returnedRole = result?.user?.role?.toLowerCase();
      if (role === "admin" && returnedRole !== "admin") {
        await useAuthStore.getState().logout();
        setLoginError(
          "Access denied. This account does not have admin privileges.",
        );
        return;
      }
      if (role === "user" && returnedRole === "admin") {
        await useAuthStore.getState().logout();
        setLoginError(
          "Please select the Admin tab to log in with an admin account.",
        );
        return;
      }
      toast.success("Welcome back!");
      navigate(returnedRole === "admin" ? "/admin" : "/");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid credentials. Please check your email and password.";
      setLoginError(msg);
    }
  };

  return (
    <div className="min-h-dvh bg-gray-50 md:min-h-screen md:grid md:grid-cols-2">
      {/* Left: image panel (50% width from left to middle) */}
      <div className="relative hidden md:block">
        <img
          src={LOGIN_IMAGE}
          alt="Property"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-8 text-white lg:p-10">
          <h2 className="text-3xl font-bold tracking-tight lg:text-5xl">
            Find Your Dream Home
          </h2>
          <p className="mt-2 text-sm text-white/90 lg:text-base">
            Browse premium listings, save favourites, and connect with our
            agents.
          </p>
        </div>
      </div>

      {/* Right: login section */}
      <div className="relative flex min-h-dvh items-start justify-center px-4 pb-8 pt-20 sm:px-6 md:min-h-screen md:items-center md:px-10 md:py-10">
        <Link
          to="/"
          className="group absolute right-4 top-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:shadow-md sm:right-6 sm:top-6 sm:px-4 sm:py-2 sm:text-sm"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-0.5">
            ←
          </span>
          <span>Back to Home</span>
        </Link>

        <div className="w-full max-w-105">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Login to Continue
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Sign in to browse premium property listings, save your favourites,
            and connect with our agents.
          </p>

          {/* Role toggle */}
          <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-xl border border-gray-200">
            <button
              type="button"
              className={`flex items-center justify-center gap-1 border-r border-gray-200 px-3 py-2.5 text-xs font-medium transition-colors sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${
                role === "user"
                  ? "bg-orange-50 text-orange-600"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
              onClick={() => switchRole("user")}
            >
              <span>👤</span> User
            </button>
            <button
              type="button"
              className={`flex items-center justify-center gap-1 px-3 py-2.5 text-xs font-medium transition-colors sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${
                role === "admin"
                  ? "bg-orange-50 text-orange-600"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
              onClick={() => switchRole("admin")}
            >
              <span>🛡</span> Admin
            </button>
          </div>

          {/* Demo hint */}
          {/* <div className="mt-4 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs leading-5 text-orange-800">
            <span className="font-semibold">→</span>
            <span>
              Demo credentials auto-filled. Click <strong>Sign In</strong> to
              continue, or type your own.
            </span>
          </div> */}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            {loginError && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {loginError}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                {...register("email", { required: "Email is required" })}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
              />
              {errors.email && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                  })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label="Toggle password"
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              {errors.password && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.password.message}
                </span>
              )}
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Don&apos;t Have an account{" "}
            <Link
              to="/register"
              className="font-semibold text-orange-600 hover:text-orange-700"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
