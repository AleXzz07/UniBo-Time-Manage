export interface Profile {
  id: string;
  name: string;
  university: string;
  course_id: string;
  course_name: string;
  academic_year: string;
  year_of_course: number;
  curriculum: string | null;
  group: string | null;
  onboarded: boolean;
}

export interface Course {
  id: string;
  name: string;
  level: string;
  slug: string;
  campus: string;
  years: number[];
  curricula: string[];
}

export interface Lesson {
  id: string;
  stable_id: string;
  course_id: string;
  cod_modulo: string;
  subject_key: string;
  subject_name: string;
  docente: string | null;
  date: string;
  start: string;
  end: string;
  start_time: string;
  end_time: string;
  aula: string | null;
  edificio: string | null;
  indirizzo: string | null;
  piano: string | null;
  campus: string;
  gruppo: string | null;
  teledidattica: boolean;
  cfu: number | null;
  note: string | null;
  color_token: string;
  source_url: string;
  last_updated: string;
}

export interface Subject {
  id: string;
  course_id: string;
  subject_key: string;
  name: string;
  docente: string | null;
  color_token: string;
  cfu: number | null;
  exam_date: string | null;
  planned_hours: number;
  completed_minutes: number;
  topics: string[];
  attended: boolean;
}

export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "done";

export interface Task {
  id: string;
  title: string;
  subject_key: string | null;
  subject_name: string | null;
  color_token: string | null;
  due_date: string | null;
  estimated_minutes: number;
  priority: Priority;
  status: TaskStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface StudySession {
  id: string;
  subject_key: string | null;
  subject_name: string | null;
  color_token: string | null;
  date: string;
  start: string;
  end: string;
  planned_minutes: number;
  completed: boolean;
  notes: string | null;
  source: "manual" | "planner";
}

export interface PersonalEvent {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  notes: string | null;
}

export interface ScheduleChange {
  id: string;
  course_id: string;
  type: "room_change" | "time_change" | "cancelled" | "new";
  subject_name: string;
  subject_key: string | null;
  date: string;
  message: string;
  old_value: string | null;
  new_value: string | null;
  detected_at: string;
  read: boolean;
}

export interface SyncStatus {
  id: string;
  course_id: string;
  status: "ok" | "error" | "cache";
  last_sync: string | null;
  last_success: string | null;
  source_url: string | null;
  message: string | null;
  event_count: number;
}
