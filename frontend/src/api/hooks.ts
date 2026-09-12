import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/src/api/client";
import { nowRome, todayYmd } from "@/src/lib/time";
import type {
  Course,
  Lesson,
  PersonalEvent,
  Profile,
  ScheduleChange,
  StudySession,
  Subject,
  SyncStatus,
  Task,
} from "@/src/models";

export const keys = {
  profile: ["profile"] as const,
  courses: ["courses"] as const,
  lessons: (start: string, end: string) => ["lessons", start, end] as const,
  subjects: ["subjects"] as const,
  tasks: ["tasks"] as const,
  study: (start?: string, end?: string) => ["study", start ?? "all", end ?? "all"] as const,
  personal: (start?: string, end?: string) => ["personal", start ?? "all", end ?? "all"] as const,
  syncStatus: ["sync-status"] as const,
  changes: ["schedule-changes"] as const,
};

export function useProfile() {
  return useQuery({ queryKey: keys.profile, queryFn: () => api.get<Profile | null>("/me") });
}

export function useCourses() {
  return useQuery({ queryKey: keys.courses, queryFn: () => api.get<Course[]>("/courses") });
}

export function useLessons(start: string, end: string, enabled = true) {
  return useQuery({
    queryKey: keys.lessons(start, end),
    queryFn: () => api.get<Lesson[]>(`/lessons?start=${start}&end=${end}`),
    enabled,
  });
}

// Next 150 days of lessons — used for "next lesson" and study planning.
export function useUpcomingLessons() {
  const start = todayYmd();
  const end = nowRome().add(150, "day").format("YYYY-MM-DD");
  return useLessons(start, end);
}

export function useSubjects() {
  return useQuery({ queryKey: keys.subjects, queryFn: () => api.get<Subject[]>("/subjects") });
}

export function useTasks() {
  return useQuery({ queryKey: keys.tasks, queryFn: () => api.get<Task[]>("/tasks") });
}

export function useStudySessions(start?: string, end?: string) {
  const qs = start && end ? `?start=${start}&end=${end}` : "";
  return useQuery({
    queryKey: keys.study(start, end),
    queryFn: () => api.get<StudySession[]>(`/study-sessions${qs}`),
  });
}

export function usePersonalEvents(start?: string, end?: string) {
  const qs = start && end ? `?start=${start}&end=${end}` : "";
  return useQuery({
    queryKey: keys.personal(start, end),
    queryFn: () => api.get<PersonalEvent[]>(`/personal-events${qs}`),
  });
}

export function useSyncStatus() {
  return useQuery({
    queryKey: keys.syncStatus,
    queryFn: () => api.get<SyncStatus | null>("/sync-status"),
  });
}

export function useScheduleChanges() {
  return useQuery({
    queryKey: keys.changes,
    queryFn: () => api.get<ScheduleChange[]>("/schedule-changes"),
  });
}

// ---- mutations -----------------------------------------------------------
export function useOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      course_id: string;
      academic_year: string;
      year_of_course: number;
      curriculum: string | null;
      group: string | null;
    }) => api.post("/onboarding", body),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/sync"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons"] });
      qc.invalidateQueries({ queryKey: keys.subjects });
      qc.invalidateQueries({ queryKey: keys.syncStatus });
      qc.invalidateQueries({ queryKey: keys.changes });
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Task>) => api.post<Task>("/tasks", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tasks }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Task> & { id: string }) =>
      api.patch<Task>(`/tasks/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.tasks });
      qc.invalidateQueries({ queryKey: keys.subjects });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tasks }),
  });
}

export function useCreateStudySession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<StudySession>) => api.post<StudySession>("/study-sessions", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study"] });
      qc.invalidateQueries({ queryKey: keys.subjects });
    },
  });
}

export function useUpdateStudySession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<StudySession> & { id: string }) =>
      api.patch<StudySession>(`/study-sessions/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study"] });
      qc.invalidateQueries({ queryKey: keys.subjects });
    },
  });
}

export function useDeleteStudySession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/study-sessions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study"] });
      qc.invalidateQueries({ queryKey: keys.subjects });
    },
  });
}

export function useCreatePersonalEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<PersonalEvent>) => api.post<PersonalEvent>("/personal-events", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personal"] }),
  });
}

export function useDeletePersonalEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/personal-events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personal"] }),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subject_key, ...body }: Partial<Subject> & { subject_key: string }) =>
      api.patch<Subject>(`/subjects/${subject_key}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.subjects }),
  });
}

export function useMarkChangesRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/schedule-changes/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.changes }),
  });
}
