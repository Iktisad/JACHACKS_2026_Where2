import type { UnifiApiService } from '../unifi/UnifiApiService.js';
import type { Database } from '../db/Database.js';

export class PollerService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly INTERVAL_MS = 5 * 60 * 1000;
  private readonly RETENTION_SECONDS = 30 * 24 * 60 * 60; // 30 days

  constructor(
    private readonly unifiApi: UnifiApiService,
    private readonly db: Database,
  ) {}

  start(): void {
    void this.tick();
    this.intervalId = setInterval(() => void this.tick(), this.INTERVAL_MS);
    console.log('[poller] started (every 5 min)');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[poller] stopped');
    }
  }

  private async tick(): Promise<void> {
    try {
      const rawSites = await this.unifiApi.fetchSites();
      // UniFi API may return duplicate sites — deduplicate by ID
      const seen = new Set<string>();
      const sites = rawSites.filter((s) => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });
      const epoch = Math.floor(Date.now() / 1000);
      const summaries: string[] = [];

      for (const site of sites) {
        try {
          await this.tickSite(site.id, site.name, epoch);
          summaries.push(site.name);
        } catch (err) {
          console.error(`[poller] error on site "${site.name}":`, err);
        }
      }

      // Prune snapshots older than 30 days
      const cutoff = epoch - this.RETENTION_SECONDS;
      const db = this.db.getKnex();
      const deletedSite = await db('site_snapshots').where('epoch', '<', cutoff).delete();
      const deletedAp = await db('ap_snapshots').where('epoch', '<', cutoff).delete();
      if (deletedSite + deletedAp > 0) {
        console.log(`[poller] pruned ${deletedSite} site_snapshots, ${deletedAp} ap_snapshots older than 30 days`);
      }

      console.log(`[poller] tick complete — sites: ${summaries.join(', ')}`);
    } catch (err) {
      console.error('[poller] tick error:', err);
    }
  }

  private async tickSite(siteId: string, siteName: string, epoch: number): Promise<void> {
    const db = this.db.getKnex();

    // 1. Fetch devices, filter to APs, upsert access_points
    const devices = await this.unifiApi.fetchDevices(siteId);
    const aps = devices.filter((d) => d.features.includes('accessPoint'));

    for (const ap of aps) {
      await db('access_points')
        .insert({
          id: ap.id,
          mac_address: ap.macAddress,
          name: ap.name,
          model: ap.model,
          building: this.getBuilding(ap.name),
          site_id: siteId,
          site_name: siteName,
          updated_at: new Date().toISOString(),
        })
        .onConflict('id')
        .merge(['mac_address', 'name', 'model', 'building', 'site_id', 'site_name', 'updated_at']);
    }

    // 2. Fetch all clients, split by type
    const clients = await this.unifiApi.fetchClients(siteId);
    const wirelessById = new Map<string, number>();
    const wiredById = new Map<string, number>();
    for (const c of clients) {
      if (c.type === 'WIRELESS') {
        wirelessById.set(c.uplinkDeviceId, (wirelessById.get(c.uplinkDeviceId) ?? 0) + 1);
      } else {
        wiredById.set(c.uplinkDeviceId, (wiredById.get(c.uplinkDeviceId) ?? 0) + 1);
      }
    }

    // 3. Insert ap_snapshots time-series — one row per (ap_id, epoch)
    const snapshots = aps.map((ap) => ({
      ap_id: ap.id,
      client_count: wirelessById.get(ap.id) ?? 0,
      wired_client_count: wiredById.get(ap.id) ?? 0,
      epoch,
    }));
    if (snapshots.length > 0) {
      await db('ap_snapshots').insert(snapshots).onConflict(['ap_id', 'epoch']).ignore();
    }

    // 4. Insert site_snapshot (time-series for history chart)
    const totalWireless = [...wirelessById.values()].reduce((a, b) => a + b, 0);
    const totalWired = [...wiredById.values()].reduce((a, b) => a + b, 0);
    await db('site_snapshots').insert({
      wireless_clients: totalWireless,
      wired_clients: totalWired,
      epoch,
      site_id: siteId,
    }).onConflict(['site_id', 'epoch']).ignore();

    console.log(`[poller]  ${siteName}: ${aps.length} APs, ${totalWireless} wireless + ${totalWired} wired clients`);
  }

  private getBuilding(name: string): string {
    const n = name.toLowerCase();
    if (n.startsWith('li')) return 'Library';
    if (n.startsWith('he')) return 'Herzberg';
    return 'Unknown';
  }
}
