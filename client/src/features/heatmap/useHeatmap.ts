import { useState, useCallback, useEffect } from 'react';
import { fetchHeatmap } from '../../api/heatmap';
import { usePolling } from '../../shared/hooks/usePolling';
import type { HeatmapAP, ApRecord } from './types';

const THIRTY_SECONDS = 30_000;
const CACHE_KEY = 'heatmap-snapshot';

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

/* ── localStorage cache ─────────────────────────────────────────── */

interface Snapshot {
  aps: ApRecord[];
  totalWireless: number;
  totalWired: number;
  polledAt: number | null;
}

function cacheKey(siteId?: string): string {
  return siteId ? `${CACHE_KEY}:${siteId}` : CACHE_KEY;
}

function readCache(siteId?: string): Snapshot | null {
  try {
    const raw = localStorage.getItem(cacheKey(siteId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(snap: Snapshot, siteId?: string): void {
  try {
    localStorage.setItem(cacheKey(siteId), JSON.stringify(snap));
  } catch { /* quota exceeded — ignore */ }
}

/* ── Hook ───────────────────────────────────────────────────────── */

interface UseHeatmapResult {
  aps: ApRecord[];
  totalWireless: number;
  totalWired: number;
  /** Always false — kept for interface compat. */
  loading: boolean;
  /** True while a background refresh is in progress (data is still shown). */
  refreshing: boolean;
  error: string | null;
  /** Epoch (seconds) when the server poller last captured the data being shown. */
  polledAt: number | null;
}

export function useHeatmap(siteId?: string): UseHeatmapResult {
  // Seed state from the localStorage cache so the UI is never empty on load.
  const cached = readCache(siteId);

  const [aps, setAps] = useState<ApRecord[]>(cached?.aps ?? []);
  const [totalWireless, setTotalWireless] = useState(cached?.totalWireless ?? 0);
  const [totalWired, setTotalWired] = useState(cached?.totalWired ?? 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polledAt, setPolledAt] = useState<number | null>(cached?.polledAt ?? null);

  // When siteId changes, restore that site's cached snapshot immediately.
  useEffect(() => {
    const snap = readCache(siteId);
    if (snap && snap.totalWireless + snap.totalWired > 0) {
      setAps(snap.aps);
      setTotalWireless(snap.totalWireless);
      setTotalWired(snap.totalWired);
      setPolledAt(snap.polledAt);
    }
  }, [siteId]);

  const load = useCallback(() => {
    setRefreshing(true);

    fetchHeatmap(siteId)
      .then((data: HeatmapAP[]) => {
        const records = data.flatMap((ap) => {
          const record = toApRecord(ap);
          return record ? [record] : [];
        });
        const newWireless = records.reduce((sum, r) => sum + r.clientCount, 0);
        const newWired = records.reduce((sum, r) => sum + r.wiredCount, 0);
        const maxEpoch = data.reduce((max, ap) => {
          const e = ap.epoch ?? 0;
          return e > max ? e : max;
        }, 0);

        // Only update when the displayed APs have real client data.
        // While the poller is mid-fetch (~2 min), the backend may serve
        // an older epoch where Herzberg/Library had zero clients.
        // Keep showing the previous good snapshot + its timestamp instead.
        if (newWireless + newWired > 0 || records.length === 0) {
          setAps(records);
          setTotalWireless(newWireless);
          setTotalWired(newWired);
          setPolledAt(maxEpoch || null);
          writeCache(
            { aps: records, totalWireless: newWireless, totalWired: newWired, polledAt: maxEpoch || null },
            siteId,
          );
        }

        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => {
        setRefreshing(false);
      });
  }, [siteId]);

  // Immediate fetch on mount + poll every 30 seconds
  usePolling(load, THIRTY_SECONDS);

  return { aps, totalWireless, totalWired, loading: false, refreshing, error, polledAt };
}
