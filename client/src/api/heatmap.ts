import { apiFetch } from './client';
import type { HeatmapAP, TimelineSnapshot } from '../features/heatmap/types';

export interface TimelineResponse {
  epochs: number[];
  snapshots: TimelineSnapshot[];
}

export async function fetchHeatmapTimeline(params: { from: number; to: number; site_id?: string }): Promise<TimelineResponse> {
  const p: Record<string, string> = {
    from: String(params.from),
    to: String(params.to),
  };
  if (params.site_id) p['site_id'] = params.site_id;
  const res = await apiFetch<TimelineResponse>('/heatmap/timeline', p);
  // Coerce numeric fields
  return {
    epochs: res.epochs.map(Number),
    snapshots: res.snapshots.map((s) => ({
      ...s,
      epoch: Number(s.epoch),
      client_count: Number(s.client_count),
      wired_client_count: Number(s.wired_client_count),
    })),
  };
}

export async function fetchHeatmap(siteId?: string): Promise<HeatmapAP[]> {
  const params: Record<string, string> = {};
  if (siteId) params['site_id'] = siteId;
  const rows = await apiFetch<HeatmapAP[]>('/heatmap/current', Object.keys(params).length ? params : undefined);
  // SQLite returns numeric columns as strings — coerce so arithmetic works
  return rows.map((r) => ({
    ...r,
    client_count: Number(r.client_count),
    wired_client_count: Number(r.wired_client_count),
    epoch: r.epoch != null ? Number(r.epoch) : null,
  }));
}

