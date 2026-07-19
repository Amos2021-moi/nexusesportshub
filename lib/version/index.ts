// lib/version/index.ts
import { prisma } from "@/lib/prisma";
import packageJson from "@/package.json";

// Dynamic version data with fallback
let versionData: any = {
  version: packageJson.version || "1.0.0",
  major: 1,
  minor: 0,
  patch: 0,
  build: 0,
  hash: "local",
  environment: "development",
  deploymentId: "local",
  date: new Date().toISOString(),
  autoUpdate: true,
};

// Try to load version.json
try {
  const data = require("./version.json");
  versionData = { ...versionData, ...data };
} catch {
  console.log("📦 version.json not found, using package.json version");
}

// ✅ Export interfaces
export interface Version {
  version: string;
  major: number;
  minor: number;
  patch: number;
  build: number;
  hash: string;
  environment: string;
  deploymentId: string;
  date: string;
  full: string;
  autoUpdate: boolean;
}

export interface VersionHistoryEntry {
  id: string;
  version: string;
  build: number;
  hash: string | null;
  changelog: string | null;
  environment: string;
  deployedBy: string;
  deployedAt: string;
  admin: {
    name: string | null;
    email: string;
  };
}

// ✅ Get current version with real-time data
export function getCurrentVersion(): Version {
  const {
    version = "1.0.0",
    major = 1,
    minor = 0,
    patch = 0,
    build = 0,
    hash = "dev",
    environment = "development",
    deploymentId = "local",
    date = new Date().toISOString(),
    autoUpdate = true,
  } = versionData;

  return {
    version,
    major,
    minor,
    patch,
    build,
    hash,
    environment,
    deploymentId,
    date,
    autoUpdate,
    full: `v${version}${hash !== 'local' && hash !== 'dev' ? `-${hash}` : ''}`,
  };
}

// ✅ Get display version string
export function getDisplayVersion(): string {
  const v = getCurrentVersion();
  return v.full;
}

// ✅ Get version badge text
export function getVersionBadge(): string {
  const v = getCurrentVersion();
  const env = v.environment === 'production' ? '' : ` (${v.environment})`;
  return `v${v.version}${env}`;
}

// ✅ Get environment emoji
export function getEnvironmentEmoji(env?: string): string {
  const envMap: Record<string, string> = {
    production: "🚀",
    staging: "🧪",
    development: "🔧",
    preview: "📦",
    local: "💻",
  };
  return envMap[env || versionData.environment || 'development'] || "🔧";
}

// ✅ Get environment color
export function getEnvironmentColor(env?: string): string {
  const envMap: Record<string, string> = {
    production: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    staging: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10",
    development: "text-blue-400 border-blue-500/20 bg-blue-500/10",
    preview: "text-purple-400 border-purple-500/20 bg-purple-500/10",
    local: "text-gray-400 border-gray-500/20 bg-gray-500/10",
  };
  return envMap[env || versionData.environment || 'development'] || envMap.development;
}

// ✅ Save version to database (called during deployment)
export async function saveVersionToDatabase(
  deployedBy: string,
  changelog?: string,
  environment?: string
): Promise<VersionHistoryEntry> {
  const current = getCurrentVersion();
  const env = environment || current.environment || 'development';

  // Check if this version already exists
  const existing = await prisma.version.findFirst({
    where: {
      version: current.version,
      environment: env,
    },
  });

  if (existing) {
    return existing as unknown as VersionHistoryEntry;
  }

  // Create new version entry
  const entry = await prisma.version.create({
    data: {
      version: current.version,
      build: current.build,
      hash: current.hash || null,
      changelog: changelog || `Version ${current.version} deployed`,
      environment: env,
      deployedBy: deployedBy,
    },
    include: {
      admin: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return entry as unknown as VersionHistoryEntry;
}

// ✅ Get version history
export async function getVersionHistory(
  limit: number = 20,
  environment?: string
): Promise<VersionHistoryEntry[]> {
  const where: any = {};
  if (environment) where.environment = environment;

  const entries = await prisma.version.findMany({
    where,
    include: {
      admin: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { deployedAt: 'desc' },
    take: limit,
  });

  return entries as unknown as VersionHistoryEntry[];
}

// ✅ Get latest version from database
export async function getLatestVersionFromDB(): Promise<VersionHistoryEntry | null> {
  const entry = await prisma.version.findFirst({
    include: {
      admin: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { deployedAt: 'desc' },
  });

  return entry as unknown as VersionHistoryEntry | null;
}

// ✅ Check if current version is in database
export async function isVersionInDatabase(): Promise<boolean> {
  const current = getCurrentVersion();
  const count = await prisma.version.count({
    where: {
      version: current.version,
      environment: current.environment || 'development',
    },
  });
  return count > 0;
}

// ✅ Get version statistics
export async function getVersionStats(): Promise<{
  total: number;
  environments: Record<string, number>;
  latest: string;
  activeUsers: number;
}> {
  const [total, environments, users] = await Promise.all([
    prisma.version.count(),
    prisma.version.groupBy({
      by: ['environment'],
      _count: true,
    }),
    prisma.user.count({
      where: {
        lastActive: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  const latest = await prisma.version.findFirst({
    orderBy: { deployedAt: 'desc' },
    select: { version: true },
  });

  const envCounts: Record<string, number> = {};
  environments.forEach((e) => {
    envCounts[e.environment] = e._count;
  });

  return {
    total,
    environments: envCounts,
    latest: latest?.version || 'Unknown',
    activeUsers: users,
  };
}

// ✅ Check for updates (compares current version with latest in DB)
export async function checkForUpdates(): Promise<{
  hasUpdate: boolean;
  current: string;
  latest: string | null;
  isBehind: boolean;
}> {
  const current = getCurrentVersion();
  const latest = await getLatestVersionFromDB();

  if (!latest) {
    return {
      hasUpdate: false,
      current: current.version,
      latest: null,
      isBehind: false,
    };
  }

  // Compare versions
  const currentParts = current.version.split('.').map(Number);
  const latestParts = latest.version.split('.').map(Number);

  let isBehind = false;
  for (let i = 0; i < 3; i++) {
    if ((latestParts[i] || 0) > (currentParts[i] || 0)) {
      isBehind = true;
      break;
    }
  }

  return {
    hasUpdate: isBehind,
    current: current.version,
    latest: latest.version,
    isBehind,
  };
}

// ✅ Auto-save version on deployment (called from vercel-build)
export async function autoSaveVersion(
  adminId: string,
  changelog?: string
): Promise<VersionHistoryEntry | null> {
  try {
    const inDb = await isVersionInDatabase();
    if (inDb) {
      console.log(`📦 Version ${getCurrentVersion().version} already in database`);
      return null;
    }

    return await saveVersionToDatabase(adminId, changelog);
  } catch (error) {
    console.error('Error auto-saving version:', error);
    return null;
  }
}