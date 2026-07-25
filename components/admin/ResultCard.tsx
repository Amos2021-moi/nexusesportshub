"use client";

import { useState, useCallback, memo } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trophy,
  Users,
  Calendar,
  FileImage,
  AlertTriangle,
  Loader2,
  Square,
} from "lucide-react";
import Image from "next/image";
import ProgressBar from "@/components/ui/ProgressBar";

interface ResultCardProps {
  result: any;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onViewEvidence: (image: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  showCheckbox?: boolean;
}

// Helper function
function playerName(player?: { name: string; profile?: { username: string } } | null) {
  return player?.profile?.username || player?.name || "Player";
}

const ResultCard = memo(({ 
  result, 
  onApprove, 
  onReject, 
  onViewEvidence,
  isSelected = false,
  onToggleSelect,
  showCheckbox = false,
}: ResultCardProps) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [actionStatus, setActionStatus] = useState<'approving' | 'rejecting' | 'completed' | 'error'>('approving');

  const isPending = !result.approved;
  const isTournament = !result.fixture && result.tournamentMatch;
  const homeName = result.fixture
    ? playerName(result.fixture.homePlayer)
    : playerName(result.tournamentMatch?.homePlayer);
  const awayName = result.fixture
    ? playerName(result.fixture.awayPlayer)
    : playerName(result.tournamentMatch?.awayPlayer);
  const submittedBy = result.user?.profile?.username || result.user?.name || result.user?.email || "Unknown";
  const matchDate = result.fixture?.scheduledDate || result.createdAt;
  const hasEvidence = result.evidenceImage && result.evidenceImage.length > 0;

  // ✅ Handle checkbox toggle
  const handleCheckboxToggle = useCallback(() => {
    if (onToggleSelect) {
      onToggleSelect(result.id);
    }
  }, [onToggleSelect, result.id]);

  // ✅ Handle Approve with Progress
  const handleApprove = useCallback(async () => {
    if (isApproving) return;
    
    setIsApproving(true);
    setActionStatus('approving');
    setProgress(0);

    const stages = [
      { progress: 20, label: 'Validating result...' },
      { progress: 45, label: 'Checking evidence...' },
      { progress: 70, label: 'Updating database...' },
      { progress: 90, label: 'Finalizing...' },
    ];

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgress(stage.progress);
    }

    try {
      await onApprove(result.id);
      setProgress(100);
      setActionStatus('completed');
      
      setTimeout(() => {
        setIsApproving(false);
        setProgress(0);
      }, 1500);
    } catch (error) {
      setActionStatus('error');
      setTimeout(() => {
        setIsApproving(false);
        setProgress(0);
      }, 2000);
    }
  }, [result.id, onApprove, isApproving]);

