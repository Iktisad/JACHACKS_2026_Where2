import type { Config } from '../config.js';
import type { UnifiDevice, UnifiClient, UnifiPage } from './types.js';

export class UnifiApiService {
  private readonly baseUrl: string;
  private readonly siteId: string;
  private readonly headers: Record<string, string>;

  constructor(config: Config) {
    this.baseUrl = config.UNIFI_BASE_URL;
    this.siteId = config.UNIFI_SITE_ID;
    this.headers = {
      'X-API-KEY': config.UNIFI_API_KEY,
      'Accept': 'application/json',
    };
  }

  private async getPage<T>(url: string): Promise<UnifiPage<T>> {
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`UniFi API ${res.status} ${res.statusText}: ${url}\n${body}`);
    }
    return res.json() as Promise<UnifiPage<T>>;
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const base = `${this.baseUrl}/sites/${this.siteId}${path}`;
    if (!params) return base;
    return `${base}?${new URLSearchParams(params)}`;
  }

  async fetchDevices(): Promise<UnifiDevice[]> {
    const results: UnifiDevice[] = [];
    const limit = 200;
    let offset = 0;

    while (true) {
      const url = this.buildUrl('/devices', { limit: String(limit), offset: String(offset) });
      const page = await this.getPage<UnifiDevice>(url);
      results.push(...page.data);
      offset += page.count;
      if (offset >= page.totalCount || page.count === 0) break;
    }

    console.log(`[unifi] fetched ${results.length} devices`);
    return results;
  }

  async fetchWirelessClients(): Promise<UnifiClient[]> {
    const url = this.buildUrl('/clients', { limit: '200' });
    const page = await this.getPage<UnifiClient>(url);
    const wireless = page.data.filter((c) => c.type === 'WIRELESS');
    console.log(`[unifi] fetched ${wireless.length} wireless clients (total: ${page.totalCount})`);
    return wireless;
  }
}
