import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export function useAnalytics<T>(endpoint: string, params?: Record<string, any>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`/api/admin/analytics/${endpoint}`, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value));
          }
        });
      }

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch data";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}