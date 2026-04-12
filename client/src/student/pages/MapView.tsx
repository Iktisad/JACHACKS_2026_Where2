import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, Wifi, Zap, Volume2, LocateFixed, AlertCircle, ChevronRight } from 'lucide-react';
import { useIsDesktop } from '../hooks/useMediaQuery';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STATUS_COLOR: Record<string, string> = {
  low: '#166534',
  moderate: '#92400e',
  high: '#991b1b',
};

const pinIcon = (status: string) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:34px;height:34px;
      border-radius:50%;
      background:${STATUS_COLOR[status] ?? '#64748b'};
      border:3px solid white;
      box-shadow:0 2px 10px rgba(0,0,0,0.28);
      display:flex;align-items:center;justify-content:center;
    "><div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.8);"></div></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });

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

const studySpaces = [
  { id: 1, name: 'Casgrain Theatre',  building: 'Casgrain',   lat: 45.405811171962945, lng: -73.94302253465993, occupancy: 3,  capacity: 20, status: 'low',      amenities: ['wifi','outlets','quiet'] },
  { id: 2, name: 'Library 3F',        building: 'Library',    lat: 45.40639448283585,  lng: -73.94198129672654, occupancy: 28, capacity: 35, status: 'moderate',  amenities: ['wifi','outlets','whiteboard'] },
  { id: 3, name: 'Hochelaga 105',     building: 'Hochelaga',  lat: 45.4069030506363,   lng: -73.94121696359888, occupancy: 8,  capacity: 25, status: 'low',       amenities: ['wifi','whiteboard'] },
  { id: 4, name: 'Herzberg 301',      building: 'Herzberg',   lat: 45.405938,          lng: -73.941918,          occupancy: 22, capacity: 25, status: 'high',      amenities: ['wifi','outlets'] },
  { id: 5, name: 'Laird Hall',        building: 'Laird',      lat: 45.40655864982783,  lng: -73.93992655464686, occupancy: 10, capacity: 30, status: 'low',       amenities: ['wifi','quiet'] },
  { id: 6, name: 'Stewart Hall',      building: 'Stewart',    lat: 45.40553453530918,  lng: -73.94107401858304, occupancy: 15, capacity: 30, status: 'moderate',  amenities: ['wifi','outlets','whiteboard'] },
];

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

const statusDot: Record<string, string> = {
  low: 'bg-[var(--status-low)]',
  moderate: 'bg-[var(--status-moderate)]',
  high: 'bg-[var(--status-high)]',
};
const statusBar: Record<string, string> = {
  low: 'bg-[var(--status-low)]',
  moderate: 'bg-[var(--status-moderate)]',
  high: 'bg-[var(--status-high)]',
};
const statusLabel: Record<string, string> = {
  low: 'Available',
  moderate: 'Moderate',
  high: 'Busy',
};

export function MapView() {
  const isDesktop = useIsDesktop();
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [query, setQuery] = useState('');

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

  const totalOccupancy = studySpaces.reduce((s, r) => s + r.occupancy, 0);
  const totalCapacity  = studySpaces.reduce((s, r) => s + r.capacity, 0);
  const occupancyPct   = Math.round((totalOccupancy / totalCapacity) * 100);

  const q = query.trim().toLowerCase();
  const filteredSpaces = q ? studySpaces.filter((s) => s.name.toLowerCase().includes(q) || s.building.toLowerCase().includes(q) || s.status.toLowerCase().includes(q) || s.amenities.some((a) => a.toLowerCase().includes(q))) : studySpaces;

  const sortedSpaces = userPos
    ? [...filteredSpaces].sort((a, b) => parseFloat(distanceTo(userPos, a.lat, a.lng)) - parseFloat(distanceTo(userPos, b.lat, b.lng)))
    : filteredSpaces;

  return (
    <div className="flex flex-col" style={{ background: 'var(--background)', height: isDesktop ? '100vh' : 'calc(100vh - 60px)' }}>
      <div className="flex-1 relative min-h-0">
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          <div className="relative rounded-2xl shadow-md border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.8} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search spaces, buildings…"
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

        {accuracy !== null && (
          <div className="absolute top-[68px] right-4 z-[1000] rounded-full px-2.5 py-1 text-[11px] shadow border" style={{ background: 'color-mix(in srgb, var(--card) 90%, transparent)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
            GPS ±{accuracy}m
          </div>
        )}

        <MapContainer center={JOHN_ABBOTT_CENTER} zoom={17} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredSpaces.map((space) => (
            <Marker key={space.id} position={[space.lat, space.lng]} icon={pinIcon(space.status)}>
              <Popup>
                <div className="min-w-[148px] p-1">
                  <p className="font-semibold text-[13px]">{space.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{space.occupancy}/{space.capacity} occupied</p>
                  {userPos && <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{distanceTo(userPos, space.lat, space.lng)} away</p>}
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

      <div className="shrink-0 border-t shadow-2xl" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[15px] font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>
                {q ? `${filteredSpaces.length} result${filteredSpaces.length !== 1 ? 's' : ''} found` : `${studySpaces.filter((s) => s.status !== 'high').length} spots open nearby`}
              </h3>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>John Abbott College</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-14 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div
                  className={`h-full rounded-full ${occupancyPct >= 75 ? 'bg-[var(--status-moderate)]' : 'bg-[var(--status-low)]'}`}
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>
              <span className="text-[13px] font-medium tabular-nums" style={{ color: 'var(--muted-foreground)' }}>{occupancyPct}%</span>
            </div>
          </div>

          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {sortedSpaces.length === 0 && (
              <p className="text-[13px] py-3 px-1" style={{ color: 'var(--muted-foreground)' }}>No spaces match "{query}".</p>
            )}
            {sortedSpaces.map((space) => (
              <Link key={space.id} to={`/student/space/${space.id}`} className="flex-shrink-0 w-52 rounded-xl p-3 border transition-colors" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-[13px] leading-snug truncate mb-0.5" style={{ color: 'var(--foreground)' }}>{space.name}</h4>
                    <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{distanceTo(userPos, space.lat, space.lng)} away</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusDot[space.status]}`} />
                    <span className="text-[10px] font-medium" style={{ color: 'var(--muted-foreground)' }}>{statusLabel[space.status]}</span>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className={`h-full rounded-full ${statusBar[space.status]}`} style={{ width: `${(space.occupancy / space.capacity) * 100}%` }} />
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--muted-foreground)' }}>{space.occupancy}/{space.capacity} seats</p>
                </div>
                <div className="flex gap-1.5 items-center">
                  {space.amenities.includes('wifi') && <div className="w-6 h-6 rounded-lg flex items-center justify-center border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}><Wifi className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.7} /></div>}
                  {space.amenities.includes('outlets') && <div className="w-6 h-6 rounded-lg flex items-center justify-center border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}><Zap className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.7} /></div>}
                  {space.amenities.includes('quiet') && <div className="w-6 h-6 rounded-lg flex items-center justify-center border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}><Volume2 className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.7} /></div>}
                  <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 50%, transparent)' }} strokeWidth={1.5} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
