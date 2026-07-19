"use client";

import {
  useState,
  useEffect,
  type FormEvent,
  type ChangeEvent,
  Suspense,
} from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  Shield,
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  RotateCcw,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                 Constants                                   */
/* -------------------------------------------------------------------------- */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORGOT_PASSWORD_ENDPOINT = "/api/auth/forgot-password";

const ERROR_MESSAGES: Record<string, string> = {
  RateLimited: "Too many requests. Please wait a moment and try again.",
  Network: "Network error. Please check your connection and try again.",
  default: "Something went wrong. Please try again.",
};

/* -------------------------------------------------------------------------- */
/*                            Animation variants                              */
/*              (identical to the Sign In / Sign Up pages)                     */
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
/*                              Helper functions                              */
/* -------------------------------------------------------------------------- */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/* -------------------------------------------------------------------------- */
/*                          Forgot Password Form                              */
/* -------------------------------------------------------------------------- */

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [bannerError, setBannerError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [greeting, setGreeting] = useState("Reset access");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  /* ----------------------------- Validation ----------------------------- */

  function validate(): boolean {
    if (!email.trim()) {
      setFieldError("Email is required.");
      return false;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setFieldError("Enter a valid email address.");
      return false;
    }
    setFieldError(undefined);
    return true;
  }

  /* ----------------------------- Handlers ------------------------------- */

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (fieldError) setFieldError(undefined);
    if (bannerError) setBannerError(undefined);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    setBannerError(undefined);

    const trimmed = email.trim().toLowerCase();

    try {
      const res = await fetch(FORGOT_PASSWORD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      let data: { error?: string; message?: string } = {};
      try {
        data = await res.json();
      } catch {
        /* tolerate empty / non-JSON bodies */
      }

      if (!res.ok) {
        let code = data?.error ?? "";
        if (!code && res.status === 429) code = "RateLimited";
        const message =
          ERROR_MESSAGES[code] ?? data?.message ?? ERROR_MESSAGES.default;
        setBannerError(message);
        toast.error(message);
        return;
      }

      // Success — note: for security, the API should respond 200 whether or
      // not the email exists, so we always show the same confirmation.
      setSubmittedEmail(trimmed);
      setIsSuccess(true);
      toast.success("Reset link sent! Check your inbox.");
    } catch {
      setBannerError(ERROR_MESSAGES.Network);
      toast.error(ERROR_MESSAGES.Network);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleTryAgain() {
    setIsSuccess(false);
    setEmail("");
    setSubmittedEmail("");
    setFieldError(undefined);
    setBannerError(undefined);
  }

  /* ------------------------------- Render ------------------------------- */

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

      {/* Decorative gradient background (matches Sign In / Sign Up) */}
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
            <p className="mt-1 text-sm text-gray-400">
              {greeting} — let&apos;s recover your account
            </p>
          </motion.div>

          {/* Glass card */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-gray-800/40 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                /* ----------------------- Initial / form ----------------------- */
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-white">
                      Forgot password?
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                      Enter the email linked to your account and we&apos;ll send
                      you a reset link.
                    </p>
                  </div>

                  {/* Error banner */}
                  <AnimatePresence>
                    {bannerError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-5 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
                        role="alert"
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>{bannerError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-1.5 block text-sm font-medium text-gray-300"
                      >
                        Email address
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                          <Mail className="h-5 w-5" />
                        </span>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          autoFocus
                          aria-invalid={!!fieldError}
                          aria-describedby={
                            fieldError ? "email-error" : undefined
                          }
                          className={`min-h-[44px] w-full rounded-xl border bg-gray-900/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-gray-500 transition focus:outline-none focus:ring-2 disabled:opacity-60 ${
                            fieldError
                              ? "border-red-500/60 focus:ring-red-500/50"
                              : "border-white/10 focus:border-indigo-500/60 focus:ring-indigo-500/50"
                          }`}
                        />
                      </div>
                      {fieldError && (
                        <p
                          id="email-error"
                          className="mt-1.5 text-xs text-red-400"
                        >
                          {fieldError}
                        </p>
                      )}
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={!isSubmitting ? { scale: 1.01 } : undefined}
                      whileTap={!isSubmitting ? { scale: 0.99 } : undefined}
                      className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Sending link…</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Send Reset Link</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              ) : (
                /* ------------------------- Success state ------------------------ */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 14,
                      delay: 0.1,
                    }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30"
                  >
                    <CheckCircle className="h-9 w-9 text-emerald-400" />
                  </motion.div>

                  <h2 className="mt-5 text-xl font-semibold text-white">
                    Check your email
                  </h2>
                  <p className="mt-2 text-sm text-gray-400">
                    If an account exists for{" "}
                    <span className="font-medium text-gray-200">
                      {submittedEmail}
                    </span>
                    , we&apos;ve sent a password reset link. It may take a few
                    minutes to arrive.
                  </p>

                  <div className="mt-5 rounded-xl border border-white/10 bg-gray-900/40 p-3 text-xs text-gray-500">
                    Didn&apos;t get the email? Check your spam folder or try a
                    different address.
                  </div>

                  <button
                    type="button"
                    onClick={handleTryAgain}
                    className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Use a different email
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Back to sign in */}
            <div className="mt-6 border-t border-white/10 pt-5 text-center">
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="mt-6 text-center text-xs text-gray-600"
          >
            Remembered your password?{" "}
            <Link
              href="/auth/signin"
              className="text-gray-500 transition hover:text-gray-400"
            >
              Sign in
            </Link>{" "}
            instead.
          </motion.p>
        </motion.div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                       Page export (Suspense wrapper)                        */
/* -------------------------------------------------------------------------- */

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-900">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
