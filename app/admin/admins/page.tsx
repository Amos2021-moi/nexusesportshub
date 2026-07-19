"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  Users,
  Shield,
  Plus,
  Trash2,
  Crown,
  Loader2,
  AlertCircle,
  Sparkles,
  Search,
  Lock,
  ShieldCheck,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";

interface Admin {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  createdAt: string;
  isSuperAdmin: boolean;
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

function adminLabel(admin: Admin) {
  return admin.username || admin.name || admin.email;
}

export default function AdminManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Role check - redirect if not admin
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchAdmins();
    }
  }, [session]);

  async function fetchAdmins() {
    try {
      const res = await fetch("/api/admin/manage");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAdmin(e: FormEvent) {
    e.preventDefault();
    if (!newAdminEmail.trim()) {
      toast.error("Please enter an email");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/admin/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminEmail.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setNewAdminEmail("");
        fetchAdmins();
      } else {
        toast.error(data.error || "Failed to add admin");
      }
    } catch (error) {
      toast.error("Failed to add admin");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveAdmin(userId: string) {
    if (!confirm("Remove this user as an admin? They will become a regular player.")) return;

    setRemoving(userId);
    try {
      const res = await fetch(`/api/admin/manage?userId=${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        fetchAdmins();
      } else {
        toast.error(data.error || "Failed to remove admin");
      }
    } catch (error) {
      toast.error("Failed to remove admin");
    } finally {
      setRemoving(null);
    }
  }

  const filteredAdmins = useMemo(() => {
    if (!searchTerm.trim()) return admins;
    const query = searchTerm.toLowerCase();
    return admins.filter((admin) =>
      [admin.username, admin.name, admin.email].join(" ").toLowerCase().includes(query)
    );
  }, [admins, searchTerm]);

  if (status === "loading" || loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
            <p className="text-sm text-gray-400">Loading admins...</p>
          </div>
        </div>
      </>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  const superAdminCount = admins.filter((a) => a.isSuperAdmin).length;
  const regularAdminCount = admins.filter((a) => !a.isSuperAdmin).length;

  const statCards = [
    {
      label: "Total Admins",
      value: admins.length,
      hint: "All administrators",
      icon: Users,
      accent: "text-indigo-400",
      ring: "border-indigo-500/20",
      glow: "from-indigo-500/20",
    },
    {
      label: "Super Admins",
      value: superAdminCount,
      hint: "Protected accounts",
      icon: Crown,
      accent: "text-yellow-400",
      ring: "border-yellow-500/20",
      glow: "from-yellow-500/20",
    },
    {
      label: "Regular Admins",
      value: regularAdminCount,
      hint: "Removable accounts",
      icon: ShieldCheck,
      accent: "text-green-400",
      ring: "border-green-500/20",
      glow: "from-green-500/20",
    },
  ];

  return (
    <>
      <DecorBackground />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5 sm:space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 sm:h-12 sm:w-12">
                <Shield className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                  🛡️ Admin Management
                </h1>
                <p className="mt-0.5 text-xs text-gray-300 sm:text-sm">
                  Manage administrators. Super admins are defined in environment variables.
                </p>
              </div>
            </div>
            <span className="flex w-fit items-center gap-1.5 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              {admins.length} admins
            </span>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statCards.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`group relative min-h-[44px] overflow-hidden rounded-2xl border bg-gray-800/40 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-indigo-500/40 ${stat.ring}`}
            >
              <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${stat.glow} to-transparent opacity-40 blur-2xl transition-opacity group-hover:opacity-70`} />
              <div className="relative flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-400 sm:text-sm">{stat.label}</p>
                </div>
                <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 ${stat.accent}`}>
                  <stat.icon className="h-5 w-5" />
                </span>
              </div>
              <p className="relative mt-2 truncate text-[11px] text-gray-500">{stat.hint}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Add Admin Form */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Plus className="h-5 w-5 text-indigo-400" />
            Add New Admin
          </h2>
          <form onSubmit={handleAddAdmin} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="Enter user email"
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 py-2.5 pl-10 pr-4 text-white placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                required
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
            >
              {adding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Admin
                </>
              )}
            </button>
          </form>
          <p className="mt-3 text-xs text-gray-500">User must already have an account on the platform.</p>
        </motion.div>

        {/* Admins List */}
        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-2xl border border-white/10 bg-gray-800/40 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-white">Current Admins ({admins.length})</h2>
            </div>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search admins..."
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          {filteredAdmins.length === 0 ? (
            <div className="py-12 text-center">
              <Shield className="mx-auto mb-4 h-16 w-16 text-gray-600" />
              <p className="text-gray-400">{searchTerm ? "No admins match your search" : "No admins found"}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredAdmins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex flex-col gap-3 p-4 transition-all hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 font-bold text-white">
                      {adminLabel(admin).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-white">{adminLabel(admin)}</p>
                        {admin.isSuperAdmin && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/20 bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-300">
                            <Crown className="h-3 w-3" />
                            Super Admin
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm text-gray-400">{admin.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center justify-between gap-3 sm:justify-end">
                    <span className="text-xs text-gray-500">
                      Added: {new Date(admin.createdAt).toLocaleDateString()}
                    </span>
                    {!admin.isSuperAdmin ? (
                      <button
                        onClick={() => handleRemoveAdmin(admin.id)}
                        disabled={removing === admin.id}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 text-red-300 transition-all hover:bg-red-500/20 disabled:opacity-50"
                        title="Remove admin"
                      >
                        {removing === admin.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-gray-900/40 px-3 py-2 text-xs text-gray-400"
                        title="Super admins cannot be removed"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Protected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300">
              <AlertCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-blue-300">About Admin Management</p>
              <ul className="mt-2 space-y-1 text-xs text-gray-400">
                <li>
                  • <strong className="text-gray-300">Super Admins</strong> are defined in the{" "}
                  <code className="rounded bg-gray-700/50 px-1 text-gray-200">ADMIN_EMAILS</code> environment variable and cannot be removed.
                </li>
                <li>
                  • <strong className="text-gray-300">Regular Admins</strong> are added/removed via this page.
                </li>
                <li>• Admins have full access to all admin settings and data.</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}