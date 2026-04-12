import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, LocateFixed, AlertCircle, Building2, Users } from 'lucide-react';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { useHeatmap } from '../../features/heatmap/useHeatmap';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BUILDINGS = [
  {
    code: 'LI',
    name: 'Library',
    fullName: 'John Abbott Library',
    lat: 45.40639448283585,
    lng: -73.94198129672654,
    floors: ['M', '0', '1', '2', '3'],
  },
  {
    code: 'HE',
    name: 'Herzberg',
    fullName: 'Herzberg Building',
    lat: 45.405938,
    lng: -73.941918,
    floors: ['0', '1', '2', '3', '4'],
  },
];

const MAX_DEVICES_PER_AP = 30;

function getOccupancyStatus(clientCount: number, apCount: number): { label: string; color: string; barColor: string; dotClass: string; pct: number } {
  if (apCount === 0) return { label: 'Empty', color: '#166534', barColor: 'var(--status-low)', dotClass: 'bg-[var(--status-low)]', pct: 0 };
  const pct = Math.min(clientCount / (apCount * MAX_DEVICES_PER_AP), 1);
  if (pct === 0) return { label: 'Empty',    color: '#166534', barColor: 'var(--status-low)',      dotClass: 'bg-[var(--status-low)]',      pct };
  if (pct <= 0.4) return { label: 'Low',      color: '#166534', barColor: 'var(--status-low)',      dotClass: 'bg-[var(--status-low)]',      pct };
  if (pct <= 0.7) return { label: 'Moderate', color: '#92400e', barColor: 'var(--status-moderate)', dotClass: 'bg-[var(--status-moderate)]', pct };
  return              { label: 'High',     color: '#991b1b', barColor: 'var(--status-high)',     dotClass: 'bg-[var(--status-high)]',     pct };
}

