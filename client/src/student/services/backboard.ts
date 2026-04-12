/**
 * Backboard service — calls the Backboard REST API directly with native fetch
 * (the npm SDK is Node-only and can't run in a browser bundle).
 *
 * All user data is also mirrored in localStorage so the app works fully
 * offline / without a Backboard round-trip on every action.
 */

const API_KEY =
  (import.meta as any).env?.VITE_BACKBOARD_KEY ??
  'espr_7P6ZYpUbvU6PC9UjHo4yChOfxAjBnqHkVh2JCecbR-U';

const BASE = 'https://app.backboard.io/api';

// ── Types ─────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  tokens: number;
  rank: number;
  totalSessions: number;
  studyHours: number;
  spacesVisited: number;
  streak: number;
  createdAt: string;
}

export interface UserPreferences {
  preferredBuilding: string;
  preferredEnvironment: 'silent' | 'quiet' | 'collaborative';
  defaultDuration: 'short' | 'medium' | 'long';
  notificationsEnabled: boolean;
  darkMode: boolean;
}

export interface SessionRecord {
  spaceId: number;
  spaceName: string;
  startedAt: string;
  durationSeconds: number;
  tokensEarned: number;
}

// ── localStorage helpers ───────────────────────────────────────

const THREAD_KEY    = 'whereto_thread_id';
const ASSISTANT_KEY = 'whereto_assistant_id';
const USER_KEY      = 'whereto_user';
const PREFS_KEY     = 'whereto_prefs';
const USERS_KEY     = 'whereto_mock_users';
const SESSIONS_KEY  = 'whereto_sessions';
export const SHARED_DARK_KEY = 'whereto_dark';

// Bump this any time the Backboard API integration changes shape.
// On mismatch the cached assistant/thread IDs are wiped so fresh ones are created.
const BB_VERSION_KEY = 'whereto_bb_version';
const BB_VERSION = '2';
(function purgeStaleBBCache() {
  if (localStorage.getItem(BB_VERSION_KEY) !== BB_VERSION) {
    localStorage.removeItem(THREAD_KEY);
    localStorage.removeItem(ASSISTANT_KEY);
    localStorage.setItem(BB_VERSION_KEY, BB_VERSION);
  }
})();

function saveLocal(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}
function loadLocal<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}
function clearLocal() {
  [THREAD_KEY, ASSISTANT_KEY, USER_KEY, PREFS_KEY].forEach((k) =>
    localStorage.removeItem(k)
  );
}

// ── Backboard REST helpers ─────────────────────────────────────

