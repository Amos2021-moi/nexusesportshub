"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Eye,
  X,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Download,
  Maximize,
  Minimize,
  RotateCw,
  CheckCircle,
  AlertCircle,
  FileImage,
  Sparkles,
  Shield,
} from "lucide-react";

interface EvidenceViewerProps {
  evidenceImage: string | null;
  className?: string;
  buttonText?: string;
  imageAlt?: string;
  thumbnail?: boolean;
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 30,
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.1, duration: 0.3, ease: "easeOut" },
  },
};

export default function EvidenceViewer({
  evidenceImage,
  className = "",
  buttonText = "View Evidence",
  imageAlt = "Match Evidence",
  thumbnail = false,
}: EvidenceViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setZoomLevel(1);
      setRotation(0);
      setIsFullscreen(false);
      setImageError(false);
      setIsLoading(true);
    }
  }, [isOpen]);

  if (!evidenceImage) return null;

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${evidenceImage}`;
    link.download = `evidence-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Thumbnail mode for compact display
  if (thumbnail) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`group relative overflow-hidden rounded-xl border border-white/10 bg-gray-800/40 transition-all hover:border-indigo-500/40 ${className}`}
        >
          <div className="flex h-16 w-24 items-center justify-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
            <FileImage className="h-6 w-6 text-gray-400" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Eye className="h-5 w-5 text-white" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
            <p className="text-[8px] font-medium text-white/80">Evidence</p>
          </div>
        </button>

        {isOpen && (
          <EvidenceModal
            evidenceImage={evidenceImage}
            imageAlt={imageAlt}
            onClose={() => setIsOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 transition-all hover:bg-indigo-500/20 hover:text-indigo-200 ${className}`}
      >
        <Eye size={16} />
        {buttonText}
        <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[10px] text-indigo-300">
          View
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <EvidenceModal
            evidenceImage={evidenceImage}
            imageAlt={imageAlt}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ✅ Separate Modal Component for better organization
function EvidenceModal({
  evidenceImage,
  imageAlt,
  onClose,
}: {
  evidenceImage: string;
  imageAlt: string;
  onClose: () => void;
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${evidenceImage}`;
    link.download = `evidence-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  return (
    <motion.div
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-md sm:p-4"
      onClick={onClose}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative flex h-full max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-white/10 bg-gray-900/95 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gray-800/50 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <FileImage className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Evidence Viewer</h2>
              <p className="text-xs text-gray-400">
                {imageAlt || "Match evidence image"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Controls */}
            <div className="hidden items-center gap-1 sm:flex">
              <button
                onClick={handleZoomOut}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="min-w-[40px] text-center text-xs text-gray-400">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <div className="mx-1 h-6 w-px bg-white/10" />
              <button
                onClick={handleRotate}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                title="Rotate"
              >
                <RotateCw size={16} />
              </button>
              <button
                onClick={handleDownload}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                title="Download"
              >
                <Download size={16} />
              </button>
              <div className="mx-1 h-6 w-px bg-white/10" />
              <button
                onClick={handleReset}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                title="Reset View"
              >
                <span className="text-[10px] font-medium">Reset</span>
              </button>
              <div className="mx-1 h-6 w-px bg-white/10" />
              <button
                onClick={handleFullscreen}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            </div>

            <button
              onClick={onClose}
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white sm:min-h-[44px] sm:min-w-[44px]"
              aria-label="Close viewer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Image Area */}
        <div className="relative flex-1 overflow-hidden bg-gray-950/50">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-3 border-indigo-500/20 border-t-indigo-500" />
                <p className="text-sm text-gray-400">Loading image...</p>
              </div>
            </div>
          )}

          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <p className="text-sm text-red-300">Failed to load image</p>
                <p className="text-xs text-gray-500">The evidence image could not be displayed</p>
              </div>
            </div>
          ) : (
            <motion.div
              variants={imageVariants}
              initial="hidden"
              animate="visible"
              className="flex h-full w-full items-center justify-center p-4"
            >
              <img
                src={`data:image/png;base64,${evidenceImage}`}
                alt={imageAlt || "Evidence image"}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setImageError(true);
                  setIsLoading(false);
                }}
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: "transform 0.2s ease-out",
                  maxHeight: "calc(100% - 2rem)",
                  maxWidth: "calc(100% - 2rem)",
                  objectFit: "contain",
                }}
                className="rounded-lg shadow-2xl"
              />
            </motion.div>
          )}

          {/* Loading overlay */}
          {isLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950/50 backdrop-blur-sm">
              <div className="text-center">
                <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
                <p className="text-sm text-gray-400">Loading image...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-gray-800/30 px-4 py-2.5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                <span>Verified evidence</span>
              </span>
              <span className="hidden h-3 w-px bg-white/10 sm:block" />
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                <span>Encrypted</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600">
                Zoom: {Math.round(zoomLevel * 100)}% • Rotation: {rotation}°
              </span>
              <button
                onClick={handleReset}
                className="rounded-lg bg-white/5 px-2 py-1 text-[10px] text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                Reset View
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}