import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lesson, StudyTask, SyncStatus } from '../types';

const LESSONS = 'utm:lessons';
const TASKS = 'utm:tasks';
const SYNC = 'utm:sync';

export async function saveLessons(items: Lesson[]) { await AsyncStorage.setItem(LESSONS, JSON.stringify(items)); }
export async function loadLessons(): Promise<Lesson[] | null> {
  const raw = await AsyncStorage.getItem(LESSONS); return raw ? JSON.parse(raw) : null;
}
export async function saveTasks(items: StudyTask[]) { await AsyncStorage.setItem(TASKS, JSON.stringify(items)); }
export async function loadTasks(): Promise<StudyTask[] | null> {
  const raw = await AsyncStorage.getItem(TASKS); return raw ? JSON.parse(raw) : null;
}
export async function saveSyncStatus(status: SyncStatus) { await AsyncStorage.setItem(SYNC, JSON.stringify(status)); }
export async function loadSyncStatus(): Promise<SyncStatus | null> {
  const raw = await AsyncStorage.getItem(SYNC); return raw ? JSON.parse(raw) : null;
}
