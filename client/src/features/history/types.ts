export interface HistoryPoint {
  epoch: number;
  client_count: number;
}

export interface HistoryParams {
  from?: number;
  to?: number;
  ap_id?: string;
  site_id?: string;
}

export interface Device {
  id: string;
  name: string;
  building: string | null;
}

