import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import type { Database } from '../db/Database.js';
import type { GeminiService, AiSpace } from '../ai/GeminiService.js';

interface SpaceCatalogEntry {
  id: number;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  noiseLevel: string;
  amenities: string[];
  distance: string;
  // building keywords present in the access_points.building column
  dbBuildingKeywords: string[];
}

const SPACES_CATALOG: SpaceCatalogEntry[] = [
  {
    id: 2,
    name: 'Library 3F',
    building: 'Main Library',
    floor: '3rd Floor',
    capacity: 35,
    noiseLevel: 'Quiet',
    amenities: ['wifi', 'outlets', 'quiet', 'natural-light'],
    distance: '120m',
    dbBuildingKeywords: ['library', 'lib'],
  },
  {
    id: 3,
    name: 'Hochelaga 105',
    building: 'Hochelaga Wing',
    floor: '1st Floor',
    capacity: 25,
    noiseLevel: 'Moderate',
    amenities: ['wifi', 'whiteboard', 'projector'],
    distance: '200m',
    dbBuildingKeywords: ['hochelaga', 'hoch'],
  },
];

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

      const clientCounts = await this.getLiveClientCounts();

      const aiSpaces: AiSpace[] = SPACES_CATALOG.map((entry) => ({
        name: entry.name,
        building: entry.building,
        floor: entry.floor,
        capacity: entry.capacity,
        noiseLevel: entry.noiseLevel,
        amenities: entry.amenities,
        occupancy: clientCounts.get(entry.name) ?? 0,
      }));

      const suggestion = await this.gemini.suggestSpace(
        { building, environment, duration },
        aiSpaces,
      );

      const matchedEntry =
        SPACES_CATALOG.find((e) => e.name === suggestion.spaceName) ?? SPACES_CATALOG[0]!;
      const matchedAiSpace =
        aiSpaces.find((s) => s.name === suggestion.spaceName) ?? aiSpaces[0]!;

      res.json({
        space: {
          id: matchedEntry.id,
          name: matchedEntry.name,
          building: matchedEntry.building,
          floor: matchedEntry.floor,
          occupancy: matchedAiSpace.occupancy,
          capacity: matchedEntry.capacity,
          status: this.occupancyStatus(matchedAiSpace.occupancy, matchedEntry.capacity),
          noiseLevel: matchedEntry.noiseLevel,
          amenities: matchedEntry.amenities,
          distance: matchedEntry.distance,
        },
        insight: suggestion.insight,
      });
    } catch (err) {
      console.error('[ai] suggest error:', err);
      res.status(500).json({ error: 'AI suggestion unavailable' });
    }
  }

  private async getLiveClientCounts(): Promise<Map<string, number>> {
    const db = this.db.getKnex();
    const map = new Map<string, number>();

    try {
      const epochRow = await db('ap_snapshots')
        .select('epoch')
        .groupBy('epoch')
        .havingRaw('SUM(client_count) + SUM(wired_client_count) > 0')
        .orderBy('epoch', 'desc')
        .first();

      if (!epochRow?.epoch) return map;

      const rows = (await db('ap_snapshots as s')
        .join('access_points as ap', 'ap.id', 's.ap_id')
        .where('s.epoch', epochRow.epoch)
        .select('ap.building', db.raw('SUM(s.client_count) as total'))
        .groupBy('ap.building')) as { building: string; total: number }[];

      for (const row of rows) {
        const buildingLower = (row.building ?? '').toLowerCase();
        for (const entry of SPACES_CATALOG) {
          if (entry.dbBuildingKeywords.some((kw) => buildingLower.includes(kw))) {
            map.set(entry.name, (map.get(entry.name) ?? 0) + Number(row.total));
          }
        }
      }
    } catch (err) {
      console.warn('[ai] failed to fetch live counts, occupancy defaulting to 0:', err);
    }

    return map;
  }

  private occupancyStatus(occupancy: number, capacity: number): 'low' | 'moderate' | 'high' {
    const ratio = capacity > 0 ? occupancy / capacity : 0;
    if (ratio < 0.4) return 'low';
    if (ratio < 0.75) return 'moderate';
    return 'high';
  }
}
