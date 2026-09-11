export type Lesson = {
  id: string;
  subjectCode: string;
  subject: string;
  teacher?: string;
  start: string;
  end: string;
  room?: string;
  building?: string;
  address?: string;
  sourceUrl?: string;
  updatedAt?: string;
};

export type StudyTask = {
  id: string;
  title: string;
  subject: string;
  dueAt?: string;
  minutes: number;
  priority: 'low' | 'medium' | 'high';
  done: boolean;
};

export type StudySuggestion = {
  id: string;
  taskId?: string;
  subject: string;
  title: string;
  start: string;
  end: string;
  minutes: number;
};

export type SyncStatus = {
  ok: boolean;
  syncedAt?: string;
  warnings: string[];
  source: 'remote' | 'cache' | 'seed';
};