const buildingIcon = (clientCount: number, apCount: number) => {
  const { color } = getOccupancyStatus(clientCount, apCount);
  return L.divIcon({
    className: '',
    html: `<div style="
      width:44px;height:44px;
      border-radius:14px;
      background:${color};
      border:3px solid white;
      box-shadow:0 2px 12px rgba(0,0,0,0.28);
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;
    ">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
        <path d="M9 22v-4h6v4"/>
        <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
      </svg>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -26],
  });
};

const userIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:18px;height:18px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(26,94,58,0.25);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
    <div style="position:absolute;inset:3px;border-radius:50%;background:#1a5e3a;border:2.5px solid white;box-shadow:0 0 0 2px rgba(26,94,58,0.35);"></div>
  </div>
  <style>@keyframes ping{75%,100%{transform:scale(2.4);opacity:0;}}</style>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const JOHN_ABBOTT_CENTER: [number, number] = [45.4063, -73.9421];

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      map.setView([lat, lng], 18, { animate: true });
      initialized.current = true;
    } else {
      map.panTo([lat, lng], { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

function LocateMeButton({ userPos }: { userPos: { lat: number; lng: number } | null }) {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={() => {
        if (userPos) map.flyTo([userPos.lat, userPos.lng], 18, { animate: true, duration: 0.9 });
      }}
      disabled={!userPos}
      className="absolute bottom-4 right-4 z-[1000] w-11 h-11 rounded-full shadow-md flex items-center justify-center transition-colors disabled:opacity-40 border"
      style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
      title="Center on my location"
    >
      <LocateFixed className="w-4 h-4" strokeWidth={1.8} />
    </button>
  );
}

function distanceTo(userPos: { lat: number; lng: number } | null, lat: number, lng: number): string {
  if (!userPos) return '—';
  const R = 6371000;
  const dLat = ((lat - userPos.lat) * Math.PI) / 180;
  const dLng = ((lng - userPos.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userPos.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`;
}

export function MapView() {
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  const { aps, refreshing, polledAt } = useHeatmap();

  // Aggregate live client counts and AP count per building
  const buildingClients = BUILDINGS.map((b) => {
    const buildingAps = aps.filter((ap) => ap.building === b.code);
    const count = buildingAps.reduce((sum, ap) => sum + ap.clientCount, 0);
    return { ...b, clientCount: count, apCount: buildingAps.length };
  });

  useEffect(() => {
    if (!navigator.geolocation) { setGeoError('Geolocation is not supported by your browser.'); return; }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => { setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setAccuracy(Math.round(pos.coords.accuracy)); setGeoError(null); },
      (err) => {
        if (err.code === 1) setGeoError('Location access denied. Enable it in browser settings.');
        else if (err.code === 2) setGeoError('Position unavailable. Try moving outdoors.');
        else setGeoError('Could not get your location.');
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const totalClients = buildingClients.reduce((s, b) => s + b.clientCount, 0);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? buildingClients.filter((b) => b.name.toLowerCase().includes(q) || b.fullName.toLowerCase().includes(q) || b.code.toLowerCase().includes(q))
    : buildingClients;

  return (
    <div className="flex flex-col" style={{ background: 'var(--background)', height: isDesktop ? '100vh' : 'calc(100dvh - 64px)' }}>
      <div className="flex-1 relative min-h-0">
        {/* Search bar */}
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          <div className="relative rounded-2xl shadow-md border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.8} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search buildings…"
              className="w-full pl-11 pr-4 py-3 bg-transparent rounded-2xl text-[14px] focus:outline-none"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
        </div>

        {geoError && (
          <div className="absolute top-[68px] left-4 right-4 z-[1000] flex items-start gap-2 rounded-xl px-4 py-2.5 text-[13px] border" style={{ background: 'color-mix(in srgb, var(--destructive) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--destructive) 25%, transparent)', color: 'var(--destructive)' }}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.8} />
            {geoError}
          </div>
        )}

        {accuracy !== null && !geoError && (
          <div className="absolute top-[68px] right-4 z-[1000] rounded-full px-2.5 py-1 text-[11px] shadow border" style={{ background: 'color-mix(in srgb, var(--card) 90%, transparent)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
            GPS ±{accuracy}m
          </div>
        )}

        <MapContainer center={JOHN_ABBOTT_CENTER} zoom={17} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filtered.map((building) => (
            <Marker
              key={building.code}
              position={[building.lat, building.lng]}
              icon={buildingIcon(building.clientCount, building.apCount)}
              eventHandlers={{
                click: () => navigate(`/student/building/${building.code}`),
              }}
            >
              <Popup>
                <div className="min-w-[160px] p-1">
                  <p className="font-semibold text-[13px]">{building.fullName}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    Occupancy: {getOccupancyStatus(building.clientCount, building.apCount).label}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                    {building.floors.length} floors · {building.apCount} access points
                  </p>
                  {userPos && <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{distanceTo(userPos, building.lat, building.lng)} away</p>}
                  <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--primary)' }}>Tap to view heatmap →</p>
                </div>
              </Popup>
            </Marker>
          ))}
          {userPos && (
            <>
              <RecenterMap lat={userPos.lat} lng={userPos.lng} />
              <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />
              {accuracy && <Circle center={[userPos.lat, userPos.lng]} radius={accuracy} pathOptions={{ color: '#1a5e3a', fillColor: '#1a5e3a', fillOpacity: 0.07, weight: 1 }} />}
            </>
          )}
          <LocateMeButton userPos={userPos} />
        </MapContainer>
      </div>

      {/* Bottom panel — building cards */}
      <div className="shrink-0 border-t shadow-2xl" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[15px] font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>
                Campus Buildings
              </h3>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Tap a marker on the map to view live occupancy
                {polledAt && (
                  <span> · Data from {new Date(polledAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-low)] inline-block" />
                  Low
                </span>
                <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-moderate)] inline-block" />
                  Moderate
                </span>
                <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-high)] inline-block" />
                  High
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {refreshing && (
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
              )}
              <Users className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.7} />
              <span className="text-[13px] font-medium tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                {totalClients} online
              </span>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {filtered.length === 0 && (
              <p className="text-[13px] py-3 px-1" style={{ color: 'var(--muted-foreground)' }}>No buildings match "{query}".</p>
            )}
            {filtered.map((building) => {
              const status = getOccupancyStatus(building.clientCount, building.apCount);
              return (
                <div
                  key={building.code}
                  className="flex-1 min-w-40 rounded-xl p-3.5 border"
                  style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}>
                      <Building2 className="w-5 h-5" style={{ color: 'var(--primary)' }} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-[14px] leading-snug" style={{ color: 'var(--foreground)' }}>{building.name}</h4>
                      <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                        {building.floors.length} floors
                        {userPos ? ` · ${distanceTo(userPos, building.lat, building.lng)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className={`w-2 h-2 rounded-full ${status.dotClass}`} />
                    <span className="text-[12px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
                      {building.apCount === 0 ? 'Loading…' : status.label}
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.round(status.pct * 100)}%`, background: status.barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
