/** One AP's counts at a specific epoch, returned by GET /api/heatmap/timeline */
export interface TimelineSnapshot {
  ap_id: string;
  name: string;
  building: string | null;
  epoch: number;
  client_count: number;
  wired_client_count: number;
}

/** Shape returned by GET /api/heatmap/current */
export interface HeatmapAP {
  ap_id: string;
  name: string;
  building: string | null;
  client_count: number;
  wired_client_count: number;
  /** Epoch (seconds) when the server poller last captured this snapshot */
  epoch: number | null;
}

/**
 * UI-level record: one physical AP mapped to a room anchor.
 * Produced by useHeatmap() by parsing the AP name (e.g. "he041-ap-001").
 * Multiple ApRecords can share the same room — FloorPlanMap spreads them horizontally.
 */
export interface ApRecord {
  id: string;        // room id key, e.g. "he041"
  room: string;      // room number, e.g. "041"
  building: string;  // "HE" | "LI"
  apId: string;      // unique AP id within the room, e.g. "001"
  clientCount: number;
  wiredCount: number;
  status: 'online' | 'offline';
}

