import { apiFetch } from './client';
import type { Device } from '../features/history/types';

export async function fetchDevices(siteId?: string): Promise<Device[]> {
  const params: Record<string, string> = {};
  if (siteId) params['site_id'] = siteId;
  return apiFetch<Device[]>('/devices', Object.keys(params).length ? params : undefined);
}
