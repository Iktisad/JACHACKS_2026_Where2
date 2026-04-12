import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import type { Database } from '../db/Database.js';

interface UserRow {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  password_hash: string;
  tokens: number;
  rank: number;
  total_sessions: number;
  study_hours: number;
  spaces_visited: number;
  streak: number;
  created_at: string;
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

const SEED_USERS: Omit<UserRow, 'rank'>[] = [
  // Demo user (login: demo@johnabbott.qc.ca / demo123)
  { uid: 'demo@johnabbott.qc.ca',    name: 'Demo Student',     email: 'demo@johnabbott.qc.ca',    avatar: 'DS', password_hash: simpleHash('demo123'), tokens: 120, total_sessions: 8,  study_hours: 14, spaces_visited: 5,  streak: 3,  created_at: '2024-09-01T00:00:00.000Z' },
  // Mock leaderboard students
  { uid: 'mahimur.rahman@johnabbott.qc.ca',  name: 'Mahimur Rahman Khan', email: 'mahimur.rahman@johnabbott.qc.ca',  avatar: 'MR', password_hash: simpleHash('pass123'), tokens: 342, total_sessions: 24, study_hours: 58, spaces_visited: 9,  streak: 14, created_at: '2024-08-15T00:00:00.000Z' },
  { uid: 'iktisad.rashid@johnabbott.qc.ca',  name: 'Iktisad Rashid',    email: 'iktisad.rashid@johnabbott.qc.ca',  avatar: 'IR', password_hash: simpleHash('pass123'), tokens: 287, total_sessions: 20, study_hours: 47, spaces_visited: 8,  streak: 10, created_at: '2024-08-18T00:00:00.000Z' },
  { uid: 'fatema.meem@johnabbott.qc.ca',     name: 'Fatema Meem',       email: 'fatema.meem@johnabbott.qc.ca',     avatar: 'FM', password_hash: simpleHash('pass123'), tokens: 251, total_sessions: 18, study_hours: 41, spaces_visited: 7,  streak: 8,  created_at: '2024-08-20T00:00:00.000Z' },
  { uid: 'jordan.davis@johnabbott.qc.ca',    name: 'Jordan Davis',     email: 'jordan.davis@johnabbott.qc.ca',    avatar: 'JD', password_hash: simpleHash('pass123'), tokens: 198, total_sessions: 15, study_hours: 32, spaces_visited: 6,  streak: 6,  created_at: '2024-08-22T00:00:00.000Z' },
  { uid: 'aisha.patel@johnabbott.qc.ca',     name: 'Aisha Patel',      email: 'aisha.patel@johnabbott.qc.ca',     avatar: 'AP', password_hash: simpleHash('pass123'), tokens: 176, total_sessions: 13, study_hours: 27, spaces_visited: 6,  streak: 5,  created_at: '2024-08-25T00:00:00.000Z' },
  { uid: 'liam.obrien@johnabbott.qc.ca',     name: "Liam O'Brien",     email: 'liam.obrien@johnabbott.qc.ca',     avatar: 'LO', password_hash: simpleHash('pass123'), tokens: 159, total_sessions: 12, study_hours: 24, spaces_visited: 5,  streak: 4,  created_at: '2024-08-27T00:00:00.000Z' },
  { uid: 'maya.thompson@johnabbott.qc.ca',   name: 'Maya Thompson',    email: 'maya.thompson@johnabbott.qc.ca',   avatar: 'MT', password_hash: simpleHash('pass123'), tokens: 143, total_sessions: 11, study_hours: 21, spaces_visited: 5,  streak: 4,  created_at: '2024-09-01T00:00:00.000Z' },
  { uid: 'carlos.mendez@johnabbott.qc.ca',   name: 'Carlos Mendez',    email: 'carlos.mendez@johnabbott.qc.ca',   avatar: 'CM', password_hash: simpleHash('pass123'), tokens: 128, total_sessions: 10, study_hours: 18, spaces_visited: 4,  streak: 3,  created_at: '2024-09-03T00:00:00.000Z' },
  { uid: 'zara.khan@johnabbott.qc.ca',       name: 'Zara Khan',        email: 'zara.khan@johnabbott.qc.ca',       avatar: 'ZK', password_hash: simpleHash('pass123'), tokens: 114, total_sessions: 9,  study_hours: 16, spaces_visited: 4,  streak: 2,  created_at: '2024-09-05T00:00:00.000Z' },
  { uid: 'noah.anderson@johnabbott.qc.ca',   name: 'Noah Anderson',    email: 'noah.anderson@johnabbott.qc.ca',   avatar: 'NA', password_hash: simpleHash('pass123'), tokens: 97,  total_sessions: 8,  study_hours: 13, spaces_visited: 4,  streak: 2,  created_at: '2024-09-07T00:00:00.000Z' },
  { uid: 'priya.sharma@johnabbott.qc.ca',    name: 'Priya Sharma',     email: 'priya.sharma@johnabbott.qc.ca',    avatar: 'PS', password_hash: simpleHash('pass123'), tokens: 85,  total_sessions: 7,  study_hours: 11, spaces_visited: 3,  streak: 1,  created_at: '2024-09-08T00:00:00.000Z' },
  { uid: 'ethan.nguyen@johnabbott.qc.ca',    name: 'Ethan Nguyen',     email: 'ethan.nguyen@johnabbott.qc.ca',    avatar: 'EN', password_hash: simpleHash('pass123'), tokens: 72,  total_sessions: 6,  study_hours: 9,  spaces_visited: 3,  streak: 1,  created_at: '2024-09-10T00:00:00.000Z' },
  { uid: 'isabelle.roy@johnabbott.qc.ca',    name: 'Isabelle Roy',     email: 'isabelle.roy@johnabbott.qc.ca',    avatar: 'IS', password_hash: simpleHash('pass123'), tokens: 58,  total_sessions: 5,  study_hours: 7,  spaces_visited: 2,  streak: 1,  created_at: '2024-09-12T00:00:00.000Z' },
  { uid: 'david.leblanc@johnabbott.qc.ca',   name: 'David Leblanc',    email: 'david.leblanc@johnabbott.qc.ca',   avatar: 'DL', password_hash: simpleHash('pass123'), tokens: 43,  total_sessions: 4,  study_hours: 5,  spaces_visited: 2,  streak: 0,  created_at: '2024-09-15T00:00:00.000Z' },
];

export class UsersController {
  readonly router: Router;

