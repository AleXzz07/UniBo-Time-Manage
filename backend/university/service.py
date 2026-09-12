"""UniversityDataService — orchestrates fetch, normalise, diff, cache, status.

Flow of a sync:
  1. fetch raw data via the Provider
  2. normalise it via the Parser
  3. read the previous (cached) events from the Repository
  4. diff old vs new -> ScheduleChanges (room / time / cancelled / new)
  5. persist the new events + derived subjects (cache = last valid schedule)
  6. record SyncStatus

If the fetch fails at any point we keep the cached schedule untouched, mark the
status as `error`/`cache`, and never invent data.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

from models import ScheduleChange, Subject, SyncStatus, now_iso
from university.parser import UniversityParser
from university.provider import ProviderError, UniversityDataProvider
from university.repository import ScheduleRepository

logger = logging.getLogger(__name__)


class UniversityDataService:
    def __init__(self, db):
        self.provider = UniversityDataProvider()
        self.parser = UniversityParser()
        self.repo = ScheduleRepository(db)

    async def sync(self, course_id: str, anno: int) -> Dict[str, Any]:
        # 1 + 2: fetch + parse (blocking network call off the event loop)
        try:
            raw, page_url = await asyncio.to_thread(
                self.provider.fetch_orario, course_id, anno
            )
            new_events = self.parser.parse(raw, course_id, page_url)
        except ProviderError as exc:
            return await self._handle_failure(course_id, str(exc))
        except Exception as exc:  # unexpected parse failure
            logger.exception("Sync inatteso fallito")
            return await self._handle_failure(course_id, f"Errore interno: {exc}")

        if not new_events:
            return await self._handle_failure(course_id, "Nessun evento ricevuto da UniBo")

        # 3 + 4: diff against the cached schedule
        old_events = await self.repo.get_events(course_id)
        changes = self._diff(course_id, old_events, new_events)

        # 5: persist events + derived subjects (this becomes the cache)
        await self.repo.replace_events(course_id, new_events)
        await self.repo.upsert_subjects(self._derive_subjects(course_id, new_events))
        if changes:
            await self.repo.add_changes(changes)

        # 6: status
        status = SyncStatus(
            course_id=course_id,
            status="ok",
            last_sync=now_iso(),
            last_success=now_iso(),
            source_url=self.provider.page_url(course_id),
            message=None,
            event_count=len(new_events),
        )
        await self.repo.save_sync_status(status)
        return {
            "status": "ok",
            "event_count": len(new_events),
            "changes": len(changes),
            "sync_status": status.model_dump(),
        }

    async def _handle_failure(self, course_id: str, message: str) -> Dict[str, Any]:
        existing = await self.repo.get_sync_status(course_id)
        count = await self.repo.count_events(course_id)
        status = SyncStatus(
            course_id=course_id,
            status="cache" if count else "error",
            last_sync=now_iso(),
            last_success=(existing or {}).get("last_success"),
            source_url=self.provider.page_url(course_id),
            message=message,
            event_count=count,
        )
        await self.repo.save_sync_status(status)
        logger.warning("Sync fallito (%s), uso cache: %s eventi", message, count)
        return {
            "status": status.status,
            "event_count": count,
            "changes": 0,
            "message": message,
            "sync_status": status.model_dump(),
        }

    # -----------------------------------------------------------------
    def _derive_subjects(self, course_id: str, events: List[Any]) -> List[Subject]:
        seen: Dict[str, Subject] = {}
        for e in events:
            if e.subject_key in seen:
                continue
            seen[e.subject_key] = Subject(
                course_id=course_id,
                subject_key=e.subject_key,
                name=e.subject_name,
                docente=e.docente,
                color_token=e.color_token,
                cfu=e.cfu,
            )
        return list(seen.values())

    def _diff(
        self, course_id: str, old: List[Dict[str, Any]], new_events: List[Any]
    ) -> List[Dict[str, Any]]:
        """Match occurrences by (cod_modulo, date) and report differences."""
        def key(cod: str, date: str) -> str:
            return f"{cod}|{date}"

        old_map = {key(o["cod_modulo"], o["date"]): o for o in old}
        new_map = {key(e.cod_modulo, e.date): e for e in new_events}

        # A first-ever sync (no cache) is not a "change".
        if not old:
            return []

        changes: List[Dict[str, Any]] = []
        for k, e in new_map.items():
            o = old_map.get(k)
            if not o:
                changes.append(
                    ScheduleChange(
                        course_id=course_id,
                        type="new",
                        subject_name=e.subject_name,
                        subject_key=e.subject_key,
                        date=e.date,
                        message=f"Nuova lezione di {e.subject_name} il {e.date} alle {e.start_time}.",
                        new_value=f"{e.start_time}-{e.end_time} · {e.aula or '—'}",
                    ).model_dump()
                )
                continue
            # room change
            if (o.get("aula") or "") != (e.aula or ""):
                changes.append(
                    ScheduleChange(
                        course_id=course_id,
                        type="room_change",
                        subject_name=e.subject_name,
                        subject_key=e.subject_key,
                        date=e.date,
                        message=(
                            f"Cambio aula – {e.subject_name}. La lezione del {e.date} "
                            f"alle {e.start_time} è stata spostata da "
                            f"{o.get('aula') or '—'} a {e.aula or '—'}."
                        ),
                        old_value=o.get("aula"),
                        new_value=e.aula,
                    ).model_dump()
                )
            # time change
            if o.get("start_time") != e.start_time or o.get("end_time") != e.end_time:
                changes.append(
                    ScheduleChange(
                        course_id=course_id,
                        type="time_change",
                        subject_name=e.subject_name,
                        subject_key=e.subject_key,
                        date=e.date,
                        message=(
                            f"Cambio orario – {e.subject_name}. La lezione del {e.date} "
                            f"è passata da {o.get('start_time')}-{o.get('end_time')} a "
                            f"{e.start_time}-{e.end_time}."
                        ),
                        old_value=f"{o.get('start_time')}-{o.get('end_time')}",
                        new_value=f"{e.start_time}-{e.end_time}",
                    ).model_dump()
                )

        for k, o in old_map.items():
            if k not in new_map:
                changes.append(
                    ScheduleChange(
                        course_id=course_id,
                        type="cancelled",
                        subject_name=o["subject_name"],
                        subject_key=o.get("subject_key"),
                        date=o["date"],
                        message=(
                            f"Lezione cancellata – {o['subject_name']} del {o['date']} "
                            f"alle {o.get('start_time')}."
                        ),
                        old_value=f"{o.get('start_time')}-{o.get('end_time')}",
                    ).model_dump()
                )
        return changes
