from __future__ import annotations

from datetime import datetime

from .models import Change, Lesson


def _minutes(iso: str) -> int:
    d = datetime.fromisoformat(iso)
    return d.hour * 60 + d.minute


def _group(items: list[Lesson]) -> dict[tuple[str, str], list[Lesson]]:
    groups: dict[tuple[str, str], list[Lesson]] = {}
    for item in items:
        groups.setdefault((item.subjectCode, item.start[:10]), []).append(item)
    for values in groups.values():
        values.sort(key=lambda x: x.start)
    return groups


def _pair_day(old: list[Lesson], new: list[Lesson]) -> tuple[list[tuple[Lesson, Lesson]], list[Lesson], list[Lesson]]:
    """Abbina eventi della stessa materia/giorno per prossimità d'orario.

    Evita di perdere i cambiamenti quando esistono due lezioni della stessa materia
    nello stesso giorno (caso che una semplice dict per data collasserebbe).
    """
    remaining_old = old[:]
    pairs: list[tuple[Lesson, Lesson]] = []
    unmatched_new: list[Lesson] = []

    for n in new:
        if not remaining_old:
            unmatched_new.append(n)
            continue
        best = min(remaining_old, key=lambda o: abs(_minutes(o.start) - _minutes(n.start)))
        # Oltre 6 ore è più prudente considerare l'evento nuovo anziché lo stesso spostato.
        if abs(_minutes(best.start) - _minutes(n.start)) > 360:
            unmatched_new.append(n)
            continue
        remaining_old.remove(best)
        pairs.append((best, n))

    return pairs, remaining_old, unmatched_new


def detect_changes(old: list[Lesson], new: list[Lesson]) -> list[Change]:
    old_groups = _group(old)
    new_groups = _group(new)
    out: list[Change] = []

    for key in sorted(set(old_groups) | set(new_groups)):
        olds = old_groups.get(key, [])
        news = new_groups.get(key, [])
        pairs, unmatched_old, unmatched_new = _pair_day(olds, news)

        for o, n in pairs:
            if o.start[11:16] != n.start[11:16] or o.end[11:16] != n.end[11:16]:
                out.append(Change(
                    type="time",
                    lesson_id=n.id,
                    message=f"Cambio orario {n.subject}: {o.start[11:16]}–{o.end[11:16]} → {n.start[11:16]}–{n.end[11:16]}",
                ))
            if (o.room or "") != (n.room or ""):
                out.append(Change(
                    type="room",
                    lesson_id=n.id,
                    message=f"Cambio aula {n.subject}: {o.room or '?'} → {n.room or '?'}",
                ))

        for n in unmatched_new:
            out.append(Change(type="new", lesson_id=n.id, message=f"Nuova lezione: {n.subject} {n.start}"))
        for o in unmatched_old:
            out.append(Change(type="cancelled", lesson_id=o.id, message=f"Lezione rimossa/cancellata: {o.subject} {o.start}"))

    return out
