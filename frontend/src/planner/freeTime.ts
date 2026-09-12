// Free-time detection + study-block suggestion engine.
// Pure functions operating on Europe/Rome wall-clock times. The planner never
// mutates the calendar; it only proposes blocks the user can accept/edit/ignore.
import { Dayjs } from "dayjs";

import { nowRome, parseRome } from "@/src/lib/time";
import type { Subject } from "@/src/models";

export interface Busy {
  start: string;
  end: string;
}

export interface FreeSlot {
  start: string; // ISO local
  end: string;
  minutes: number;
}

export interface StudySuggestion {
  id: string;
  subject_key: string | null;
  subject_name: string;
  color_token: string;
  start: string;
  end: string;
  minutes: number;
  break_after: boolean;
}

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 21;

export function computeFreeSlots(
  dateYmd: string,
  busy: Busy[],
  opts: { minMinutes?: number; fromNow?: boolean } = {},
): FreeSlot[] {
  const minMinutes = opts.minMinutes ?? 30;
  let cursor = parseRome(`${dateYmd}T${String(DAY_START_HOUR).padStart(2, "0")}:00:00`);
  const dayEnd = parseRome(`${dateYmd}T${String(DAY_END_HOUR).padStart(2, "0")}:00:00`);

  if (opts.fromNow) {
    const now = nowRome();
    if (now.isAfter(cursor)) cursor = now;
  }

  const intervals = busy
    .map((b) => ({ s: parseRome(b.start), e: parseRome(b.end) }))
    .filter((i) => i.e.isAfter(cursor) && i.s.isBefore(dayEnd))
    .sort((a, b) => a.s.valueOf() - b.s.valueOf());

  // Merge overlapping busy intervals.
  const merged: { s: Dayjs; e: Dayjs }[] = [];
  for (const iv of intervals) {
    const last = merged[merged.length - 1];
    if (last && iv.s.isSameOrBefore(last.e)) {
      if (iv.e.isAfter(last.e)) last.e = iv.e;
    } else {
      merged.push({ s: iv.s, e: iv.e });
    }
  }

  const slots: FreeSlot[] = [];
  for (const iv of merged) {
    if (iv.s.isAfter(cursor)) {
      const minutes = iv.s.diff(cursor, "minute");
      if (minutes >= minMinutes) {
        slots.push({ start: cursor.format("YYYY-MM-DDTHH:mm:ss"), end: iv.s.format("YYYY-MM-DDTHH:mm:ss"), minutes });
      }
    }
    if (iv.e.isAfter(cursor)) cursor = iv.e;
  }
  if (dayEnd.isAfter(cursor)) {
    const minutes = dayEnd.diff(cursor, "minute");
    if (minutes >= minMinutes) {
      slots.push({ start: cursor.format("YYYY-MM-DDTHH:mm:ss"), end: dayEnd.format("YYYY-MM-DDTHH:mm:ss"), minutes });
    }
  }
  return slots;
}

// Rank subjects: nearest exam first, then lowest completion ratio.
function rankSubjects(subjects: Subject[]): Subject[] {
  const today = nowRome();
  return [...subjects]
    .filter((s) => s.attended)
    .sort((a, b) => {
      const ea = a.exam_date ? parseRome(`${a.exam_date}T00:00:00`).diff(today, "day") : 9999;
      const eb = b.exam_date ? parseRome(`${b.exam_date}T00:00:00`).diff(today, "day") : 9999;
      if (ea !== eb) return ea - eb;
      const ra = a.completed_minutes / Math.max(a.planned_hours * 60, 1);
      const rb = b.completed_minutes / Math.max(b.planned_hours * 60, 1);
      return ra - rb;
    });
}

export function suggestStudyBlocks(
  slots: FreeSlot[],
  subjects: Subject[],
): StudySuggestion[] {
  if (!subjects.length) return [];
  const ranked = rankSubjects(subjects);
  if (!ranked.length) return [];

  const suggestions: StudySuggestion[] = [];
  let subjIdx = 0;

  for (const slot of slots) {
    if (slot.minutes < 45) continue;
    const subject = ranked[subjIdx % ranked.length];
    subjIdx += 1;

    // Study up to 90 min, leave a short break if the slot is long.
    const studyMinutes = Math.min(slot.minutes >= 105 ? 90 : slot.minutes, 90);
    const start = parseRome(slot.start);
    const end = start.add(studyMinutes, "minute");
    suggestions.push({
      id: `${slot.start}-${subject.subject_key}`,
      subject_key: subject.subject_key,
      subject_name: subject.name,
      color_token: subject.color_token,
      start: start.format("YYYY-MM-DDTHH:mm:ss"),
      end: end.format("YYYY-MM-DDTHH:mm:ss"),
      minutes: studyMinutes,
      break_after: slot.minutes - studyMinutes >= 15,
    });
  }
  return suggestions;
}
