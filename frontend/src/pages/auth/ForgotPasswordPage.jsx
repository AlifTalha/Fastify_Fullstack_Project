import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { forgotPassword, verifyOtp, resetPassword } from "../../api/auth";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: reset
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
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
      toast.success("OTP sent to your email");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const onOtpSubmit = async ({ otp }) => {
    try {
      const { data } = await verifyOtp({ email, otp });
      setResetToken(data.resetToken);
      toast.success("OTP verified");
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    }
  };

  const onResetSubmit = async ({ newPassword }) => {
    try {
      await resetPassword({ resetToken, newPassword });
      toast.success("Password reset successful");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Forgot Password</h1>

        {step === 1 && (
          <form onSubmit={handleSubmit(onEmailSubmit)}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                {...register("email", { required: "Email is required" })}
                placeholder="you@example.com"
              />
              {errors.email && (
                <span className="error">{errors.email.message}</span>
              )}
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              Send OTP
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit(onOtpSubmit)}>
            <p>
              Enter the OTP sent to <strong>{email}</strong>
            </p>
            <div className="form-group">
              <label>OTP</label>
              <input
                type="text"
                {...register("otp", { required: "OTP is required" })}
                placeholder="123456"
              />
              {errors.otp && (
                <span className="error">{errors.otp.message}</span>
              )}
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              Verify OTP
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit(onResetSubmit)}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                {...register("newPassword", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Minimum 6 characters" },
                })}
                placeholder="••••••••"
              />
              {errors.newPassword && (
                <span className="error">{errors.newPassword.message}</span>
              )}
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
