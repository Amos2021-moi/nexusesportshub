"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  X,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Wallet,
  CreditCard,
  Zap,
  Lock,
  ShieldCheck,
  RefreshCw,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  seasonId: string;
  entryFee: number;
  seasonName?: string;
  onSuccess: () => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

function DecorBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-pink-500/10 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function PaymentModal({
  isOpen,
  onClose,
  seasonId,
  entryFee,
  seasonName = "Season",
  onSuccess,
}: PaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "sending" | "pending" | "success" | "failed" | "timeout"
  >("idle");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [mpesaReceipt, setMpesaReceipt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [pollAttempts, setPollAttempts] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPaymentCompleted = useRef(false);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setPhoneNumber("");
    setLoading(false);
    setPaymentStatus("idle");
    setCheckoutRequestId(null);
    setMpesaReceipt(null);
    setErrorMessage(null);
    setSecondsRemaining(0);
    setPollAttempts(0);
    isPaymentCompleted.current = false;
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const handleCancelPayment = async () => {
    if (!confirm("Are you sure you want to cancel this payment? You can try again later.")) {
      return;
    }

    try {
      const res = await fetch("/api/competition/cancel-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          seasonId: seasonId,
          checkoutRequestId: checkoutRequestId 
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to cancel payment");
      }

      isPaymentCompleted.current = true;
      setPaymentStatus("timeout");
      setErrorMessage("Payment cancelled by you.");
      stopPolling();
      toast.success("Payment cancelled successfully");
    } catch (error: any) {
      console.error("Error cancelling payment:", error);
      toast.error(error.message || "Failed to cancel payment");
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setPaymentStatus("sending");
    setPollAttempts(0);
    isPaymentCompleted.current = false;

    try {
      const res = await fetch("/api/competition/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seasonId,
          phoneNumber: cleanPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setPaymentStatus("pending");
      setSecondsRemaining(90);

      startPolling(data.checkoutRequestId);
      startTimer();

    } catch (error: any) {
      console.error("Payment error:", error);
      setPaymentStatus("failed");
      setErrorMessage(error.message || "Failed to initiate payment");
      toast.error(error.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  const startPolling = (checkoutId: string) => {
    let attempts = 0;
    const maxAttempts = 60;

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // ✅ Poll every 5 seconds to avoid rate limiting
    pollIntervalRef.current = setInterval(async () => {
      if (isPaymentCompleted.current) {
        return;
      }

      attempts++;
      setPollAttempts(attempts);

      try {
        // ✅ Only query Safaricom every 3rd attempt to avoid rate limits
        const shouldQuery = attempts % 3 === 0 || attempts === 1;
        const url = `/api/competition/payment-status?checkoutRequestId=${checkoutId}&attempts=${shouldQuery ? attempts : 0}`;
        
        const res = await fetch(url);
        const data = await res.json();

        console.log(`📊 Poll attempt ${attempts}:`, data);

        // ✅ SUCCESS - Payment confirmed
        if (data.status === "success") {
          isPaymentCompleted.current = true;
          setPaymentStatus("success");
          setMpesaReceipt(data.mpesaReceipt || "N/A");
          stopPolling();
          toast.success("✅ Payment confirmed!");
          setTimeout(() => {
            onSuccess();
          }, 1500);
          return;
        }

        // ✅ FAILED - Payment failed
        if (data.status === "failed") {
          isPaymentCompleted.current = true;
          setPaymentStatus("failed");
          setErrorMessage(data.message || "Payment failed");
          stopPolling();
          toast.error(data.message || "Payment failed");
          return;
        }

        // ✅ CANCELLED - User cancelled on phone
        if (data.status === "cancelled") {
          isPaymentCompleted.current = true;
          setPaymentStatus("failed");
          setErrorMessage("You cancelled the payment on your phone. Please try again.");
          stopPolling();
          toast.error("Payment cancelled on your phone");
          return;
        }

        // ✅ PENDING - Still waiting
        if (data.status === "pending") {
          // Update remaining time
          const elapsed = attempts * 5; // 5 seconds per attempt
          const remaining = Math.max(0, 90 - elapsed);
          setSecondsRemaining(Math.round(remaining));
        }

        // ✅ TIMEOUT - Max attempts reached
        if (attempts >= maxAttempts) {
          isPaymentCompleted.current = true;
          setPaymentStatus("timeout");
          setErrorMessage("Payment timed out. Please try again.");
          stopPolling();
          toast.error("Payment timed out. Please try again.");
        }

      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 5000); // ✅ 5 seconds between polls
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const startTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleClose = () => {
    stopPolling();
    resetState();
    onClose();
  };

  const handleRetry = () => {
    resetState();
  };

  const handleManualCheck = async () => {
    if (!checkoutRequestId) return;

    try {
      toast.loading("Checking payment status...");
      const res = await fetch(
        `/api/competition/payment-status?checkoutRequestId=${checkoutRequestId}&attempts=1`
      );
      const data = await res.json();
      toast.dismiss();
      
      console.log("Manual check result:", data);

      if (data.status === "success") {
        setPaymentStatus("success");
        setMpesaReceipt(data.mpesaReceipt);
        stopPolling();
        toast.success("✅ Payment confirmed!");
        setTimeout(() => onSuccess(), 1500);
      } else if (data.status === "cancelled") {
        setPaymentStatus("failed");
        setErrorMessage("You cancelled the payment on your phone.");
        stopPolling();
        toast.error("Payment cancelled on your phone");
      } else if (data.status === "failed") {
        setPaymentStatus("failed");
        setErrorMessage(data.message || "Payment failed");
        stopPolling();
        toast.error(data.message || "Payment failed");
      } else {
        toast("Still waiting for confirmation... Please wait a moment.");
      }
    } catch (err) {
      toast.dismiss();
      console.error("Manual check error:", err);
      toast.error("Failed to check status. Please try again.");
    }
  };

  // ✅ If modal is closed, don't render
  if (!isOpen) return null;

  return (
    <>
      <DecorBackground />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 28, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gray-800/95 shadow-2xl backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Premium Header */}
              <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 p-4">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="relative flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-white sm:text-xl">
                        {paymentStatus === "idle" && "💰 Payment"}
                        {paymentStatus === "sending" && "⏳ Sending..."}
                        {paymentStatus === "pending" && "⏳ Processing"}
                        {paymentStatus === "success" && "✅ Success!"}
                        {paymentStatus === "failed" && "❌ Failed"}
                        {paymentStatus === "timeout" && "⏰ Timed Out"}
                      </h2>
                      <p className="text-xs text-gray-400">
                        {paymentStatus === "idle" &&
                          `Pay ${formatCurrency(entryFee)} to join ${seasonName}`}
                        {paymentStatus === "pending" &&
                          "Waiting for your confirmation"}
                        {paymentStatus === "success" && "Payment confirmed!"}
                        {paymentStatus === "failed" && "Please try again"}
                        {paymentStatus === "timeout" && "Payment expired"}
                      </p>
                    </div>
                  </div>
                  {paymentStatus !== "sending" && paymentStatus !== "pending" && (
                    <button
                      onClick={handleClose}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                      aria-label="Close modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {paymentStatus === "idle" && (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                  >
                    {/* Season Info */}
                    <motion.div
                      variants={itemVariants}
                      className="rounded-xl border border-white/10 bg-gray-900/40 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-yellow-400" />
                          <span className="text-sm font-medium text-white">
                            {seasonName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-indigo-400" />
                          <span className="text-sm font-bold text-indigo-300">
                            {formatCurrency(entryFee)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Secure M-Pesa payment</span>
                      </div>
                    </motion.div>

                    <form onSubmit={handlePay} className="space-y-4">
                      <motion.div variants={itemVariants}>
                        <label className="mb-1 block text-sm font-medium text-gray-300">
                          <span className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-indigo-400" />
                            M-Pesa Phone Number
                          </span>
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                            <span className="text-sm font-medium text-gray-500">
                              +254
                            </span>
                          </div>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="712345678"
                            className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 pl-14 pr-4 text-white placeholder-gray-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            required
                            disabled={loading}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Enter your Safaricom M-Pesa registered number
                        </p>
                      </motion.div>

                      <motion.button
                        variants={itemVariants}
                        type="submit"
                        disabled={loading}
                        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4" />
                            Pay {formatCurrency(entryFee)}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </motion.button>

                      <motion.div
                        variants={itemVariants}
                        className="flex items-center justify-center gap-2 text-xs text-gray-500"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>Secured by M-Pesa Express</span>
                      </motion.div>
                    </form>
                  </motion.div>
                )}

                {paymentStatus === "sending" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 text-center"
                  >
                    <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                      <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      Sending STK Push...
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Please wait while we send the payment request to your
                      phone.
                    </p>
                    <p className="mt-4 text-xs text-gray-500">
                      This may take a few seconds...
                    </p>
                  </motion.div>
                )}

                {paymentStatus === "pending" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 text-center"
                  >
                    <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-yellow-500/20" />
                      <div className="absolute inset-0 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent" />
                      <Clock className="h-8 w-8 text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      📱 Check Your Phone
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      STK Push sent! Please check your phone and enter your
                      M-Pesa PIN.
                    </p>
                    <div className="mx-auto mt-4 max-w-xs rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                      <p className="text-sm text-yellow-400">
                        ⏳ Waiting for your confirmation...
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                        <span>{secondsRemaining > 0 ? `${secondsRemaining}s remaining` : "Processing..."}</span>
                        <span>Attempt {pollAttempts}/60</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
                          initial={{ width: "100%" }}
                          animate={{
                            width: `${Math.min((secondsRemaining / 90) * 100, 100)}%`,
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      {/* ✅ Manual Check Button */}
                      <button
                        onClick={handleManualCheck}
                        className="mt-3 inline-flex min-h-[36px] w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-indigo-700"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Check Status Now
                      </button>
                      <p className="mt-2 text-[10px] text-gray-500">
                        If you already entered your PIN, click above to confirm
                      </p>
                    </div>
                    <button
                      onClick={handleCancelPayment}
                      className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-600/15 px-4 py-2 text-sm font-semibold text-red-300 transition-all hover:bg-red-600/25"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel Payment
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                      Your payment will be cancelled and you can try again.
                    </p>
                  </motion.div>
                )}

                {paymentStatus === "success" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 text-center"
                  >
                    <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-green-500/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-green-500" />
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      Payment Successful! 🎉
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      You are now registered for{" "}
                      <span className="font-medium text-white">
                        {seasonName}
                      </span>
                    </p>
                    {mpesaReceipt && (
                      <div className="mx-auto mt-3 inline-block rounded-xl border border-white/10 bg-gray-900/40 px-4 py-2">
                        <p className="text-xs text-gray-400">
                          Receipt:{" "}
                          <span className="font-mono text-green-400">
                            {mpesaReceipt}
                          </span>
                        </p>
                      </div>
                    )}
                    <button
                      onClick={handleClose}
                      className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-900/30 transition-all hover:from-green-700 hover:to-emerald-700"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}

                {(paymentStatus === "failed" || paymentStatus === "timeout") && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 text-center"
                  >
                    <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-red-500/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-red-500" />
                      {paymentStatus === "failed" ? (
                        <XCircle className="h-8 w-8 text-red-400" />
                      ) : (
                        <Clock className="h-8 w-8 text-yellow-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {paymentStatus === "failed"
                        ? "Payment Failed"
                        : "⏰ Payment Timed Out"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      {errorMessage ||
                        (paymentStatus === "failed"
                          ? "Something went wrong. Please try again."
                          : "You didn't complete the payment on your phone within the time limit.")}
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                      <button
                        onClick={handleRetry}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all hover:from-indigo-700 hover:to-purple-700"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                      </button>
                      <button
                        onClick={handleClose}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gray-700 px-6 py-2.5 text-sm font-semibold text-gray-300 transition-all hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}