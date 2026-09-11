import { Lesson, SyncStatus } from '../types';

const base = process.env.EXPO_PUBLIC_API_URL;

export async function syncSchedule(): Promise<{ lessons: Lesson[]; status: SyncStatus }> {
  if (!base) throw new Error('EXPO_PUBLIC_API_URL non configurato');
  const response = await fetch(`${base.replace(/\/$/, '')}/api/sync`, { method: 'POST' });
  if (!response.ok) throw new Error(`Sync fallita (${response.status})`);
  const data = await response.json();
  return {
    lessons: data.lessons,
    status: {
      ok: data.ok,
      syncedAt: data.syncedAt,
      warnings: data.warnings ?? [],
      source: data.source ?? 'remote',
    },
  };
}
