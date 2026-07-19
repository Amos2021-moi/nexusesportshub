"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                   Types                                     */
/* -------------------------------------------------------------------------- */

interface FormState {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

/* -------------------------------------------------------------------------- */
/*                            Animation variants                              */
/* -------------------------------------------------------------------------- */

const containerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.07 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
} as const;

/* -------------------------------------------------------------------------- */
/*                            Main Reset Password Form                         */
/* -------------------------------------------------------------------------- */

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token") ?? "";

  const [form, setForm] = useState<FormState>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [validToken, setValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No reset token provided. Please request a new password reset.");
      setValidToken(false);
    } else {
      setValidToken(true);
    }
  }, [token]);

  /* ----------------------------- Validation ----------------------------- */

  function validate(): boolean {
    const next: FormErrors = {};

    if (!form.password) {
      next.password = "Password is required.";
    } else if (form.password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }

    if (!form.confirmPassword) {
      next.confirmPassword = "Please confirm your password.";
    } else if (form.confirmPassword !== form.password) {
      next.confirmPassword = "Passwords do not match.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  /* ----------------------------- Handlers ------------------------------- */

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setError("");
    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        toast.success("Password reset successfully! Redirecting to sign in...");
        setTimeout(() => {
          router.push("/auth/signin?reset=true");
        }, 3000);
      } else {
        setError(data.error || "Failed to reset password. Please try again.");
        toast.error(data.error || "Failed to reset password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------- Render ------------------------------- */

  // ✅ Invalid token state
  if (validToken === false) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden bg-gray-900 text-white">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1f2937",
              color: "#fff",
              border: "1px solid #374151",
            },
            error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md"
          >
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-white/10 bg-gray-800/40 p-8 text-center shadow-2xl backdrop-blur-xl"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <AlertCircle className="h-10 w-10 text-red-400" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-white">Invalid Reset Link</h2>
              <p className="mt-2 text-gray-400">
                {error || "No reset token provided. Please request a new password reset."}
              </p>
              <Link
                href="/auth/forgot-password"
                className="mt-6 inline-flex items-center gap-2 text-indigo-400 transition hover:text-indigo-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Request New Reset
              </Link>
              <div className="mt-3">
                <Link
                  href="/auth/signin"
                  className="text-sm text-gray-500 transition hover:text-gray-400"
                >
                  ← Back to sign in
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    );
  }

  // ✅ Main reset form
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gray-900 text-white">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1f2937",
            color: "#fff",
            border: "1px solid #374151",
          },
          success: { iconTheme: { primary: "#4f46e5", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />

      {/* Decorative gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950" />
        <motion.div
          aria-hidden="true"
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/30 blur-[120px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Brand */}
          <motion.div
            variants={itemVariants}
            className="mb-8 flex flex-col items-center text-center"
          >
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 blur-md opacity-60" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-900/50">
                <Shield className="h-9 w-9 text-white" strokeWidth={2.2} />
              </div>
            </div>
            <h1 className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
              Nexus Esports
            </h1>
            <p className="mt-1 text-sm text-gray-400">Create New Password</p>
          </motion.div>

          {/* Glass card */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-gray-800/40 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Reset Password</h2>
              <p className="mt-1 text-sm text-gray-400">
                Enter your new password below.
              </p>
            </div>

            <AnimatePresence>
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-6"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                    <CheckCircle className="h-10 w-10 text-green-400" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">Password Reset! ✅</h3>
                  <p className="mt-2 text-gray-400">
                    Your password has been changed successfully.
                  </p>
                  <p className="mt-1 text-sm text-gray-500">Redirecting to sign in...</p>
                  <div className="mt-4">
                    <div className="mx-auto h-1 w-24 overflow-hidden rounded-full bg-gray-700">
                      <motion.div
                        className="h-full bg-indigo-500"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2.5 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
                      role="alert"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-sm font-medium text-gray-300"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                        <Lock className="h-5 w-5" />
                      </span>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Min 6 characters"
                        value={form.password}
                        onChange={handleChange}
                        disabled={loading}
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? "password-error" : undefined}
                        className="w-full rounded-xl border bg-gray-900/60 py-2.5 pl-10 pr-11 text-sm text-white placeholder-gray-500 transition focus:outline-none focus:ring-2 focus:border-indigo-500/60 focus:ring-indigo-500/50 disabled:opacity-60 min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        disabled={loading}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 transition hover:text-gray-300 focus:text-indigo-400 focus:outline-none disabled:opacity-60 min-h-[44px]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p id="password-error" className="mt-1.5 text-xs text-red-400">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-1.5 block text-sm font-medium text-gray-300"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                        <Lock className="h-5 w-5" />
                      </span>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        aria-invalid={!!errors.confirmPassword}
                        aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
                        className="w-full rounded-xl border bg-gray-900/60 py-2.5 pl-10 pr-11 text-sm text-white placeholder-gray-500 transition focus:outline-none focus:ring-2 focus:border-indigo-500/60 focus:ring-indigo-500/50 disabled:opacity-60 min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        disabled={loading}
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                        aria-pressed={showConfirm}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 transition hover:text-gray-300 focus:text-indigo-400 focus:outline-none disabled:opacity-60 min-h-[44px]"
                      >
                        {showConfirm ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p id="confirm-error" className="mt-1.5 text-xs text-red-400">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.01 } : undefined}
                    whileTap={!loading ? { scale: 0.99 } : undefined}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Reset Password
                      </>
                    )}
                  </motion.button>

                  <div className="text-center">
                    <Link
                      href="/auth/signin"
                      className="text-sm text-gray-500 transition hover:text-gray-400"
                    >
                      ← Back to sign in
                    </Link>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="mt-6 text-center text-xs text-gray-600"
          >
            Your password is securely encrypted and stored.
          </motion.p>
        </motion.div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                       Page export (Suspense wrapper)                        */
/* -------------------------------------------------------------------------- */

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-900">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}