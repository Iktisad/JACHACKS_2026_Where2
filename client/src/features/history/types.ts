export interface HistoryPoint {
  epoch: number;
  client_count: number;
  wired_client_count?: number;
}

export interface HistoryParams {
  from?: number;
  to?: number;
  site_id?: string;
}

