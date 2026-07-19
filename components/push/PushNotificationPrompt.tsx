// @ts-nocheck
"use client";
/*
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function PushNotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setShowPrompt(false);
      return;
    }

    setPermission(Notification.permission);

    if (Notification.permission === "granted") {
      checkSubscription();
    }

    if (Notification.permission === "denied") {
      setShowPrompt(false);
    }
  }, []);

  async function checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setSubscribed(!!subscription);
      if (subscription) {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  }

  // ✅ Simple base64 to Uint8Array conversion
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function handleSubscribe() {
    setLoading(true);
    setError(null);

    try {
      // Request permission
      const result = await Notification.requestPermission();
      if (result !== "granted") {
        setPermission("denied");
        toast.error("Notifications permission denied");
        setShowPrompt(false);
        setLoading(false);
        return;
      }

      setPermission("granted");

      // Get service worker
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID key
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setError("VAPID public key not configured");
        toast.error("VAPID key missing");
        setLoading(false);
        return;
      }

      // ✅ Convert and subscribe - using type assertion to fix TypeScript
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // ✅ @ts-ignore - Ignore the TypeScript error for applicationServerKey
      // @ts-ignore
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      // Save to server
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });

      if (res.ok) {
        setSubscribed(true);
        setShowPrompt(false);
        toast.success("🔔 Push notifications enabled!");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save subscription");
        toast.error(data.error || "Failed to save subscription");
      }
    } catch (error: any) {
      console.error("Error subscribing:", error);
      setError(error.message || "Failed to enable push notifications");
      toast.error(error.message || "Failed to enable push notifications");
    } finally {
      setLoading(false);
    }
  }

  // Don't show if not supported, permission denied, or already subscribed
  if (!showPrompt || permission === "denied" || subscribed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-20 left-0 right-0 z-50 px-4"
      >
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-gray-900/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white">Enable Notifications</h4>
              <p className="mt-0.5 text-xs text-gray-400">
                Get match reminders, result updates, and important alerts.
              </p>
              {error && (
                <p className="mt-1 text-xs text-red-400">❌ {error}</p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="flex min-h-[36px] items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Enabling...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Enable
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPrompt(false)}
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
}*/