import { apiFetch } from './client';
import type { HistoryPoint, HistoryParams } from '../features/history/types';

export async function fetchHistory(params: HistoryParams): Promise<HistoryPoint[]> {
  const p: Record<string, string> = {};
  if (params.from !== undefined) p['from'] = String(params.from);
  if (params.to !== undefined) p['to'] = String(params.to);
  if (params.site_id) p['site_id'] = params.site_id;
  const rows = await apiFetch<HistoryPoint[]>('/history', p);
  // Database drivers may return numeric columns as strings — coerce to numbers
  // so Recharts can plot them correctly on the Y axis.
  return rows.map((r) => ({
    epoch: Number(r.epoch),
    client_count: Number(r.client_count),
    ...(r.wired_client_count !== undefined && r.wired_client_count !== null
      ? { wired_client_count: Number(r.wired_client_count) }
      : {}),
  }));
}
