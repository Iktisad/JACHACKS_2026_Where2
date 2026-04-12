import type { UnifiApiService } from '../unifi/UnifiApiService.js';
import type { Database } from '../db/Database.js';

export class PollerService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly INTERVAL_MS = 5 * 60 * 1000;

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
      const sites = await this.unifiApi.fetchSites();
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

    // 2. Fetch wireless clients, group by uplinkDeviceId
    const clients = await this.unifiApi.fetchWirelessClients(siteId);
    const countById = new Map<string, number>();
    for (const c of clients) {
      countById.set(c.uplinkDeviceId, (countById.get(c.uplinkDeviceId) ?? 0) + 1);
    }

    // 3. Bulk insert ap_snapshots
    const snapshots = aps.map((ap) => ({
      ap_id: ap.id,
      client_count: countById.get(ap.id) ?? 0,
      epoch,
    }));
    if (snapshots.length > 0) await db('ap_snapshots').insert(snapshots);

    // 4. Insert site_snapshot
    const totalClients = [...countById.values()].reduce((a, b) => a + b, 0);
    await db('site_snapshots').insert({
      total_clients: totalClients,
      epoch,
      site_id: siteId,
      site_name: siteName,
    });

    console.log(`[poller]  ${siteName}: ${aps.length} APs, ${totalClients} wireless clients`);
  }

  private getBuilding(name: string): string {
    const n = name.toLowerCase();
    if (n.startsWith('li')) return 'Library';
    if (n.startsWith('he')) return 'Herzberg';
    return 'Unknown';
  }
}
