import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { register as registerApi } from "../../api/auth";

const REGISTER_IMAGE =
  "https://as2.ftcdn.net/v2/jpg/04/61/23/39/1000_F_461233963_Oy0VVirW39t2TTTWNNg5e8QWd2sZ8L2S.jpg";

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await registerApi({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      toast.success("Account created! Please login.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-white-700 md:grid md:grid-cols-2">
      <div className="relative hidden md:block">
        <img
          src={REGISTER_IMAGE}
          alt="Property"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-10 text-white">
          <h2 className="text-5xl font-bold tracking-tight">
            Start Your Journey
          </h2>
          <p className="mt-2 text-lg text-white/90">
            Create an account to save listings and connect with our agents.
          </p>
        </div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-6 py-10 md:px-10">
        <Link
          to="/"
          className="absolute right-6 top-6 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50"
        >
          ← Back to Home
        </Link>

        <div className="w-full max-w-110">
          <h1 className="text-4xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Join now to browse premium properties, track your orders, and chat
            with support.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                {...register("name", { required: "Name is required" })}
                placeholder="John Doe"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
              />
              {errors.name && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.name.message}
                </span>
              )}
            </div>

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
              <input
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Minimum 6 characters" },
                })}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
              />
              {errors.password && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.password.message}
                </span>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                {...register("confirmPassword", {
                  required: "Please confirm password",
                  validate: (val) =>
                    val === watch("password") || "Passwords do not match",
                })}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
              />
              {errors.confirmPassword && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Register"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-orange-600 hover:text-orange-700"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