  // ✅ Handle Reject with Progress
  const handleReject = useCallback(async () => {
    if (isRejecting) return;
    
    if (!confirm("Are you sure you want to reject this result?")) return;

    setIsRejecting(true);
    setActionStatus('rejecting');
    setProgress(0);

    const stages = [
      { progress: 25, label: 'Verifying rejection...' },
      { progress: 50, label: 'Processing...' },
      { progress: 75, label: 'Updating...' },
      { progress: 90, label: 'Finalizing...' },
    ];

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, 250));
      setProgress(stage.progress);
    }

    try {
      await onReject(result.id);
      setProgress(100);
      setActionStatus('completed');
      
      setTimeout(() => {
        setIsRejecting(false);
        setProgress(0);
      }, 1500);
    } catch (error) {
      setActionStatus('error');
      setTimeout(() => {
        setIsRejecting(false);
        setProgress(0);
      }, 2000);
    }
  }, [result.id, onReject, isRejecting]);

  const handleViewEvidence = useCallback(() => {
    if (hasEvidence) {
      onViewEvidence(result.evidenceImage);
    }
  }, [onViewEvidence, result.evidenceImage, hasEvidence]);

  const isActionInProgress = isApproving || isRejecting;

  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-white/5 shadow-xl backdrop-blur-xl transition-all duration-200 ${
      isPending 
        ? 'border-yellow-500/20 hover:border-yellow-500/50' 
        : 'border-green-500/15 hover:border-green-500/40'
    } ${isActionInProgress ? 'ring-2 ring-indigo-500/50' : ''} ${isSelected ? 'ring-2 ring-indigo-500/50 bg-indigo-500/5' : ''}`}>
      
      {/* Status Bar */}
      <div
        className={`transition-all duration-300 ${
          isPending
            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
            : "bg-gradient-to-r from-green-500 to-emerald-500"
        } ${isActionInProgress ? 'h-1.5' : 'h-1'}`}
      />

      <div className="p-4 sm:p-5">
        {/* Badges with Checkbox */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* ✅ Checkbox for bulk actions */}
          {showCheckbox && (
            <button
              onClick={handleCheckboxToggle}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-white/20 transition-colors hover:bg-white/10"
              disabled={isActionInProgress}
            >
              {isSelected ? (
                <CheckCircle className="h-5 w-5 text-indigo-400" />
              ) : (
                <Square className="h-5 w-5 text-gray-400" />
              )}
            </button>
          )}

          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
              isTournament
                ? "border-purple-400/20 bg-purple-500/15 text-purple-300"
                : "border-blue-400/20 bg-blue-500/15 text-blue-300"
            }`}
          >
            <Trophy size={12} />
            {isTournament ? "Tournament" : "League"}
          </span>
          {isTournament && (
            <span className="rounded-full border border-white/10 bg-gray-900/40 px-2.5 py-1 text-xs text-gray-400">
              {result.tournamentMatch?.tournament?.name || "Match"}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
              isPending
                ? "border-yellow-400/20 bg-yellow-500/15 text-yellow-300"
                : "border-green-400/20 bg-green-500/15 text-green-300"
            }`}
          >
            {isPending ? <Clock size={12} /> : <CheckCircle size={12} />}
            {isPending ? "Pending" : "Approved"}
          </span>
          {isActionInProgress && (
            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-400/20 bg-indigo-500/15 px-2.5 py-1 text-xs font-medium text-indigo-300 animate-pulse">
              <Loader2 size={12} className="animate-spin" />
              Processing...
            </span>
          )}
          {isSelected && (
            <span className="rounded-full border border-indigo-400/20 bg-indigo-500/15 px-2.5 py-1 text-xs font-medium text-indigo-300">
              Selected
            </span>
          )}
        </div>

        {/* Match display */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-gray-900/40 p-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 font-bold text-white">
                {homeName.charAt(0).toUpperCase()}
              </span>
              <span className="truncate font-semibold text-white">{homeName}</span>
            </div>

            <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-gray-950/50 px-4 py-3 shadow-inner sm:px-5">
              <span className="text-xl font-black text-white sm:text-2xl lg:text-3xl">{result.homeScore}</span>
              <span className="text-gray-500 text-sm sm:text-base">-</span>
              <span className="text-xl font-black text-white sm:text-2xl lg:text-3xl">{result.awayScore}</span>
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-gray-900/40 p-3 sm:justify-end">
              <span className="truncate font-semibold text-white">{awayName}</span>
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 font-bold text-white">
                {awayName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-400 md:grid-cols-3">
          <div className="flex min-w-0 items-center gap-2 rounded-xl bg-gray-900/30 px-3 py-2">
            <Calendar size={14} className="flex-shrink-0 text-orange-300" />
            <span className="truncate">{new Date(matchDate).toLocaleDateString()}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2 rounded-xl bg-gray-900/30 px-3 py-2">
            <Users size={14} className="flex-shrink-0 text-blue-300" />
            <span className="truncate">Submitted by: {submittedBy}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2 rounded-xl bg-gray-900/30 px-3 py-2">
            <Clock size={14} className="flex-shrink-0 text-gray-400" />
            <span className="truncate">{new Date(result.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Progress Bar - shown when action is in progress */}
        {isActionInProgress && (
          <ProgressBar
            isVisible={isActionInProgress}
            progress={progress}
            status={actionStatus}
            label={isApproving ? 'Approving result...' : 'Rejecting result...'}
          />
        )}

        {/* Evidence + actions */}
        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {hasEvidence ? (
              <button
                onClick={handleViewEvidence}
                disabled={isActionInProgress}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-4 text-sm font-medium text-indigo-300 transition-colors duration-150 hover:bg-indigo-500/20 disabled:opacity-50"
              >
                <FileImage size={16} />
                View Evidence
                <Eye size={14} />
              </button>
            ) : (
              <span className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-gray-900/40 px-4 text-sm text-gray-500">
                <AlertTriangle size={16} />
                No evidence attached
              </span>
            )}
          </div>

          {isPending && !isActionInProgress && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={handleApprove}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-green-900/30 transition-all duration-150 hover:from-green-700 hover:to-emerald-700"
              >
                <CheckCircle size={16} />
                Approve Result
              </button>
              <button
                onClick={handleReject}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-600/15 px-4 text-sm font-semibold text-red-300 transition-colors duration-150 hover:bg-red-600/25"
              >
                <XCircle size={16} />
                Reject
              </button>
            </div>
          )}

          {/* Show buttons disabled when action is in progress */}
          {isPending && isActionInProgress && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                disabled
                className="flex min-h-[44px] cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-gray-600/50 px-4 text-sm font-semibold text-gray-400"
              >
                <Loader2 size={16} className="animate-spin" />
                {isApproving ? 'Approving...' : 'Rejecting...'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ResultCard.displayName = "ResultCard";

export default ResultCard;