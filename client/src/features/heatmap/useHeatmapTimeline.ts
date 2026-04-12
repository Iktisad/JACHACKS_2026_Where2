import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchHeatmapTimeline } from '../../api/heatmap';
import type { ApRecord, TimelineSnapshot } from './types';

function parseApName(name: string): { building: string; room: string; apId: string } | null {
  const m = name.match(/^(he|li)(\d{3,4})-ap-(\d{3})$/i);
  if (!m) return null;
  return { building: m[1].toUpperCase(), room: m[2], apId: m[3] };
}

function snapshotsToApRecords(snapshots: TimelineSnapshot[]): ApRecord[] {
  return snapshots.flatMap((s) => {
    const parsed = parseApName(s.name);
    if (!parsed) return [];
    return [{
      id: `${parsed.building.toLowerCase()}${parsed.room}`,
      room: parsed.room,
      building: parsed.building,
      apId: parsed.apId,
      clientCount: s.client_count,
      wiredCount: s.wired_client_count,
      status: 'online' as const,
    }];
  });
}

interface UseHeatmapTimelineResult {
  epochs: number[];
  apsByEpoch: Map<number, ApRecord[]>;
  loading: boolean;
  error: string | null;
}

export function useHeatmapTimeline(
  from: number,
  to: number,
  siteId?: string,
): UseHeatmapTimelineResult {
  const [epochs, setEpochs] = useState<number[]>([]);
  const [snapshots, setSnapshots] = useState<TimelineSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    // Skip when timeline mode is inactive (from === 0 sentinel)
    if (from === 0) {
      setEpochs([]);
      setSnapshots([]);
      return;
    }
    setLoading(true);
    fetchHeatmapTimeline({ from, to, site_id: siteId })
      .then((res) => {
        setEpochs(res.epochs);
        setSnapshots(res.snapshots);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [from, to, siteId]);

  useEffect(() => { load(); }, [load]);

  // Group snapshots by epoch → ApRecord[] in a single pass
  const apsByEpoch = useMemo(() => {
    const grouped = new Map<number, TimelineSnapshot[]>();
    for (const s of snapshots) {
      const arr = grouped.get(s.epoch);
      if (arr) arr.push(s);
      else grouped.set(s.epoch, [s]);
    }
    const map = new Map<number, ApRecord[]>();
    for (const [epoch, group] of grouped) {
      map.set(epoch, snapshotsToApRecords(group));
    }
    return map;
  }, [snapshots]);

  return { epochs, apsByEpoch, loading, error };
}
