import { apiFetch } from './client';
import type { Device } from '../features/history/types';

export async function fetchDevices(): Promise<Device[]> {
  return apiFetch<Device[]>('/devices');
}

