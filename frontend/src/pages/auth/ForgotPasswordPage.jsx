import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, verifyOtp, resetPassword } from "../../api/auth";

const FORGOT_IMAGE =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&auto=format&fit=crop&q=80";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: reset
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [resendIn, setResendIn] = useState(8);
  const otpRefs = useRef([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const navigate = useNavigate();

  const onEmailSubmit = async ({ email: e }) => {
    try {
      await forgotPassword({ email: e });
      setEmail(e);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpError("");
      setResendIn(60);
      toast.success("OTP sent to your email");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const onOtpSubmit = async () => {
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }
    try {
      setOtpError("");
      const { data } = await verifyOtp({ email, otp });
      setResetToken(data.data?.resetToken || "");
      toast.success("OTP verified");
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    }
  };

  useEffect(() => {
    if (step !== 2 || resendIn <= 0) return;
    const timer = setInterval(() => {
      setResendIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendIn]);

  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 50);
    }
  }, [step]);

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtpError("");
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setOtpError("");
    setOtpDigits(next);
    const focusIndex = Math.min(pasted.length, 6) - 1;
    otpRefs.current[Math.max(focusIndex, 0)]?.focus();
  };

  const handleResendOtp = async () => {
    try {
      await forgotPassword({ email });
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpError("");
      setResendIn(60);
      toast.success("OTP sent again");
      otpRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  const onResetSubmit = async ({ newPassword }) => {
    try {
      await resetPassword(newPassword, resetToken);
      toast.success("Password reset successful");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    }
  };

  const title =
    step === 1
      ? "Forgot Password"
      : step === 2
        ? "Verify OTP"
        : "Set New Password";

  const subtitle =
    step === 1
      ? "Enter your email address linked to your account."
      : step === 2
        ? `Enter the OTP sent to ${email}`
        : "Create a strong password to secure your account.";

  return (
    <div className="min-h-dvh bg-gray-50 md:min-h-screen md:grid md:grid-cols-2">
      <div className="relative h-56 overflow-hidden sm:h-64 md:hidden">
        <img
          src={FORGOT_IMAGE}
          alt="Modern house"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-4 text-white">
          <h2 className="text-2xl font-bold tracking-tight">
            Recover Access Fast
          </h2>
          <p className="mt-1 text-sm text-white/90">
            Verify your account and set a new password in minutes.
          </p>
        </div>
      </div>

      <div className="relative hidden md:block">
        <img
          src={FORGOT_IMAGE}
          alt="Modern house"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/65 to-transparent p-8 text-white lg:p-10">
          <h2 className="text-3xl font-bold tracking-tight lg:text-5xl">
            Recover Access Fast
          </h2>
          <p className="mt-2 text-sm text-white/90 lg:text-base">
            Verify your account and set a new password in minutes.
          </p>
        </div>
      </div>

      <div className="relative flex min-h-[calc(100dvh-14rem)] items-start justify-center px-4 pb-8 pt-20 sm:px-6 md:min-h-screen md:items-center md:px-10 md:py-10">
        <Link
          to="/login"
          className="group absolute right-4 top-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:shadow-md sm:right-6 sm:top-6 sm:px-4 sm:py-2 sm:text-sm"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-0.5">
            &larr;
          </span>
          <span>Back to Login</span>
        </Link>

        <div className="w-full max-w-110">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">{subtitle}</p>

          {step === 1 && (
            <form
              onSubmit={handleSubmit(onEmailSubmit)}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register("email", { required: "Email is required" })}
                  placeholder="Enter your email address"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                />
                {errors.email && (
                  <span className="mt-1 block text-xs text-red-500">
                    {errors.email.message}
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "SEND CODE  ->"}
              </button>
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-orange-600 hover:text-orange-700"
                >
                  Sign In
                </Link>
              </p>
              <p className="text-sm text-gray-500">
                New to this app?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-orange-600 hover:text-orange-700"
                >
                  Create an account
                </Link>
              </p>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={handleSubmit(onOtpSubmit)}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  OTP Code
                </label>
                <div className="mt-2 flex items-center justify-between gap-1.5 sm:gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="h-10 w-10 rounded-lg border border-gray-300 bg-white text-center text-sm font-semibold text-gray-800 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200 sm:h-11 sm:w-11 sm:text-base"
                    />
                  ))}
                </div>
                {otpError && (
                  <span className="mt-1 block text-xs text-red-500">
                    {otpError}
                  </span>
                )}
                <div className="mt-2 text-right text-sm text-gray-400">
                  {resendIn > 0 ? (
                    <span>
                      Resend OTP in{" "}
                      <strong>{`00:${String(resendIn).padStart(2, "0")}`}</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="font-semibold text-orange-600 hover:text-orange-700"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Verifying..." : "VERIFY OTP"}
              </button>
            </form>
          )}

          {step === 3 && (
            <form
              onSubmit={handleSubmit(onResetSubmit)}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("newPassword", {
                      required: "Password is required",
                      minLength: { value: 6, message: "Minimum 6 characters" },
                    })}
                    placeholder="........"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.newPassword && (
                  <span className="mt-1 block text-xs text-red-500">
                    {errors.newPassword.message}
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Resetting..." : "RESET PASSWORD"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
