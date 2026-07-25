"use client";

import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trophy,
  Users,
  Calendar,
  Search,
  Filter,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ChevronRight,
  Loader2,
  FileImage,
  X,
  ChevronLeft,
  ChevronDown,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckSquare,
  Square,
  ChevronDown as ChevronDownIcon,
  Calendar as CalendarIcon,
  BarChart3,
  TrendingUp,
  History,
  UserCheck,
  Clock as ClockIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { Skeleton } from "@/components/ui/Skeleton";
import ResultCard from "@/components/admin/ResultCard";

interface PendingResult {
  id: string;
  homeScore: number;
  awayScore: number;
  evidenceImage: string;
  submittedBy: string;
  approved: boolean;
  source: string;
  createdAt: string;
  fixture: {
    id: string;
    homePlayer: {
      name: string;
      email: string;
      profile: { username: string; profilePicture: string };
    };
    awayPlayer: {
      name: string;
      email: string;
      profile: { username: string; profilePicture: string };
    };
    scheduledDate: string;
  } | null;
  tournamentMatch: {
    homePlayer: { name: string; profile: { username: string } };
    awayPlayer: { name: string; profile: { username: string } };
    tournament: { name: string };
  } | null;
  user: { name: string; email: string; profile: { username: string } };
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
/*                            Helper Functions                                */
/* -------------------------------------------------------------------------- */

function playerName(player?: { name: string; profile?: { username: string } } | null) {
  return player?.profile?.username || player?.name || "Player";
}

function isToday(date: string) {
  const input = new Date(date);
  const now = new Date();
  return (
    input.getFullYear() === now.getFullYear() &&
    input.getMonth() === now.getMonth() &&
    input.getDate() === now.getDate()
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* -------------------------------------------------------------------------- */
/*                           STATIC Background                               */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950" />
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-red-600/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
});

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                           STATIC Stat Card                                 */
/* -------------------------------------------------------------------------- */

const StatCard = memo(({ stat, isLoading }: { stat: any; isLoading?: boolean }) => {
  const Icon = stat.icon;
  
  if (isLoading) {
    return (
      <div className="h-full rounded-2xl border bg-white/5 p-3 shadow-xl backdrop-blur-xl sm:p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-8 w-16 rounded bg-white/10" />
          <div className="h-4 w-24 rounded bg-white/5" />
        </div>
      </div>
    );
  }
  
  return (
    <div className={`group relative h-full overflow-hidden rounded-2xl border bg-white/5 p-3 shadow-xl backdrop-blur-xl transition-colors duration-150 hover:border-orange-500/40 sm:p-4 ${stat.ring}`}>
      <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${stat.glow} to-transparent opacity-40 blur-2xl transition-opacity duration-300 group-hover:opacity-70`} />
      <div className="relative flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-xl font-bold sm:text-2xl ${stat.accent}`}>{stat.value}</p>
          <p className="mt-0.5 truncate text-xs text-gray-400 sm:text-sm">{stat.label}</p>
        </div>
        <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 sm:h-10 sm:w-10 ${stat.accent}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
      </div>
      <p className="relative mt-2 truncate text-[10px] text-gray-500 sm:text-[11px]">{stat.hint}</p>
    </div>
  );
});

StatCard.displayName = "StatCard";

/* -------------------------------------------------------------------------- */
/*                           STATIC Filter Button                            */
/* -------------------------------------------------------------------------- */

const FilterButton = memo(({ button, filter, setFilter }: {
  button: { value: "pending" | "approved" | "all"; label: string; icon: any; count: number; active: string };
  filter: string;
  setFilter: (value: "pending" | "approved" | "all") => void;
}) => {
  const Icon = button.icon;
  const isActive = filter === button.value;

  return (
    <button
      onClick={() => setFilter(button.value)}
      className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors duration-150 sm:px-4 sm:text-sm ${
        isActive ? button.active : "text-gray-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={14} />
      <span className="hidden sm:inline">{button.label}</span>
      <span>({button.count})</span>
    </button>
  );
});

FilterButton.displayName = "FilterButton";

/* -------------------------------------------------------------------------- */
/*                           STATIC Evidence Modal                           */
/* -------------------------------------------------------------------------- */

const EvidenceModal = memo(({ image, onClose }: { image: string; onClose: () => void }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-5xl rounded-2xl border border-white/10 bg-gray-900/80 p-3 shadow-2xl backdrop-blur-xl sm:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white transition-colors duration-150 hover:bg-white/10 hover:text-gray-300 sm:-top-14"
          aria-label="Close evidence preview"
        >
          <X size={24} />
        </button>
        <Image
          src={`data:image/png;base64,${image}`}
          alt="Evidence"
          width={1000}
          height={750}
          className="max-h-[85vh] w-full rounded-xl object-contain"
          loading="lazy"
          decoding="async"
          sizes="(max-width: 768px) 100vw, 80vw"
        />
      </div>
    </div>
  );
});