async function bbFetch(method: string, path: string, body?: unknown): Promise<any> {
  try {
    const res = await fetch(`${BASE}/${path.replace(/^\//, '')}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getOrCreateAssistant(): Promise<string | null> {
  const cached = loadLocal<string>(ASSISTANT_KEY);
  if (cached) return cached;
  const data = await bbFetch('POST', 'assistants', { name: 'Whereto Study Assistant' });
  const id: string | null = data?.assistant_id ?? data?.assistantId ?? null;
  if (id) saveLocal(ASSISTANT_KEY, id);
  return id;
}

async function getOrCreateThread(assistantId: string): Promise<string | null> {
  const cached = loadLocal<string>(THREAD_KEY);
  if (cached) return cached;
  // Correct endpoint: POST /assistants/:id/threads
  const data = await bbFetch('POST', `assistants/${assistantId}/threads`, {});
  const id: string | null = data?.thread_id ?? data?.threadId ?? null;
  if (id) saveLocal(THREAD_KEY, id);
  return id;
}

/**
 * Store a fact in Backboard memory (free-tier supported).
 * Uses memory:"Only" so Backboard extracts and stores the fact without
 * needing a paid LLM response.
 */
export async function storeMemory(content: string): Promise<void> {
  try {
    const assistantId = await getOrCreateAssistant();
    if (!assistantId) return;
    const threadId = await getOrCreateThread(assistantId);
    if (!threadId) return;
    await bbFetch('POST', `threads/${threadId}/messages`, {
      assistant_id: assistantId,
      content,
      memory: 'Only',
      stream: false,
    });
  } catch { /* silent */ }
}

/**
 * Get a personalised nudge powered by Gemini on the server.
 * Backboard stores the user's activity history; Gemini generates the nudge.
 */
export async function getNudge(user: UserProfile): Promise<string | null> {
  try {
    const res = await fetch('/api/ai/nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: user.name,
        rank: user.rank,
        streak: user.streak,
        tokens: user.tokens,
        studyHours: user.studyHours,
        totalSessions: user.totalSessions,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { nudge?: string };
    return data.nudge ?? null;
  } catch {
    return null;
  }
}

export interface BackboardMessage {
  role: 'user' | 'assistant';
  content: string;
  status?: string;
  created_at?: string;
}

/**
 * Fetch all messages stored in the user's Backboard thread.
 * GET /api/threads/:id returns { messages: [...] }
 */
export async function getThreadMessages(): Promise<BackboardMessage[]> {
  try {
    const assistantId = await getOrCreateAssistant();
    if (!assistantId) return [];
    const threadId = await getOrCreateThread(assistantId);
    if (!threadId) return [];
    // Correct endpoint: GET /threads/:id returns the thread object with messages[]
    const data = await bbFetch('GET', `threads/${threadId}`);
    return Array.isArray(data?.messages) ? data.messages : [];
  } catch {
    return [];
  }
}

// ── Auth ───────────────────────────────────────────────────────

interface StoredUser extends UserProfile { passwordHash: string; }

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

function initialsFrom(name: string): string {
  return name.split(' ').map((p) => p[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

function loadUsers(): Record<string, StoredUser> {
  return loadLocal<Record<string, StoredUser>>(USERS_KEY) ?? {};
}
function saveUsers(u: Record<string, StoredUser>) {
  saveLocal(USERS_KEY, u);
}

const DEMO_SEED: StoredUser = {
  uid: 'demo@johnabbott.qc.ca',
  name: 'Demo Student',
  email: 'demo@johnabbott.qc.ca',
  avatar: 'DS',
  tokens: 120,
  rank: 12,
  totalSessions: 8,
  studyHours: 14,
  spacesVisited: 5,
  streak: 3,
  createdAt: '2024-09-01T00:00:00.000Z',
  passwordHash: simpleHash('demo123'),
};

function ensureDemoUser() {
  const users = loadUsers();
  if (!users[DEMO_SEED.uid]) {
    users[DEMO_SEED.uid] = DEMO_SEED;
    saveUsers(users);
  }
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<UserProfile> {
  ensureDemoUser();
  const users = loadUsers();
  const key = email.toLowerCase();
  if (users[key]) throw new Error('An account with this email already exists.');

  const profile: UserProfile = {
    uid: key, name, email: key,
    avatar: initialsFrom(name),
    tokens: 0, rank: 99,
    totalSessions: 0, studyHours: 0, spacesVisited: 0, streak: 0,
    createdAt: new Date().toISOString(),
  };
  users[key] = { ...profile, passwordHash: simpleHash(password) };
  saveUsers(users);
  saveLocal(USER_KEY, profile);

  storeMemory(`New user registered: ${name} (${email}). Profile: ${JSON.stringify(profile)}`);
  return profile;
}

export async function login(email: string, password: string): Promise<UserProfile> {
  ensureDemoUser();
  const users = loadUsers();
  const key = email.toLowerCase();
  const stored = users[key];
  if (!stored) throw new Error('No account found with that email.');
  if (stored.passwordHash !== simpleHash(password)) throw new Error('Incorrect password.');

  const { passwordHash: _ph, ...profile } = stored;
  saveLocal(USER_KEY, profile);
  storeMemory(`User logged in: ${email}`);
  return profile as UserProfile;
}

export function logout() {
  clearLocal();
}

export function getCurrentUser(): UserProfile | null {
  return loadLocal<UserProfile>(USER_KEY);
}

// ── Preferences ────────────────────────────────────────────────

const DEFAULT_PREFS: UserPreferences = {
  preferredBuilding: 'all',
  preferredEnvironment: 'quiet',
  defaultDuration: 'medium',
  notificationsEnabled: true,
  darkMode: false,
};

export function getPreferences(): UserPreferences {
  const stored = loadLocal<UserPreferences>(PREFS_KEY) ?? { ...DEFAULT_PREFS };
  // Always read dark mode from the shared key so it stays in sync with admin
  const sharedDark = localStorage.getItem(SHARED_DARK_KEY);
  if (sharedDark !== null) stored.darkMode = sharedDark === 'true';
  return stored;
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  saveLocal(PREFS_KEY, prefs);
  // Keep the shared dark key in sync so admin side picks it up too
  localStorage.setItem(SHARED_DARK_KEY, String(!!prefs.darkMode));
  const user = getCurrentUser();
  if (user) storeMemory(`${user.email} updated preferences: ${JSON.stringify(prefs)}`);
}

// ── Profile update ─────────────────────────────────────────────

export async function updateProfile(
  updates: Partial<Pick<UserProfile, 'name' | 'tokens' | 'totalSessions' | 'studyHours' | 'spacesVisited' | 'streak' | 'rank'>>
): Promise<UserProfile> {
  const current = getCurrentUser();
  if (!current) throw new Error('Not logged in');
  const extra: Partial<UserProfile> = {};
  if (updates.name) extra.avatar = initialsFrom(updates.name);
  const updated = { ...current, ...updates, ...extra };
  saveLocal(USER_KEY, updated);

  const users = loadUsers();
  if (users[current.uid]) {
    users[current.uid] = { ...users[current.uid], ...updates, ...extra };
    saveUsers(users);
  }

  storeMemory(`Profile updated for ${current.email}: ${JSON.stringify(updates)}`);
  return updated;
}

// ── Session recording ──────────────────────────────────────────

export function getSessions(): SessionRecord[] {
  return loadLocal<SessionRecord[]>(SESSIONS_KEY) ?? [];
}

export async function recordSession(session: SessionRecord): Promise<void> {
  const sessions = getSessions();
  sessions.unshift(session);
  saveLocal(SESSIONS_KEY, sessions.slice(0, 50));

  const user = getCurrentUser();
  if (user) storeMemory(`Session recorded for ${user.email}: ${JSON.stringify(session)}`);
}
