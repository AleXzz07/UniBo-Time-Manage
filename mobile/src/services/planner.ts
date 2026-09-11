import { Lesson, StudySuggestion, StudyTask } from '../types';

const isoFor = (d: Date) => d.toISOString();
const overlap = (a1: Date, a2: Date, b1: Date, b2: Date) => a1 < b2 && b1 < a2;

export function suggestStudyBlocks(date: Date, lessons: Lesson[], tasks: StudyTask[]): StudySuggestion[] {
  const dayStart = new Date(date); dayStart.setHours(8, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setHours(20, 0, 0, 0);
  const events = lessons
    .map(l => ({ start: new Date(l.start), end: new Date(l.end) }))
    .filter(e => e.start.toDateString() === date.toDateString())
    .sort((a,b) => +a.start - +b.start);

  const free: Array<{start: Date; end: Date}> = [];
  let cursor = dayStart;
  for (const e of events) {
    if (e.start > cursor) free.push({ start: new Date(cursor), end: new Date(e.start) });
    if (e.end > cursor) cursor = new Date(e.end);
  }
  if (cursor < dayEnd) free.push({ start: cursor, end: dayEnd });

  const ranked = tasks.filter(t => !t.done).sort((a,b) => ({high:3,medium:2,low:1}[b.priority]-({high:3,medium:2,low:1}[a.priority])));
  const out: StudySuggestion[] = [];
  const used: Array<{start: Date; end: Date}> = [];

  for (const task of ranked) {
    const slot = free.find(f => {
      const minutes = (+f.end - +f.start) / 60000;
      const duration = Math.min(task.minutes, 90);
      const end = new Date(+f.start + duration*60000);
      return minutes >= Math.max(30, duration) && !used.some(u => overlap(f.start, end, u.start, u.end));
    });
    if (!slot) continue;
    const duration = Math.min(task.minutes, 90);
    const end = new Date(+slot.start + duration*60000);
    used.push({ start: slot.start, end });
    out.push({ id: `s-${task.id}`, taskId: task.id, subject: task.subject, title: task.title, start: isoFor(slot.start), end: isoFor(end), minutes: duration });
    if (out.length === 2) break;
  }
  return out;
}
