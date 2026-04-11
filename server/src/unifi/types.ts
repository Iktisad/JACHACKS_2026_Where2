// Verified shapes from live UniFi API v1

export interface UnifiDevice {
  id: string;
  macAddress: string;
  ipAddress: string;
  name: string;
  model: string;
  state: 'ONLINE' | 'OFFLINE' | string;
  supported: boolean;
  firmwareVersion: string;
  firmwareUpdatable: boolean;
  features: string[];   // contains "accessPoint" for APs
  interfaces: string[]; // contains "radios" for APs
}

export interface UnifiClient {
  type: 'WIRELESS' | 'WIRED';
  id: string;
  name: string;
  connectedAt: string;    // ISO 8601
  ipAddress: string;
  macAddress: string;
  uplinkDeviceId: string; // UUID — matches UnifiDevice.id
  access: { type: string };
}

export interface UnifiPage<T> {
  offset: number;
  limit: number;
  count: number;
  totalCount: number;
  data: T[];
}
