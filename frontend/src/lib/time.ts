// Time helpers. Every lesson/session datetime is a naive Europe/Rome
// wall-clock string; we parse it explicitly in Europe/Rome so DST and the
// device timezone never distort comparisons.
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/it";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isoWeek from "dayjs/plugin/isoWeek";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale("it");

export const TZ = "Europe/Rome";

export const nowRome = (): Dayjs => dayjs().tz(TZ);
export const parseRome = (iso: string): Dayjs => dayjs.tz(iso, TZ);

export const ymd = (d: Dayjs): string => d.format("YYYY-MM-DD");
export const todayYmd = (): string => ymd(nowRome());

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// "Venerdì 11 settembre"
export function longDate(d: Dayjs = nowRome()): string {
  return capitalize(d.format("dddd D MMMM"));
}

export function greeting(d: Dayjs = nowRome()): string {
  const h = d.hour();
  if (h < 12) return "Buongiorno";
  if (h < 18) return "Buon pomeriggio";
  return "Buonasera";
}

// Countdown until a future ISO time -> "tra 1h 24m", "tra 3 giorni", "adesso".
export function countdownTo(iso: string): string {
  const target = parseRome(iso);
  const now = nowRome();
  const diffMin = target.diff(now, "minute");
  if (diffMin <= 0) return "adesso";
  if (diffMin < 60) return `tra ${diffMin}m`;
  const days = Math.floor(diffMin / (60 * 24));
  if (days >= 1) {
    const remH = Math.round((diffMin - days * 60 * 24) / 60);
    return days === 1 ? "tra 1 giorno" : `tra ${days} giorni${remH ? "" : ""}`;
  }
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m ? `tra ${h}h ${m}m` : `tra ${h}h`;
}

export function minutesToLabel(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h} ${h === 1 ? "ora" : "ore"}`;
}

// Monday-start week for a given anchor date.
export function weekDays(anchor: Dayjs): Dayjs[] {
  const monday = anchor.isoWeekday(1).startOf("day");
  return Array.from({ length: 7 }, (_, i) => monday.add(i, "day"));
}
