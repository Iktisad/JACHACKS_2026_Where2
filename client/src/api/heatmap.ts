import { apiFetch } from './client';
import type { HeatmapAP } from '../features/heatmap/types';

export async function fetchHeatmap(siteId?: string): Promise<HeatmapAP[]> {
  const params: Record<string, string> = {};
  if (siteId) params['site_id'] = siteId;
  return apiFetch<HeatmapAP[]>('/heatmap/current', Object.keys(params).length ? params : undefined);
}

