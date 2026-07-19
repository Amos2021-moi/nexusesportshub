import { useState, useEffect, useCallback } from "react";

interface SystemStatus {
  database: {
    status: "connected" | "disconnected";
    latency: number;
    size: string;
  };
  api: {
    status: "operational" | "degraded" | "down";
  };
  backup: {
    lastBackup: string | null;
    status: string;
  };
  server: {
    uptime: string;
    memory: string;
    cpu: string;
  };
  users: {
    total: number;
    new24h: number;
  };
  pending: {
    results: number;
    reports: number;
    fixtures: number;
  };
  health: {
    status: "healthy" | "warning" | "critical" | "error";
    issues: string[];
  };
  timestamp: string;
  error?: string;
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/system-status");
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching system status:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch system status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    
    // ✅ Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { 
    status, 
    loading, 
    error, 
    refetch: fetchStatus 
  };
}