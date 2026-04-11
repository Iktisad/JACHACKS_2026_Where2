import { apiFetch } from './client';
import type { HistoryPoint, HistoryParams } from '../features/history/types';

export async function fetchHistory(params: HistoryParams): Promise<HistoryPoint[]> {
  const p: Record<string, string> = {};
  if (params.from !== undefined) p['from'] = String(params.from);
  if (params.to !== undefined) p['to'] = String(params.to);
  if (params.ap_id) p['ap_id'] = params.ap_id;
  return apiFetch<HistoryPoint[]>('/history', p);
}