  constructor(private readonly db: Database) {
    this.router = createRouter();
    this.registerRoutes();
  }

  async seedOnStartup(): Promise<void> {
    try {
      const db = this.db.getKnex();
      const sorted = [...SEED_USERS].sort((a, b) => b.tokens - a.tokens);
      const withRanks = sorted.map((u, i) => ({ ...u, rank: i + 1 }));
      for (const user of withRanks) {
        const exists = await db<UserRow>('users').where('uid', user.uid).first();
        if (!exists) await db<UserRow>('users').insert(user);
      }
      console.log('[users] seed complete');
    } catch (err) {
      console.error('[users] seed on startup failed:', err);
    }
  }

  private registerRoutes(): void {
    this.router.get('/leaderboard', (req, res) => void this.leaderboard(req, res));
    this.router.post('/seed', (req, res) => void this.seed(req, res));
    this.router.post('/login', (req, res) => void this.login(req, res));
    this.router.post('/register', (req, res) => void this.register(req, res));
    this.router.patch('/:uid', (req, res) => void this.update(req, res));
  }

  private async leaderboard(_req: Request, res: Response): Promise<void> {
    try {
      const db = this.db.getKnex();
      const rows = await db<UserRow>('users')
        .select('uid', 'name', 'avatar', 'tokens', 'total_sessions', 'study_hours', 'streak', 'rank')
        .orderBy('tokens', 'desc');

      // Re-compute ranks on the fly
      const ranked = rows.map((r, i) => ({ ...r, rank: i + 1 }));
      res.json(ranked);
    } catch (err) {
      console.error('[users] leaderboard error:', err);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  }

  private async seed(_req: Request, res: Response): Promise<void> {
    try {
      const db = this.db.getKnex();
      // Insert or ignore — never overwrite existing users
      const sorted = [...SEED_USERS].sort((a, b) => b.tokens - a.tokens);
      const withRanks = sorted.map((u, i) => ({ ...u, rank: i + 1 }));

      for (const user of withRanks) {
        const exists = await db<UserRow>('users').where('uid', user.uid).first();
        if (!exists) {
          await db<UserRow>('users').insert(user);
        }
      }

      res.json({ seeded: withRanks.length });
    } catch (err) {
      console.error('[users] seed error:', err);
      res.status(500).json({ error: 'Seed failed' });
    }
  }

  private async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password) { res.status(400).json({ error: 'email and password required' }); return; }

