import { apiFetch } from './client';
import type { HeatmapAP } from '../features/heatmap/types';

export async function fetchHeatmap(): Promise<HeatmapAP[]> {
  return apiFetch<HeatmapAP[]>('/heatmap/current');
}

