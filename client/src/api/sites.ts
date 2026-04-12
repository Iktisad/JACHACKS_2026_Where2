import { apiFetch } from './client';

export interface Site {
  id: string;
  name: string;
}

export async function fetchSites(): Promise<Site[]> {
  return apiFetch<Site[]>('/sites');
}
