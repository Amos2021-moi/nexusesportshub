"use client";

import { useState, useCallback,useEffect, memo } from "react";
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

/* -------------------------------------------------------------------------- */
/*                           Performance Hooks                                */
/* -------------------------------------------------------------------------- */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

/* -------------------------------------------------------------------------- */
/*                           Helper Functions                                */
/* -------------------------------------------------------------------------- */

function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString()}`;
}

/* -------------------------------------------------------------------------- */
/*                           STATIC Components                               */
/* -------------------------------------------------------------------------- */

// === STATIC Status Badge ===
const StatusBadge = memo(({ 
  type, 
  label 
}: { 
  type: "success" | "warning" | "info" | "error"; 
  label: string;
}) => {
  const colors = {
    success: "border-green-400/20 bg-green-500/10 text-green-300",
    warning: "border-yellow-400/20 bg-yellow-500/10 text-yellow-300",
    info: "border-blue-400/20 bg-blue-500/10 text-blue-300",
    error: "border-red-400/20 bg-red-500/10 text-red-300",
  };
  
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${colors[type]}`}>
      {label}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

// === STATIC Action Button ===
const ActionButton = memo(({ 
  onClick, 
  label, 
  icon: Icon, 
  variant = "primary",
  loading = false,
}: {
  onClick: () => void;
  label: string;
  icon?: any;
  variant?: "primary" | "danger" | "outline";
  loading?: boolean;
}) => {
  const styles = {
    primary: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-900/30",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    outline: "border border-indigo-400/20 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20",
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex min-h-[36px] items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-medium transition-colors duration-150 disabled:opacity-50 ${styles[variant]}`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : Icon ? (
        <Icon className="h-3.5 w-3.5" />
      ) : null}
      {label}
    </button>
  );
});

ActionButton.displayName = "ActionButton";

// === STATIC Card Wrapper ===
const CardWrapper = memo(({ 
  children, 
  gradient, 
  icon: Icon, 
  iconGradient 
}: {
  children: React.ReactNode;
  gradient: string;
  icon: any;
  iconGradient: string;
}) => {
  const isMobile = useIsMobile();
  const hoverClass = isMobile ? "" : "hover:border-emerald-500/40";

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 ${gradient} p-4 shadow-2xl backdrop-blur-xl transition-colors duration-150 ${hoverClass}`}>
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-opacity-10 blur-3xl" />
      <div className="relative flex items-start gap-3">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${iconGradient} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {children}
      </div>
    </div>
  );
});

CardWrapper.displayName = "CardWrapper";

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

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
  const isMobile = useIsMobile();
  const [showModal, setShowModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // ✅ Cancel pending payment
  const handleCancelPayment = useCallback(async () => {
    if (!confirm("Are you sure you want to cancel this payment? You can try again later.")) {
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
  }, [seasonId]);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const handleOpenModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  // ✅ If payment is not required (Free Access)
  if (!paymentRequired) {
    return (
      <CardWrapper gradient="bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10" icon={Gift} iconGradient="bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">🎉 Free Access</p>
            <StatusBadge type="success" label="Active" />
          </div>
          <p className="text-xs text-gray-400">
            You have full access to{" "}
            <span className="font-medium text-white">{seasonName}</span>
          </p>
          <div className="mt-2">
            <Link
              href="/dashboard/fixtures"
              className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-colors duration-150 hover:bg-indigo-500/20"
            >
              View Fixtures <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </CardWrapper>
    );
  }

  // ✅ If payment is pending
  if (status === "PAYMENT_PENDING") {
    return (
      <CardWrapper gradient="bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10" icon={Loader2} iconGradient="bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/30">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">⏳ Payment Processing</p>
            <StatusBadge type="warning" label="Pending" />
          </div>
          <p className="text-xs text-gray-400">
            Your payment is being processed. Please wait...
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Check your phone for the STK Push and enter your PIN.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <ActionButton onClick={handleRefresh} label="Refresh" icon={RefreshCw} variant="outline" />
            <ActionButton onClick={handleCancelPayment} label="Cancel Payment" icon={XCircle} variant="danger" loading={isCancelling} />
          </div>
        </div>
      </CardWrapper>
    );
  }

  // ✅ If already paid
  if (hasPaid) {
    return (
      <CardWrapper gradient="bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10" icon={CheckCircle} iconGradient="bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">✅ Active Member</p>
            <StatusBadge type="success" label="Registered" />
          </div>
          <p className="text-xs text-gray-400">
            You're registered for{" "}
            <span className="font-medium text-white">{seasonName}</span>
          </p>
          <div className="mt-2">
            <Link
              href="/dashboard/fixtures"
              className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-colors duration-150 hover:bg-indigo-500/20"
            >
              View Fixtures <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </CardWrapper>
    );
  }

  // ✅ Payment required and not paid - Show "Pay Now" button
  return (
    <>
      <CardWrapper gradient="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10" icon={Lock} iconGradient="bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">💰 Payment Required</p>
            <StatusBadge type="error" label="Unpaid" />
          </div>
          <p className="text-xs text-gray-400">
            Pay <span className="font-bold text-white">{formatCurrency(entryFee)}</span> to join{" "}
            <span className="font-medium text-white">{seasonName}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ActionButton onClick={handleOpenModal} label="Pay Now" icon={CreditCard} variant="primary" />
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <Zap className="h-3 w-3 text-yellow-400" />
              Secure M-Pesa
            </span>
          </div>
          <p className="mt-1 text-[10px] text-gray-500">
            ⚡ You'll get full access to fixtures and standings after payment
          </p>
        </div>
      </CardWrapper>

      {/* Payment Modal - NO animations */}
      <PaymentModal
        isOpen={showModal}
        onClose={handleCloseModal}
        seasonId={seasonId}
        entryFee={entryFee}
        seasonName={seasonName}
        onSuccess={onPaymentSuccess}
      />
    </>
  );
}