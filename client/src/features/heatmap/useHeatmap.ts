import { useState, useCallback } from 'react';
import { fetchHeatmap } from '../../api/heatmap';
import { usePolling } from '../../shared/hooks/usePolling';
import type { HeatmapAP, ApRecord } from './types';

const THIRTY_SECONDS = 30_000;

/**
 * Parse AP device name into its building/room/apId components.
 * Expected format: "he041-ap-001" or "li102-ap-002" (case-insensitive).
 * Returns null if the name does not match the convention.
 */
function parseApName(name: string): { building: string; room: string; apId: string } | null {
  const m = name.match(/^(he|li)(\d{3,4})-ap-(\d{3})$/i);
  if (!m) return null;
  return {
    building: m[1].toUpperCase(),  // "he" → "HE"
    room: m[2],                     // "041"
    apId: m[3],                     // "001"
  };
}

/** Convert a raw API HeatmapAP into a UI ApRecord. Returns null if name cannot be parsed. */
function toApRecord(ap: HeatmapAP): ApRecord | null {
  const parsed = parseApName(ap.name);
  if (!parsed) return null;
  return {
    id: `${parsed.building.toLowerCase()}${parsed.room}`, // e.g. "he041"
    room: parsed.room,
    building: parsed.building,
    apId: parsed.apId,
    clientCount: ap.client_count,
    wiredCount: ap.wired_client_count,
    // All APs returned by the API are considered online
    // (the DB only stores APs the poller has seen)
    status: 'online',
  };
}

interface UseHeatmapResult {
  aps: ApRecord[];
  totalWireless: number;
  totalWired: number;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export function useHeatmap(siteId?: string): UseHeatmapResult {
  const [aps, setAps] = useState<ApRecord[]>([]);
  const [totalWireless, setTotalWireless] = useState(0);
  const [totalWired, setTotalWired] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const load = useCallback(() => {
    fetchHeatmap(siteId)
      .then((data: HeatmapAP[]) => {
        const records = data.flatMap((ap) => {
          const record = toApRecord(ap);
          return record ? [record] : [];
        });
        setAps(records);
        // Only count clients from APs that matched HE/LI (visible on the floor plan)
        setTotalWireless(records.reduce((sum, r) => sum + r.clientCount, 0));
        setTotalWired(records.reduce((sum, r) => sum + r.wiredCount, 0));
        setError(null);
        setLastUpdated(Math.floor(Date.now() / 1000));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [siteId]);

  // Immediate fetch on mount + poll every 30 seconds
  usePolling(load, THIRTY_SECONDS);

  return { aps, totalWireless, totalWired, loading, error, lastUpdated };
}

