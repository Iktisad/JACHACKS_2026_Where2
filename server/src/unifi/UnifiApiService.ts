// Stub — implemented in Phase 3
import type { Config } from '../config.js';
import type { UnifiDevice, UnifiClient, UnifiPage } from './types.js';

export class UnifiApiService {
  private readonly baseUrl: string;
  private readonly siteId: string;
  private readonly headers: Record<string, string>;

  constructor(private readonly config: Config) {
    this.baseUrl = config.UNIFI_BASE_URL;
    this.siteId = config.UNIFI_SITE_ID;
    this.headers = {
      'X-API-KEY': config.UNIFI_API_KEY,
      'Accept': 'application/json',
    };
  }

  private async getPage<T>(url: string): Promise<UnifiPage<T>> {
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) throw new Error(`UniFi API ${res.status}: ${url}`);
    return res.json() as Promise<UnifiPage<T>>;
  }

  // Implemented in Phase 3: paginates until all devices are fetched
  async fetchDevices(): Promise<UnifiDevice[]> {
    console.log('[unifi] stub fetchDevices');
    return [];
  }

  // Implemented in Phase 3: fetches wireless clients with filter
  async fetchWirelessClients(): Promise<UnifiClient[]> {
    console.log('[unifi] stub fetchWirelessClients');
    return [];
  }

  // Expose for use in Phase 3 implementation
  protected getPageFn<T>(): (url: string) => Promise<UnifiPage<T>> {
    return (url) => this.getPage<T>(url);
  }

  protected buildUrl(path: string, params?: Record<string, string>): string {
    const base = `${this.baseUrl}/sites/${this.siteId}${path}`;
    if (!params) return base;
    return `${base}?${new URLSearchParams(params)}`;
  }
}
