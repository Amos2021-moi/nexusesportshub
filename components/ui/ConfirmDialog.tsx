"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  X,
  AlertTriangle,
  Shield,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  Lock,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "success";
  icon?: React.ElementType;
  loading?: boolean;
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.1, duration: 0.3, ease: "easeOut" },
  },
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  icon,
  loading = false,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const typeConfig = {
    danger: {
      bg: "from-red-500/20 to-red-600/10",
      border: "border-red-500/30",
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
      buttonBg: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
      buttonShadow: "shadow-red-500/30",
      glow: "bg-red-500/10",
      Icon: Trash2,
      label: "Danger",
    },
    warning: {
      bg: "from-yellow-500/20 to-amber-500/10",
      border: "border-yellow-500/30",
      iconBg: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
      buttonBg: "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600",
      buttonShadow: "shadow-yellow-500/30",
      glow: "bg-yellow-500/10",
      Icon: AlertTriangle,
      label: "Warning",
    },
    info: {
      bg: "from-blue-500/20 to-indigo-500/10",
      border: "border-blue-500/30",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      buttonBg: "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600",
      buttonShadow: "shadow-blue-500/30",
      glow: "bg-blue-500/10",
      Icon: Info,
      label: "Info",
    },
    success: {
      bg: "from-green-500/20 to-emerald-500/10",
      border: "border-green-500/30",
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
      buttonBg: "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
      buttonShadow: "shadow-green-500/30",
      glow: "bg-green-500/10",
      Icon: CheckCircle,
      label: "Success",
    },
  };

  const config = typeConfig[type] || typeConfig.info;
  const IconComponent = icon || config.Icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gray-800/95 shadow-2xl backdrop-blur-xl"
          >
            {/* Decorative glow */}
            <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full ${config.glow} blur-3xl`} />
            <div className={`absolute -bottom-20 -left-20 h-40 w-40 rounded-full ${config.glow} blur-3xl`} />

            {/* Type indicator bar */}
            <div className={`h-1 w-full bg-gradient-to-r ${config.buttonBg.split(" ")[0]}`} />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Close dialog"
              disabled={loading}
            >
              <X size={18} />
            </button>

            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="p-6"
            >
              {/* Icon & Title */}
              <div className="mb-4 flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${config.iconBg} ${config.border}`}
                >
                  <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${config.border} ${config.iconColor}`}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{message}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white shadow-lg transition-all ${config.buttonBg} ${config.buttonShadow} hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100`}
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      {confirmText}
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-white/10 bg-gray-700/50 px-4 py-2.5 font-semibold text-gray-300 transition-all hover:bg-gray-600/50 hover:text-white disabled:opacity-50"
                >
                  {cancelText}
                </button>
              </div>

              {/* Safety note for danger actions */}
              {type === "danger" && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                  <p className="text-xs text-red-300">This action cannot be undone</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}