// Standalone verification script — not imported anywhere
// Run: cd server && npx tsx --env-file=../.env src/unifi/test-api.ts

import { Config } from '../config.js';
import { UnifiApiService } from './UnifiApiService.js';

const config = Config.getInstance();
const api = new UnifiApiService(config);

console.log('--- Devices ---');
const sites = await api.fetchSites();
console.log(`Sites: ${sites.map((s) => s.name).join(', ')}`);

const siteId = sites[0]!.id;
const devices = await api.fetchDevices(siteId);
const aps = devices.filter((d) => d.features.includes('accessPoint'));
console.log(`Total devices: ${devices.length}, Access Points: ${aps.length}`);
if (aps.length > 0) {
  const sample = aps[0]!;
  console.log(`Sample AP: ${sample.name} (${sample.model}) — id: ${sample.id}`);
}

console.log('\n--- Wireless Clients ---');
const clients = await api.fetchClients(siteId);
console.log(`Wireless clients: ${clients.length}`);
if (clients.length > 0) {
  const sample = clients[0]!;
  console.log(`Sample client uplinkDeviceId: ${sample.uplinkDeviceId}`);
  const linkedAp = aps.find((ap) => ap.id === sample.uplinkDeviceId);
  console.log(`Linked AP: ${linkedAp ? linkedAp.name : '(not in AP list)'}`);
}

console.log('\n✅ API verification complete');
