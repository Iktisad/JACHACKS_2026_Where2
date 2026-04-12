import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import type { Database } from '../db/Database.js';
import type { GeminiService, AiSpace } from '../ai/GeminiService.js';

interface FloorSpace {
  id: number;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  noiseLevel: string;
  amenities: string[];
  distance: string;
  occupancy: number;
}

const AP_REGEX = /^(he|li)(\d{3,4}[a-z]?)-ap-\d{3}$/i;

export class AiController {
  readonly router: Router;

  constructor(
    private readonly db: Database,
    private readonly gemini: GeminiService,
  ) {
    this.router = createRouter();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.post('/suggest', (req, res) => void this.suggest(req, res));
  }

  private async suggest(req: Request, res: Response): Promise<void> {
    try {
      const { building, environment, duration } = req.body as {
        building?: string;
        environment?: string;
        duration?: string;
      };

      if (!building || !environment || !duration) {
        res.status(400).json({ error: 'building, environment, and duration are required' });
        return;
      }

      const floorSpaces = await this.getLiveFloorSpaces();

      if (floorSpaces.length === 0) {
        res.status(503).json({ error: 'No space data available' });
        return;
      }

      const aiSpaces: AiSpace[] = floorSpaces.map((s) => ({
        name: s.name,
        building: s.building,
        floor: s.floor,
        capacity: s.capacity,
        noiseLevel: s.noiseLevel,
        amenities: s.amenities,
        occupancy: s.occupancy,
      }));

      const suggestion = await this.gemini.suggestSpace(
        { building, environment, duration },
        aiSpaces,
      );

      const matched =
        floorSpaces.find((s) => s.name === suggestion.spaceName) ?? floorSpaces[0]!;

      res.json({
        space: {
          id: matched.id,
          name: matched.name,
          building: matched.building,
          floor: matched.floor,
          occupancy: matched.occupancy,
          capacity: matched.capacity,
          status: this.occupancyStatus(matched.occupancy, matched.capacity),
          noiseLevel: matched.noiseLevel,
          amenities: matched.amenities,
          distance: matched.distance,
        },
        insight: suggestion.insight,
      });
    } catch (err) {
      console.error('[ai] suggest error:', err);
      res.status(500).json({ error: 'AI suggestion unavailable' });
    }
  }

  private async getLiveFloorSpaces(): Promise<FloorSpace[]> {
    const db = this.db.getKnex();
    const spaces: FloorSpace[] = [];

    try {
      const epochRow = await db('ap_snapshots')
        .select('epoch')
        .orderBy('epoch', 'desc')
        .first();

      if (!epochRow?.epoch) return spaces;

      const rows = (await db('ap_snapshots as s')
        .join('access_points as ap', 'ap.id', 's.ap_id')
        .where('s.epoch', epochRow.epoch)
        .select(
          'ap.name',
          db.raw('s.client_count + s.wired_client_count as total_clients'),
        )) as { name: string; total_clients: number }[];

      const floorMap = new Map<
        string,
        { buildingPrefix: string; floorNum: number; apCount: number; totalClients: number }
      >();

      for (const row of rows) {
        const m = AP_REGEX.exec(row.name?.toLowerCase() ?? '');
        if (!m) continue;
        const prefix = m[1]!;
        const roomStr = m[2]!;
        const roomNum = parseInt(roomStr.replace(/[a-z]/gi, ''), 10);
        const floorNum = Math.floor(roomNum / 100);
        const key = `${prefix}${floorNum}`;
        const entry = floorMap.get(key) ?? { buildingPrefix: prefix, floorNum, apCount: 0, totalClients: 0 };
        entry.apCount += 1;
        entry.totalClients += Number(row.total_clients ?? 0);
        floorMap.set(key, entry);
      }

      for (const [, data] of floorMap) {
        const isLib = data.buildingPrefix === 'li';
        const capacity = data.apCount * 30;
        const occupancy = Math.min(data.totalClients, capacity);
        spaces.push({
          id: isLib ? 100 + data.floorNum : 200 + data.floorNum,
          name: isLib
            ? `Library \u2013 ${this.floorName(data.floorNum)}`
            : `Herzberg \u2013 ${this.floorName(data.floorNum)}`,
          building: isLib ? 'Main Library' : 'Herzberg Building',
          floor: this.floorName(data.floorNum),
          capacity,
          noiseLevel: isLib ? 'Quiet' : 'Moderate',
          amenities: isLib
            ? ['wifi', 'outlets', 'quiet', 'natural-light']
            : ['wifi', 'whiteboard', 'projector'],
          distance: isLib ? '120m' : '180m',
          occupancy,
        });
      }

      spaces.sort((a, b) => a.occupancy / a.capacity - b.occupancy / b.capacity);
    } catch (err) {
      console.warn('[ai] failed to fetch live floor spaces:', err);
    }

    return spaces;
  }

  private floorName(n: number): string {
    if (n === 0) return 'Ground Floor';
    if (n === 1) return '1st Floor';
    if (n === 2) return '2nd Floor';
    if (n === 3) return '3rd Floor';
    return `${n}th Floor`;
  }

  private occupancyStatus(occupancy: number, capacity: number): 'low' | 'moderate' | 'high' {
    const ratio = capacity > 0 ? occupancy / capacity : 0;
    if (ratio < 0.4) return 'low';
    if (ratio < 0.75) return 'moderate';
    return 'high';
  }
}
