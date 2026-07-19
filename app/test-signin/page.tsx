"use client";

import {
  useState,
  useEffect,
  type FormEvent,
  type ChangeEvent,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                   Types                                     */
/* -------------------------------------------------------------------------- */

interface FormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
}

type OAuthProvider = "google" | "facebook";

interface SessionUser {
  role?: string;
  [key: string]: unknown;
}

/* -------------------------------------------------------------------------- */
/*                                 Constants                                   */
/* -------------------------------------------------------------------------- */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_PLAYER_REDIRECT = "/dashboard";
const ADMIN_REDIRECT = "/admin";

/**
 * Maps NextAuth error codes (passed via the `?error=` query param on the
 * callback URL) to user-friendly messages.
 */
const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password. Please try again.",
  OAuthSignin: "Couldn't start the sign-in flow. Please try again.",
  OAuthCallback: "Authentication failed during callback. Please try again.",
  OAuthCreateAccount: "Could not create an account with this provider.",
  EmailCreateAccount: "Could not create an account with this email.",
  Callback: "Authentication callback failed. Please try again.",
  OAuthAccountNotLinked:
    "This email is already linked to another sign-in method.",
  SessionRequired: "Please sign in to access that page.",
  AccessDenied: "Access denied. You don't have permission to sign in.",
  default: "Something went wrong. Please try again.",
};

/* -------------------------------------------------------------------------- */
/*                              Helper functions                              */
/* -------------------------------------------------------------------------- */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function resolveRedirect(role: string | undefined, callbackUrl: string): string {
  // Honour an explicit, safe callbackUrl first.
  if (callbackUrl && callbackUrl !== "/" && isSafeRelativeUrl(callbackUrl)) {
    return callbackUrl;
  }
  return role === "admin" ? ADMIN_REDIRECT : DEFAULT_PLAYER_REDIRECT;
}

