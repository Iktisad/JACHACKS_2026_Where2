import { useState, useCallback, useRef } from 'react';
import { fetchHeatmap } from '../../api/heatmap';
import { usePolling } from '../../shared/hooks/usePolling';
import type { HeatmapAP, ApRecord } from './types';

const THIRTY_SECONDS = 30_000;

/**
 * Parse AP device name into its building/room/apId components.
 * Expected format: "he041-ap-001", "li102-ap-002", or with letter suffix "he200a-ap-001" (case-insensitive).
 * Returns null if the name does not match the convention.
 */
function parseApName(name: string): { building: string; room: string; apId: string } | null {
  const m = name.match(/^(he|li)(\d{3,4}[a-z]?)-ap-(\d{3})$/i);
  if (!m) return null;
  return {
    building: m[1].toUpperCase(),  // "he" → "HE"
    room: m[2].toLowerCase(),       // "200A" → "200a"
    apId: m[3],                     // "001"
  };
}

/** Convert a raw API HeatmapAP into a UI ApRecord. Returns null if name cannot be parsed. */
function toApRecord(ap: HeatmapAP): ApRecord | null {
  const parsed = parseApName(ap.name);
  if (!parsed) return null;
  return {
    id: `${parsed.building.toLowerCase()}${parsed.room}`, // e.g. "he041", "he200a"
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
  /** True only on the very first load (no data yet). False during subsequent refreshes. */
  loading: boolean;
  /** True while a background refresh is in progress (data is still shown). */
  refreshing: boolean;
  error: string | null;
  /** Epoch (seconds) when the server poller last captured the data. */
  polledAt: number | null;
}

export function useHeatmap(siteId?: string): UseHeatmapResult {
  const [aps, setAps] = useState<ApRecord[]>([]);
  const [totalWireless, setTotalWireless] = useState(0);
  const [totalWired, setTotalWired] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polledAt, setPolledAt] = useState<number | null>(null);
  const hasFetched = useRef(false);

  const load = useCallback(() => {
    // On subsequent fetches, signal a background refresh instead of full loading
    if (hasFetched.current) {
      setRefreshing(true);
    }

    fetchHeatmap(siteId)
      .then((data: HeatmapAP[]) => {
        const records = data.flatMap((ap) => {
          const record = toApRecord(ap);
          return record ? [record] : [];
        });
        setAps(records);
        setTotalWireless(records.reduce((sum, r) => sum + r.clientCount, 0));
        setTotalWired(records.reduce((sum, r) => sum + r.wiredCount, 0));
        setError(null);
        // Derive polledAt from the max epoch across all APs
        const maxEpoch = data.reduce((max, ap) => {
          const e = ap.epoch ?? 0;
          return e > max ? e : max;
        }, 0);
        setPolledAt(maxEpoch || null);
        hasFetched.current = true;
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [siteId]);

  // Immediate fetch on mount + poll every 30 seconds
  usePolling(load, THIRTY_SECONDS);

  return { aps, totalWireless, totalWired, loading, refreshing, error, polledAt };
}

