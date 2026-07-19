"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface GlobalLoadingOverlayProps {
  loading: boolean;
  message?: string;
}

export function GlobalLoadingOverlay({
  loading,
  message = "Loading...",
}: GlobalLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <div className="text-center">
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
              <Loader2 className="absolute inset-0 m-auto h-8 w-8 text-indigo-400 animate-pulse" />
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-sm font-medium text-gray-300"
            >
              {message}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-500"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
              <span>Please wait</span>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400 delay-150" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400 delay-300" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}