// Local notifications. Configurable; best-effort. Local scheduled notifications
// require a real device build to fire — they will NOT show in Expo Go / web.
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { nowRome, parseRome } from "@/src/lib/time";
import type { Lesson, StudySession, Task } from "@/src/models";
import { storage } from "@/src/utils/storage";

const SETTINGS_KEY = "notif_settings_v1";

export interface NotifSettings {
  lessonReminder: boolean;
  leadMinutes: number;
  scheduleChanges: boolean;
  taskDue: boolean;
  studyReminder: boolean;
}

export const DEFAULT_NOTIF_SETTINGS: NotifSettings = {
  lessonReminder: true,
  leadMinutes: 30,
  scheduleChanges: true,
  taskDue: true,
  studyReminder: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function getNotifSettings(): Promise<NotifSettings> {
  const stored = await storage.getItem<NotifSettings>(SETTINGS_KEY, DEFAULT_NOTIF_SETTINGS);
  return { ...DEFAULT_NOTIF_SETTINGS, ...(stored ?? {}) };
}

export async function setNotifSettings(s: NotifSettings): Promise<void> {
  await storage.setItem(SETTINGS_KEY, s);
}

export async function ensurePermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

async function scheduleAt(date: Date, title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  } catch {
    // ignore on unsupported platforms
  }
}

export async function rescheduleAll(data: {
  lessons: Lesson[];
  tasks: Task[];
  sessions: StudySession[];
  settings: NotifSettings;
}): Promise<void> {
  if (Platform.OS === "web") return;
  const ok = await ensurePermissions();
  if (!ok) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    return;
  }

  const now = nowRome();
  const horizon = now.add(7, "day");

  if (data.settings.lessonReminder) {
    for (const l of data.lessons) {
      const start = parseRome(l.start);
      const fire = start.subtract(data.settings.leadMinutes, "minute");
      if (fire.isAfter(now) && fire.isBefore(horizon)) {
        await scheduleAt(
          fire.toDate(),
          `${l.subject_name}`,
          `Lezione alle ${l.start_time} · ${l.aula ?? ""}`,
        );
      }
    }
  }

  if (data.settings.studyReminder) {
    for (const s of data.sessions) {
      const start = parseRome(s.start);
      if (start.isAfter(now) && start.isBefore(horizon)) {
        await scheduleAt(
          start.toDate(),
          "Sessione di studio",
          `${s.subject_name ?? "Studio"} alle ${start.format("HH:mm")}`,
        );
      }
    }
  }

  if (data.settings.taskDue) {
    for (const t of data.tasks) {
      if (t.status === "done" || !t.due_date) continue;
      const fire = parseRome(`${t.due_date}T09:00:00`);
      if (fire.isAfter(now) && fire.isBefore(horizon)) {
        await scheduleAt(fire.toDate(), "Task in scadenza", t.title);
      }
    }
  }
}