/** Only allow same-origin relative paths to avoid open-redirect attacks. */
function isSafeRelativeUrl(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

/* -------------------------------------------------------------------------- */
/*                            Brand SVG Icons                                  */
/* -------------------------------------------------------------------------- */

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.3-.97 2.4-2.06 3.13v2.6h3.33c1.95-1.8 3.07-4.45 3.07-7.6 0-.7-.06-1.4-.18-2.03H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.79 0 5.13-.92 6.84-2.5l-3.33-2.6c-.92.62-2.1.99-3.51.99-2.7 0-4.98-1.82-5.8-4.27H2.77v2.68C4.47 19.66 7.99 22 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.2 13.62A6 6 0 0 1 5.88 12c0-.56.1-1.11.27-1.62V7.7H2.77A10 10 0 0 0 2 12c0 1.6.38 3.12 1.06 4.46l3.14-2.84z"
      />
      <path
        fill="#4285F4"
        d="M12 5.95c1.52 0 2.88.52 3.96 1.55l2.95-2.95C17.13 2.92 14.79 2 12 2 7.99 2 4.47 4.34 2.77 7.7l3.43 2.68C7.02 7.93 9.3 5.95 12 5.95z"
      />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.12 11.93v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.08 24 18.09 24 12.07z"
      />
    </svg>
  );
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
/*                            Main Sign In Form                                */
/* -------------------------------------------------------------------------- */

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const callbackUrl = searchParams?.get("callbackUrl") ?? "";
  const urlError = searchParams?.get("error") ?? "";

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [greeting, setGreeting] = useState("Welcome back");

  /* Set the greeting on mount (avoids SSR/CSR mismatch). */
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  /* Surface OAuth / callback errors arriving via the query string. */
  useEffect(() => {
    if (urlError) {
      toast.error(ERROR_MESSAGES[urlError] ?? ERROR_MESSAGES.default, {
        id: "auth-url-error",
      });
    }
  }, [urlError]);

  /* If a session already exists, route the user onward immediately. */
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as SessionUser).role;
      router.replace(resolveRedirect(role, callbackUrl));
    }
  }, [status, session, router, callbackUrl]);

  /* ----------------------------- Validation ----------------------------- */

  function validate(): boolean {
    const next: FormErrors = {};

    if (!form.email.trim()) {
      next.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }

    if (!form.password) {
      next.password = "Password is required.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  /* ----------------------------- Handlers ------------------------------- */

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear the field-level error as the user types.
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleCredentialsSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting || oauthLoading) return;
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: form.email.trim(),
        password: form.password,
        rememberMe: form.rememberMe,
        callbackUrl: callbackUrl || DEFAULT_PLAYER_REDIRECT,
      });

      if (!result) {
        toast.error(ERROR_MESSAGES.default);
        return;
      }

      if (result.error) {
        const message =
          result.error === "CredentialsSignin"
            ? ERROR_MESSAGES.CredentialsSignin
            : ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.default;
        toast.error(message);
        return;
      }

      toast.success("Signed in successfully. Redirecting…");

      // Determine destination from the fresh session so role-based
      // routing works correctly.
      let role: string | undefined;
      try {
        const res = await fetch("/api/auth/session");
        const data = (await res.json()) as { user?: SessionUser };
        role = data?.user?.role;
      } catch {
        /* fall back to default redirect below */
      }

      const destination =
        result.url && isSafeRelativeUrl(new URL(result.url, window.location.origin).pathname)
          ? resolveRedirect(role, callbackUrl)
          : resolveRedirect(role, callbackUrl);

      router.push(destination);
      router.refresh();
    } catch {
      toast.error(ERROR_MESSAGES.default);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOAuthSignIn(provider: OAuthProvider) {
    if (isSubmitting || oauthLoading) return;
    setOauthLoading(provider);
    try {
      // For OAuth we let NextAuth handle the full-page redirect flow.
      await signIn(provider, {
        callbackUrl: callbackUrl || DEFAULT_PLAYER_REDIRECT,
      });
    } catch {
      toast.error(ERROR_MESSAGES.OAuthSignin);
      setOauthLoading(null);
    }
  }

  const busy = isSubmitting || oauthLoading !== null;

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
        {/* Subtle grid overlay */}
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
              {greeting} — sign in to continue
            </p>
          </motion.div>

          {/* Glass card */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-gray-800/40 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Sign in</h2>
              <p className="mt-1 text-sm text-gray-400">
                Enter your credentials to access your account.
              </p>
            </div>

            {/* URL-level error banner */}
            <AnimatePresence>
              {urlError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{ERROR_MESSAGES[urlError] ?? ERROR_MESSAGES.default}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Social logins */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleOAuthSignIn("google")}
                disabled={busy}
                aria-label="Sign in with Google"
                className="group flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {oauthLoading === "google" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <GoogleIcon className="h-5 w-5" />
                )}
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthSignIn("facebook")}
                disabled={busy}
                aria-label="Sign in with Facebook"
                className="group flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {oauthLoading === "facebook" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <FacebookIcon className="h-5 w-5" />
                )}
                <span>Facebook</span>
              </button>
            </div>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                or continue with
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Credentials form */}
            <form onSubmit={handleCredentialsSignIn} noValidate className="space-y-4">
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
                    value={form.email}
                    onChange={handleChange}
                    disabled={busy}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={`w-full rounded-xl border bg-gray-900/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-gray-500 transition focus:outline-none focus:ring-2 disabled:opacity-60 ${
                      errors.email
                        ? "border-red-500/60 focus:ring-red-500/50"
                        : "border-white/10 focus:border-indigo-500/60 focus:ring-indigo-500/50"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="mt-1.5 text-xs text-red-400">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    disabled={busy}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    className={`w-full rounded-xl border bg-gray-900/60 py-2.5 pl-10 pr-11 text-sm text-white placeholder-gray-500 transition focus:outline-none focus:ring-2 disabled:opacity-60 ${
                      errors.password
                        ? "border-red-500/60 focus:ring-red-500/50"
                        : "border-white/10 focus:border-indigo-500/60 focus:ring-indigo-500/50"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    disabled={busy}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 transition hover:text-gray-300 focus:outline-none focus:text-indigo-400 disabled:opacity-60"
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

              {/* Remember me */}
              <div className="flex items-center">
                <label
                  htmlFor="rememberMe"
                  className="flex cursor-pointer select-none items-center gap-2 text-sm text-gray-300"
                >
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={form.rememberMe}
                    onChange={handleChange}
                    disabled={busy}
                    className="h-4 w-4 rounded border-white/20 bg-gray-900/60 text-indigo-600 accent-indigo-600 focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-0"
                  />
                  Remember me
                </label>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={busy}
                whileHover={!busy ? { scale: 1.01 } : undefined}
                whileTap={!busy ? { scale: 0.99 } : undefined}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Sign up */}
            <p className="mt-6 text-center text-sm text-gray-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-semibold text-indigo-400 transition hover:text-indigo-300"
              >
                Sign up
              </Link>
            </p>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="mt-6 text-center text-xs text-gray-600"
          >
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-gray-500 hover:text-gray-400">
              Terms
            </Link>{" "}
            &amp;{" "}
            <Link href="/privacy" className="text-gray-500 hover:text-gray-400">
              Privacy Policy
            </Link>
            .
          </motion.p>
        </motion.div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                       Page export (Suspense wrapper)                        */
/* -------------------------------------------------------------------------- */

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-900">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}