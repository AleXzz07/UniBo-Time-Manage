"""ScheduleRepository — the only place that talks to MongoDB for schedule data.

All documents are stored with our own string `id` and every read strips the raw
Mongo `_id` (projection {"_id": 0}) so nothing non-serialisable ever escapes.
Deletes are soft (deleted_at) for user-owned collections.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from models import LessonEvent, Subject, SyncStatus


class ScheduleRepository:
    def __init__(self, db):
        self.db = db

    # ---- lessons ---------------------------------------------------------
    async def get_events(self, course_id: str) -> List[Dict[str, Any]]:
        return await self.db.lesson_events.find(
            {"course_id": course_id}, {"_id": 0}
        ).to_list(5000)

    async def replace_events(self, course_id: str, events: List[LessonEvent]) -> None:
        await self.db.lesson_events.delete_many({"course_id": course_id})
        if events:
            await self.db.lesson_events.insert_many([e.model_dump() for e in events])

    async def get_events_range(
        self, course_id: str, start: str, end: str, group: Optional[str]
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"course_id": course_id, "date": {"$gte": start, "$lte": end}}
        if group:
            # Lessons with no group are common to everyone; keep those plus the
            # user's own group.
            query["$or"] = [{"gruppo": None}, {"gruppo": group}]
        docs = await self.db.lesson_events.find(query, {"_id": 0}).to_list(5000)
        docs.sort(key=lambda d: d["start"])
        return docs

    async def count_events(self, course_id: str) -> int:
        return await self.db.lesson_events.count_documents({"course_id": course_id})

    # ---- subjects --------------------------------------------------------
    async def upsert_subjects(self, subjects: List[Subject]) -> None:
        for s in subjects:
            data = s.model_dump()
            # Preserve user-owned fields on updates; only set them on first insert.
            user_owned = {
                "exam_date": data.pop("exam_date"),
                "planned_hours": data.pop("planned_hours"),
                "topics": data.pop("topics"),
                "attended": data.pop("attended"),
                "id": data.pop("id"),
                "completed_minutes": data.pop("completed_minutes"),
            }
            await self.db.subjects.update_one(
                {"course_id": s.course_id, "subject_key": s.subject_key},
                {"$set": data, "$setOnInsert": user_owned},
                upsert=True,
            )

    async def get_subjects(self, course_id: str) -> List[Dict[str, Any]]:
        docs = await self.db.subjects.find(
            {"course_id": course_id}, {"_id": 0}
        ).to_list(500)
        docs.sort(key=lambda d: d.get("name", ""))
        return docs

    # ---- sync status -----------------------------------------------------
    async def save_sync_status(self, status: SyncStatus) -> None:
        await self.db.sync_status.update_one(
            {"course_id": status.course_id},
            {"$set": status.model_dump()},
            upsert=True,
        )

    async def get_sync_status(self, course_id: str) -> Optional[Dict[str, Any]]:
        return await self.db.sync_status.find_one({"course_id": course_id}, {"_id": 0})

    # ---- schedule changes ------------------------------------------------
    async def add_changes(self, changes: List[Dict[str, Any]]) -> None:
        if changes:
            await self.db.schedule_changes.insert_many(changes)

    async def get_changes(self, course_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        docs = await self.db.schedule_changes.find(
            {"course_id": course_id}, {"_id": 0}
        ).to_list(limit)
        docs.sort(key=lambda d: d.get("detected_at", ""), reverse=True)
        return docs
