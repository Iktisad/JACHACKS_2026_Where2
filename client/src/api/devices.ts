import { apiFetch } from './client';

export interface Device {
  id: string;
  mac_address: string;
  name: string;
  model: string;
  building: string;
  site_id?: string;
  updated_at: string;
}

export async function fetchDevices(siteId?: string): Promise<Device[]> {
  const params: Record<string, string> = {};
  if (siteId) params['site_id'] = siteId;
  return apiFetch<Device[]>('/devices', Object.keys(params).length ? params : undefined);
}
