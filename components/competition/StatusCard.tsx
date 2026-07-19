"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Lock,
  CreditCard,
  Loader2,
  ArrowRight,
  XCircle,
  RefreshCw,
  Sparkles,
  Shield,
  Zap,
  Wallet,
  Gift,
  Crown,
  Star,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import PaymentModal from "./PaymentModal";

interface StatusCardProps {
  seasonId: string;
  seasonName: string;
  paymentRequired: boolean;
  entryFee: number;
  hasPaid: boolean;
  status: string;
  userId: string;
  onPaymentSuccess: () => void;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString()}`;
}

export default function StatusCard({
  seasonId,
  seasonName,
  paymentRequired,
  entryFee,
  hasPaid,
  status,
  userId,
  onPaymentSuccess,
}: StatusCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // ✅ Cancel pending payment
  const handleCancelPayment = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel this payment? You can try again later."
      )
    ) {
      return;
    }

    setIsCancelling(true);
    try {
      const res = await fetch("/api/competition/cancel-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seasonId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to cancel payment");
      }

      toast.success("Payment cancelled successfully");
      window.location.reload();
    } catch (error: any) {
      console.error("Error cancelling payment:", error);
      toast.error(error.message || "Failed to cancel payment");
    } finally {
      setIsCancelling(false);
    }
  };

  // ✅ If payment is not required (Free Access)
  if (!paymentRequired) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 p-4 shadow-2xl backdrop-blur-xl transition-all hover:border-emerald-500/40"
      >
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30">
            <Gift className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white">🎉 Free Access</p>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                Active
              </span>
            </div>
            <p className="text-xs text-gray-400">
              You have full access to{" "}
              <span className="font-medium text-white">{seasonName}</span>
            </p>
          </div>
          <Link
            href="/dashboard/fixtures"
            className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-all hover:bg-indigo-500/20"
          >
            View Fixtures <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </motion.div>
    );
  }

  // ✅ If payment is pending
  if (status === "PAYMENT_PENDING") {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10 p-4 shadow-2xl backdrop-blur-xl transition-all hover:border-yellow-500/40"
      >
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-yellow-500/10 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/30">
            <div className="absolute inset-0 animate-ping rounded-xl bg-yellow-400/30" />
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white">⏳ Payment Processing</p>
              <span className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-300">
                Pending
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Your payment is being processed. Please wait...
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Check your phone for the STK Push and enter your PIN.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-blue-700"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
              <button
                onClick={handleCancelPayment}
                disabled={isCancelling}
                className="inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-red-700 disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    Cancel Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ✅ If already paid
  if (hasPaid) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 p-4 shadow-2xl backdrop-blur-xl transition-all hover:border-green-500/40"
      >
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-green-500/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white">✅ Active Member</p>
              <span className="rounded-full border border-green-400/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-300">
                Registered
              </span>
            </div>
            <p className="text-xs text-gray-400">
              You're registered for{" "}
              <span className="font-medium text-white">{seasonName}</span>
            </p>
          </div>
          <Link
            href="/dashboard/fixtures"
            className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-all hover:bg-indigo-500/20"
          >
            View Fixtures <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </motion.div>
    );
  }

  // ✅ Payment required and not paid - Show "Pay Now" button
  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 p-4 shadow-2xl backdrop-blur-xl transition-all hover:border-amber-500/40"
      >
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white">💰 Payment Required</p>
              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                Unpaid
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Pay <span className="font-bold text-white">{formatCurrency(entryFee)}</span> to join{" "}
              <span className="font-medium text-white">{seasonName}</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex min-h-[36px] items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 text-xs font-medium text-white shadow-lg shadow-indigo-900/30 transition-all hover:from-indigo-700 hover:to-purple-700"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Pay Now
              </button>
              <span className="flex items-center gap-1 text-[10px] text-gray-500">
                <Zap className="h-3 w-3 text-yellow-400" />
                Secure M-Pesa
              </span>
            </div>
            <p className="mt-1 text-[10px] text-gray-500">
              ⚡ You'll get full access to fixtures and standings after payment
            </p>
          </div>
        </div>
      </motion.div>

      {/* ✅ Payment Modal */}
      <PaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        seasonId={seasonId}
        entryFee={entryFee}
        seasonName={seasonName}
        onSuccess={onPaymentSuccess}
      />
    </>
  );
}