EvidenceModal.displayName = "EvidenceModal";

/* -------------------------------------------------------------------------- */
/*                           STATIC Pagination                               */
/* -------------------------------------------------------------------------- */

const Pagination = memo(({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 4;
      }
      if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-white/10 bg-gray-900/40 px-3 text-sm text-gray-400 transition-colors duration-150 hover:bg-gray-800/60 hover:text-white disabled:opacity-50 disabled:hover:bg-gray-900/40"
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline ml-1">Prev</span>
      </button>

      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          className={`min-h-[40px] min-w-[40px] rounded-lg text-sm font-medium transition-colors duration-150 ${
            page === currentPage
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
              : page === '...'
              ? 'text-gray-500 cursor-default'
              : 'text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-white/10 bg-gray-900/40 px-3 text-sm text-gray-400 transition-colors duration-150 hover:bg-gray-800/60 hover:text-white disabled:opacity-50 disabled:hover:bg-gray-900/40"
      >
        <span className="hidden sm:inline mr-1">Next</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
});

Pagination.displayName = "Pagination";

/* -------------------------------------------------------------------------- */
/*                           Bulk Action Bar                                  */
/* -------------------------------------------------------------------------- */

const BulkActionBar = memo(({ 
  selectedCount, 
  totalCount, 
  onSelectAll, 
  onDeselectAll, 
  onApproveSelected, 
  onRejectSelected, 
  isApproving,
  isRejecting 
}: {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onApproveSelected: () => void;
  onRejectSelected: () => void;
  isApproving: boolean;
  isRejecting: boolean;
}) => {
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isSomeSelected = selectedCount > 0;

  if (!isSomeSelected && !isAllSelected) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-gray-900/40 p-3">
        <span className="text-xs text-gray-400">Select results to perform bulk actions</span>
        <button
          onClick={onSelectAll}
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
        >
          Select All
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3">
      <div className="flex items-center gap-3">
        <button
          onClick={isAllSelected ? onDeselectAll : onSelectAll}
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200"
        >
          {isAllSelected ? <CheckCircle size={16} /> : <Square size={16} />}
          {isAllSelected ? 'Deselect All' : 'Select All'}
        </button>
        <span className="text-xs text-gray-300">
          {selectedCount} of {totalCount} selected
        </span>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onApproveSelected}
          disabled={isApproving || selectedCount === 0}
          className="flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-3 text-xs font-semibold text-white shadow-lg shadow-green-900/30 transition-all hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
        >
          {isApproving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          Approve ({selectedCount})
        </button>
        <button
          onClick={onRejectSelected}
          disabled={isRejecting || selectedCount === 0}
          className="flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-600/15 px-3 text-xs font-semibold text-red-300 transition-colors hover:bg-red-600/25 disabled:opacity-50"
        >
          {isRejecting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
          Reject ({selectedCount})
        </button>
        <button
          onClick={onDeselectAll}
          className="flex min-h-[36px] items-center justify-center rounded-lg border border-white/10 bg-gray-800/50 px-3 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
});

BulkActionBar.displayName = "BulkActionBar";

/* -------------------------------------------------------------------------- */
/*                           Advanced Filters                                 */
/* -------------------------------------------------------------------------- */

const AdvancedFilters = memo(({ 
  dateRange, 
  setDateRange, 
  seasonFilter, 
  setSeasonFilter,
  seasons,
  showFilters,
  onClose
}: {
  dateRange: { from: string; to: string };
  setDateRange: (range: { from: string; to: string }) => void;
  seasonFilter: string;
  setSeasonFilter: (season: string) => void;
  seasons: { id: string; name: string }[];
  showFilters: boolean;
  onClose: () => void;
}) => {
  if (!showFilters) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 backdrop-blur-xl">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[150px]">
          <label className="text-xs font-medium text-gray-400">Date From</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="mt-1 min-h-[40px] w-full rounded-lg border border-white/10 bg-gray-900/50 px-3 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-xs font-medium text-gray-400">Date To</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="mt-1 min-h-[40px] w-full rounded-lg border border-white/10 bg-gray-900/50 px-3 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-xs font-medium text-gray-400">Season</label>
          <select
            value={seasonFilter}
            onChange={(e) => setSeasonFilter(e.target.value)}
            className="mt-1 min-h-[40px] w-full rounded-lg border border-white/10 bg-gray-900/50 px-3 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          >
            <option value="all">All Seasons</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>{season.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={onClose}
            className="min-h-[40px] rounded-lg bg-gray-700/50 px-4 text-sm text-gray-300 transition-colors hover:bg-gray-600/50"
          >
            Close Filters
          </button>
        </div>
      </div>
    </div>
  );
});

AdvancedFilters.displayName = "AdvancedFilters";

/* -------------------------------------------------------------------------- */
/*                           Export Dropdown                                  */
/* -------------------------------------------------------------------------- */

const ExportDropdown = memo(({ onExport }: { onExport: (format: 'csv' | 'pdf' | 'print') => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-gray-800/60 px-3.5 py-2 text-sm font-semibold text-gray-200 transition-colors hover:bg-gray-700/60"
      >
        <Download size={16} />
        <span className="hidden sm:inline">Export</span>
        <ChevronDownIcon size={14} className={isOpen ? 'rotate-180' : ''} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-white/10 bg-gray-800 shadow-2xl backdrop-blur-xl">
            <button
              onClick={() => { onExport('csv'); setIsOpen(false); }}
              className="flex min-h-[44px] w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <FileSpreadsheet size={16} />
              Export as CSV
            </button>
            <button
              onClick={() => { onExport('pdf'); setIsOpen(false); }}
              className="flex min-h-[44px] w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <FileText size={16} />
              Export as PDF
            </button>
            <button
              onClick={() => { onExport('print'); setIsOpen(false); }}
              className="flex min-h-[44px] w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Printer size={16} />
              Print
            </button>
          </div>
        </>
      )}
    </div>
  );
});

ExportDropdown.displayName = "ExportDropdown";

/* -------------------------------------------------------------------------- */
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function AdminResultsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [seasonFilter, setSeasonFilter] = useState('all');
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [isBulkRejecting, setIsBulkRejecting] = useState(false);

  // ✅ OPTIMIZED: Fetch results with caching
  const {
    data: resultsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-results", filter, currentPage, searchTerm, dateRange, seasonFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      params.append('filter', filter);
      if (searchTerm) params.append('search', searchTerm);
      if (dateRange.from) params.append('dateFrom', dateRange.from);
      if (dateRange.to) params.append('dateTo', dateRange.to);
      if (seasonFilter !== 'all') params.append('seasonId', seasonFilter);

      const res = await fetch(`/api/admin/results?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
    staleTime: 30000, // ✅ 30 seconds cache
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    placeholderData: (previousData: any) => previousData, // ✅ Keep old data
  });

  // ✅ OPTIMIZED: Fetch stats with caching
  // ✅ Fetch stats - Independent of filter!
const { data: totalStats, isLoading: statsLoading } = useQuery({
  queryKey: ["admin-results-stats", searchTerm, dateRange, seasonFilter], // ✅ Remove 'filter' from key
  queryFn: async () => {
    const params = new URLSearchParams();
    // ✅ Don't send filter - we want ALL stats
    // params.append('filter', filter); // ❌ Remove this
    if (searchTerm) params.append('search', searchTerm);
    if (dateRange.from) params.append('dateFrom', dateRange.from);
    if (dateRange.to) params.append('dateTo', dateRange.to);
    if (seasonFilter !== 'all') params.append('seasonId', seasonFilter);
    
    const res = await fetch(`/api/admin/results/stats?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
  },
  staleTime: 60000,
  gcTime: 5 * 60 * 1000,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
  placeholderData: { total: 0, pending: 0, approved: 0, today: 0 },
});

  // ✅ OPTIMIZED: Fetch seasons with longer cache
  const { data: seasons = [] } = useQuery({
    queryKey: ["admin-seasons"],
    queryFn: async () => {
      const res = await fetch(`/api/seasons`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // ✅ 5 minutes cache
    gcTime: 10 * 60 * 1000,
  });

  const results = resultsData?.results || [];
  const totalResults = resultsData?.total || 0;
  const totalPages = Math.ceil(totalResults / pageSize);

  const totalPending = totalStats?.pending || 0;
  const totalApproved = totalStats?.approved || 0;
  const totalToday = totalStats?.today || 0;
  const totalAll = totalStats?.total || 0;

  // ✅ Toggle selection
  const toggleSelection = useCallback((resultId: string) => {
    setSelectedResults(prev => 
      prev.includes(resultId) 
        ? prev.filter(id => id !== resultId) 
        : [...prev, resultId]
    );
  }, []);

  // ✅ Select all on current page
  const selectAll = useCallback(() => {
    const allIds = results.map((r: any) => r.id);
    setSelectedResults(allIds);
  }, [results]);

  // ✅ Deselect all
  const deselectAll = useCallback(() => {
    setSelectedResults([]);
  }, []);

  // ✅ Bulk approve
  const bulkApprove = useCallback(async () => {
    if (selectedResults.length === 0) return;
    if (!confirm(`Approve ${selectedResults.length} results?`)) return;

    setIsBulkApproving(true);
    let successCount = 0;
    let failCount = 0;

    for (const resultId of selectedResults) {
      try {
        const res = await fetch("/api/admin/results/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resultId }),
        });
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    toast.success(`✅ Approved ${successCount} results${failCount > 0 ? `, ${failCount} failed` : ''}`);
    setSelectedResults([]);
    setIsBulkApproving(false);
    refetch();
    queryClient.invalidateQueries({ queryKey: ["admin-results-stats"] });
  }, [selectedResults, refetch, queryClient]);

  // ✅ Bulk reject
  const bulkReject = useCallback(async () => {
    if (selectedResults.length === 0) return;
    if (!confirm(`Reject ${selectedResults.length} results?`)) return;

    setIsBulkRejecting(true);
    let successCount = 0;
    let failCount = 0;

    for (const resultId of selectedResults) {
      try {
        const res = await fetch("/api/admin/results/reject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resultId }),
        });
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    toast.success(`❌ Rejected ${successCount} results${failCount > 0 ? `, ${failCount} failed` : ''}`);
    setSelectedResults([]);
    setIsBulkRejecting(false);
    refetch();
    queryClient.invalidateQueries({ queryKey: ["admin-results-stats"] });
  }, [selectedResults, refetch, queryClient]);

  // ✅ Approve single result
  const handleApprove = useCallback(async (resultId: string) => {
    queryClient.setQueryData(["admin-results", filter, currentPage, searchTerm, dateRange, seasonFilter], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        results: oldData.results?.filter((r: any) => r.id !== resultId) || [],
        total: Math.max(0, oldData.total - 1),
      };
    });

    queryClient.setQueryData(["admin-results-stats", filter, searchTerm, dateRange, seasonFilter], (oldStats: any) => {
      if (!oldStats) return oldStats;
      return {
        ...oldStats,
        pending: Math.max(0, oldStats.pending - 1),
        total: Math.max(0, oldStats.total - 1),
        approved: oldStats.approved + 1,
        today: isToday(new Date().toISOString()) ? oldStats.today + 1 : oldStats.today,
      };
    });

    try {
      const res = await fetch("/api/admin/results/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      toast.success("✅ Result approved!");
      setTimeout(() => {
        refetch();
        queryClient.invalidateQueries({ queryKey: ["admin-results-stats"] });
      }, 1000);
    } catch (error) {
      toast.error("Failed to approve");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-results-stats"] });
    }
  }, [filter, currentPage, searchTerm, dateRange, seasonFilter, queryClient, refetch]);

  // ✅ Reject single result
  const handleReject = useCallback(async (resultId: string) => {
    if (!confirm("Reject this result?")) return;

    queryClient.setQueryData(["admin-results", filter, currentPage, searchTerm, dateRange, seasonFilter], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        results: oldData.results?.filter((r: any) => r.id !== resultId) || [],
        total: Math.max(0, oldData.total - 1),
      };
    });

    queryClient.setQueryData(["admin-results-stats", filter, searchTerm, dateRange, seasonFilter], (oldStats: any) => {
      if (!oldStats) return oldStats;
      return {
        ...oldStats,
        pending: Math.max(0, oldStats.pending - 1),
        total: Math.max(0, oldStats.total - 1),
      };
    });

    try {
      const res = await fetch("/api/admin/results/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      toast.success("❌ Result rejected!");
      setTimeout(() => {
        refetch();
        queryClient.invalidateQueries({ queryKey: ["admin-results-stats"] });
      }, 1000);
    } catch (error) {
      toast.error("Failed to reject");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-results-stats"] });
    }
  }, [filter, currentPage, searchTerm, dateRange, seasonFilter, queryClient, refetch]);

  // ✅ Handle export
  const handleExport = useCallback(async (format: 'csv' | 'pdf' | 'print') => {
    try {
      const params = new URLSearchParams();
      params.append('filter', filter);
      if (searchTerm) params.append('search', searchTerm);
      if (dateRange.from) params.append('dateFrom', dateRange.from);
      if (dateRange.to) params.append('dateTo', dateRange.to);
      if (seasonFilter !== 'all') params.append('seasonId', seasonFilter);
      params.append('format', format);

      const res = await fetch(`/api/admin/results/export?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to export");

      if (format === 'print') {
        const data = await res.json();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head><title>Results Export</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; background: white; color: black; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #f5f5f5; font-weight: bold; }
                h1 { color: #333; }
                .stats { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
                .stat { background: #f5f5f5; padding: 10px 20px; border-radius: 8px; }
              </style>
              </head>
              <body>
                <h1>Results Report</h1>
                <div class="stats">
                  <div class="stat"><strong>Total:</strong> ${data.total || 0}</div>
                  <div class="stat"><strong>Pending:</strong> ${data.pending || 0}</div>
                  <div class="stat"><strong>Approved:</strong> ${data.approved || 0}</div>
                </div>
                <table>
                  <thead><tr><th>ID</th><th>Home</th><th>Away</th><th>Score</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    ${data.results?.map((r: any) => `
                      <tr>
                        <td>${r.id.slice(0, 8)}</td>
                        <td>${playerName(r.fixture?.homePlayer || r.tournamentMatch?.homePlayer)}</td>
                        <td>${playerName(r.fixture?.awayPlayer || r.tournamentMatch?.awayPlayer)}</td>
                        <td>${r.homeScore}-${r.awayScore}</td>
                        <td>${r.approved ? '✅ Approved' : '⏳ Pending'}</td>
                        <td>${formatDate(r.createdAt)}</td>
                      </tr>
                    `).join('') || ''}
                  </tbody>
                </table>
                <p style="margin-top: 20px; color: #666; font-size: 12px;">Exported on ${new Date().toLocaleString()}</p>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      } else {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `results-export.${format === 'csv' ? 'csv' : 'pdf'}`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`📊 Exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      toast.error("Failed to export");
    }
  }, [filter, searchTerm, dateRange, seasonFilter]);

  // ✅ Manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["admin-results-stats"] }),
      ]);
      toast.success("🔄 Results refreshed!");
    } catch (error) {
      toast.error("Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  }, [refetch, queryClient]);

  // ✅ Stat cards
  const statCards = useMemo(() => [
    {
      label: "Pending",
      value: totalPending,
      hint: "Awaiting approval",
      icon: Clock,
      accent: "text-yellow-400",
      ring: "border-yellow-500/20",
      glow: "from-yellow-500/20",
    },
    {
      label: "Approved",
      value: totalApproved,
      hint: "Approved results",
      icon: CheckCircle,
      accent: "text-green-400",
      ring: "border-green-500/20",
      glow: "from-green-500/20",
    },
    {
      label: "Today",
      value: totalToday,
      hint: "Submitted today",
      icon: Flame,
      accent: "text-orange-400",
      ring: "border-orange-500/20",
      glow: "from-orange-500/20",
    },
    {
      label: "Total",
      value: totalAll,
      hint: "Total submissions",
      icon: Trophy,
      accent: "text-indigo-400",
      ring: "border-indigo-500/20",
      glow: "from-indigo-500/20",
    },
  ], [totalPending, totalApproved, totalToday, totalAll]);

  const filterButtons = useMemo(() => [
    { value: "pending" as const, label: "Pending", icon: Clock, count: totalPending, active: "bg-yellow-500/20 text-yellow-300" },
    { value: "approved" as const, label: "Approved", icon: CheckCircle, count: totalApproved, active: "bg-green-500/20 text-green-300" },
    { value: "all" as const, label: "All", icon: Filter, count: totalAll, active: "bg-indigo-500/20 text-indigo-300" },
  ], [totalPending, totalApproved, totalAll]);

  const setFilterValue = useCallback((value: "pending" | "approved" | "all") => {
    setFilter(value);
    setCurrentPage(1);
    setSelectedResults([]);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSelectedResults([]);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedResults([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleViewEvidence = useCallback((image: string) => {
    setSelectedImage(image);
  }, []);

  // ✅ Show loading only on first load
  if (isLoading && !resultsData) {
    return (
      <>
        <DecorBackground />
        <div className="flex h-96 items-center justify-center px-4">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-orange-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
              <ShieldCheck className="absolute inset-0 m-auto h-6 w-6 text-orange-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading results...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Fetching submissions</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DecorBackground />
      <div className="space-y-4 px-3 pb-20 sm:space-y-6 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-orange-600/20 via-red-600/20 to-purple-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30 sm:h-12 sm:w-12">
                <ShieldCheck className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-white sm:text-2xl">
                  📋 Result Management
                </h1>
                <p className="mt-0.5 truncate text-xs text-gray-300 sm:text-sm">
                  Review and manage match result submissions
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex w-fit items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-300">
                <Sparkles className="h-3.5 w-3.5" />
                {totalPending} pending
              </span>
              <ExportDropdown onExport={handleExport} />
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-gray-800/60 px-3.5 py-2 text-sm font-semibold text-gray-200 transition-colors hover:bg-gray-700/60"
              >
                <Filter size={16} />
                <span className="hidden sm:inline">Filters</span>
                {showAdvancedFilters ? <ChevronDownIcon size={14} className="rotate-180" /> : <ChevronDownIcon size={14} />}
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-gray-200 shadow-lg backdrop-blur-md transition-all duration-150 hover:border-white/30 hover:bg-white/[0.14] hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats - Shows skeletons while loading */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard key={stat.label} stat={stat} isLoading={statsLoading} />
          ))}
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          dateRange={dateRange}
          setDateRange={setDateRange}
          seasonFilter={seasonFilter}
          setSeasonFilter={setSeasonFilter}
          seasons={seasons}
          showFilters={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
        />

        {/* Filter Bar */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search player, submitter, tournament, or source..."
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-colors duration-150 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
            <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-gray-900/40 p-1">
              {filterButtons.map((button) => (
                <FilterButton
                  key={button.value}
                  button={button}
                  filter={filter}
                  setFilter={setFilterValue}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {results.length > 0 && (
          <BulkActionBar
            selectedCount={selectedResults.length}
            totalCount={results.length}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            onApproveSelected={bulkApprove}
            onRejectSelected={bulkReject}
            isApproving={isBulkApproving}
            isRejecting={isBulkRejecting}
          />
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Showing {results.length} of {totalResults} results</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>

        {/* Results List */}
        {results.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center shadow-2xl backdrop-blur-xl">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">No Results Found</h3>
            <p className="px-4 text-sm text-gray-400 sm:text-base">
              {searchTerm || dateRange.from || dateRange.to || seasonFilter !== 'all'
                ? "No results match your filters."
                : filter === "pending"
                ? "All results have been approved! 🎉"
                : filter === "approved"
                ? "No approved results yet."
                : "No result submissions yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result: any) => (
              <ResultCard
                key={result.id}
                result={result}
                onApprove={handleApprove}
                onReject={handleReject}
                onViewEvidence={handleViewEvidence}
                isSelected={selectedResults.includes(result.id)}
                onToggleSelect={toggleSelection}
                showCheckbox={filter !== 'approved'}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Evidence Modal */}
        {selectedImage && (
          <EvidenceModal image={selectedImage} onClose={() => setSelectedImage(null)} />
        )}
      </div>
    </>
  );
}