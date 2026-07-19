"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Loader2 } from "lucide-react";

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    });

    window.addEventListener("appinstalled", () => {
      setShowPrompt(false);
      setIsInstalled(true);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setLoading(true);
    try {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setShowPrompt(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error("Install error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      >
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-gray-900/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">
                Install Nexus Esports App
              </h3>
              <p className="mt-0.5 text-xs text-gray-400">
                Get the best experience with our mobile app. Play faster, get
                notifications, and access offline.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleInstall}
                  disabled={loading}
                  className="flex min-h-[36px] items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {loading ? (
  <div className="flex items-center gap-2">
    <div className="h-3.5 w-3.5 animate-spin-custom rounded-full border-2 border-white border-t-transparent" />
    <span>Installing...</span>
  </div>
) : (
  <>
    <Download className="h-3.5 w-3.5" />
    Install App
  </>
)}
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex min-h-[36px] items-center gap-1.5 rounded-lg bg-gray-700/50 px-4 py-1.5 text-xs text-gray-400 transition hover:bg-gray-600/50 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}