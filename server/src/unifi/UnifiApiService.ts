import type { Config } from '../config.js';
import type { UnifiDevice, UnifiClient, UnifiPage, UnifiSite } from './types.js';

export class UnifiApiService {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(config: Config) {
    this.baseUrl = config.UNIFI_BASE_URL;
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

  async fetchSites(): Promise<UnifiSite[]> {
    const url = `${this.baseUrl}/sites`;
    const page = await this.getPage<UnifiSite>(url);
    console.log(`[unifi] fetched ${page.totalCount} sites`);
    return page.data;
  }

  async fetchDevices(siteId: string): Promise<UnifiDevice[]> {
    const results: UnifiDevice[] = [];
    const limit = 200;
    let offset = 0;

    while (true) {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      const url = `${this.baseUrl}/sites/${siteId}/devices?${params}`;
      const page = await this.getPage<UnifiDevice>(url);
      results.push(...page.data);
      offset += page.count;
      if (offset >= page.totalCount || page.count === 0) break;
    }

    return results;
  }

  async fetchClients(siteId: string): Promise<UnifiClient[]> {
    const results: UnifiClient[] = [];
    const limit = 200;
    let offset = 0;

    while (true) {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      const url = `${this.baseUrl}/sites/${siteId}/clients?${params}`;
      const page = await this.getPage<UnifiClient>(url);
      results.push(...page.data);
      offset += page.count;
      if (offset >= page.totalCount || page.count === 0) break;
    }

    return results;
  }
}
