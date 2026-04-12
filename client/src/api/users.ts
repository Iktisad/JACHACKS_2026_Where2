import { apiFetch } from './client';

export interface LeaderEntry {
  uid: string;
  name: string;
  avatar: string;
  tokens: number;
  rank: number;
  totalSessions: number;
  studyHours: number;
  streak: number;
}

export function fetchLeaderboard(): Promise<LeaderEntry[]> {
  return apiFetch<LeaderEntry[]>('/users/leaderboard');
}

export function seedUsers(): Promise<{ seeded: number }> {
  return apiFetch<{ seeded: number }>('/users/seed', undefined, 'POST');
}

export function loginUser(email: string, password: string): Promise<import('../student/services/backboard').UserProfile> {
  return apiFetch('/users/login', undefined, 'POST', { email, password });
}

export function registerUser(name: string, email: string, password: string): Promise<import('../student/services/backboard').UserProfile> {
  return apiFetch('/users/register', undefined, 'POST', { name, email, password });
}

export function updateUser(uid: string, updates: Record<string, unknown>): Promise<import('../student/services/backboard').UserProfile> {
  return apiFetch(`/users/${encodeURIComponent(uid)}`, undefined, 'PATCH', updates);
}