      const db = this.db.getKnex();
      const user = await db<UserRow>('users').where('uid', email.toLowerCase()).first();
      if (!user) { res.status(401).json({ error: 'No account found with that email.' }); return; }
      if (user.password_hash !== simpleHash(password)) { res.status(401).json({ error: 'Incorrect password.' }); return; }

      const { password_hash: _ph, ...profile } = user;
      res.json(this.toProfile(profile as Omit<UserRow, 'password_hash'>));
    } catch (err) {
      console.error('[users] login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  private async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
      if (!name || !email || !password) { res.status(400).json({ error: 'name, email and password required' }); return; }

      const db = this.db.getKnex();
      const key = email.toLowerCase();
      const exists = await db<UserRow>('users').where('uid', key).first();
      if (exists) { res.status(409).json({ error: 'An account with this email already exists.' }); return; }

      // Count existing users to assign a starting rank
      const count = await db<UserRow>('users').count('uid as c').first() as unknown as { c: number };

      const newUser: UserRow = {
        uid: key, name, email: key,
        avatar: initials(name),
        password_hash: simpleHash(password),
        tokens: 0, rank: Number(count?.c ?? 0) + 1,
        total_sessions: 0, study_hours: 0, spaces_visited: 0, streak: 0,
        created_at: new Date().toISOString(),
      };
      await db<UserRow>('users').insert(newUser);

      const { password_hash: _ph, ...profile } = newUser;
      res.status(201).json(this.toProfile(profile as Omit<UserRow, 'password_hash'>));
    } catch (err) {
      console.error('[users] register error:', err);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  private async update(req: Request, res: Response): Promise<void> {
    try {
      const { uid } = req.params as { uid: string };
      const { tokens, total_sessions, study_hours, spaces_visited, streak, name } =
        req.body as Partial<UserRow>;

      const db = this.db.getKnex();
      const updates: Partial<UserRow> = {};
      if (tokens        !== undefined) updates.tokens         = tokens;
      if (total_sessions !== undefined) updates.total_sessions = total_sessions;
      if (study_hours   !== undefined) updates.study_hours    = study_hours;
      if (spaces_visited !== undefined) updates.spaces_visited = spaces_visited;
      if (streak        !== undefined) updates.streak         = streak;
      if (name          !== undefined) { updates.name = name; updates.avatar = initials(name); }

      await db<UserRow>('users').where('uid', uid).update(updates);

      // Recompute ranks across all users after any token change
      if (tokens !== undefined) {
        const all = await db<UserRow>('users').select('uid', 'tokens').orderBy('tokens', 'desc');
        for (let i = 0; i < all.length; i++) {
          await db<UserRow>('users').where('uid', all[i]!.uid).update({ rank: i + 1 });
        }
      }

      const updated = await db<UserRow>('users').where('uid', uid).first();
      if (!updated) { res.status(404).json({ error: 'User not found' }); return; }
      const { password_hash: _ph, ...profile } = updated;
      res.json(this.toProfile(profile as Omit<UserRow, 'password_hash'>));
    } catch (err) {
      console.error('[users] update error:', err);
      res.status(500).json({ error: 'Update failed' });
    }
  }

  private toProfile(u: Omit<UserRow, 'password_hash'>) {
    return {
      uid:           u.uid,
      name:          u.name,
      email:         u.email,
      avatar:        u.avatar,
      tokens:        u.tokens,
      rank:          u.rank,
      totalSessions: u.total_sessions,
      studyHours:    u.study_hours,
      spacesVisited: u.spaces_visited,
      streak:        u.streak,
      createdAt:     u.created_at,
    };
  }
}
