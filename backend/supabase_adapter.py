from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from supabase import Client, create_client


@dataclass
class UpdateResult:
    matched_count: int


def _matches(doc: Dict[str, Any], query: Optional[Dict[str, Any]]) -> bool:
    if not query:
        return True

    for key, expected in query.items():
        if key == "$or":
            if not any(_matches(doc, part) for part in expected):
                return False
            continue

        actual = doc.get(key)

        if isinstance(expected, dict):
            for op, value in expected.items():
                if op == "$gte" and not (actual is not None and actual >= value):
                    return False
                if op == "$lte" and not (actual is not None and actual <= value):
                    return False
                if op == "$gt" and not (actual is not None and actual > value):
                    return False
                if op == "$lt" and not (actual is not None and actual < value):
                    return False
                if op == "$ne" and actual == value:
                    return False
            continue

        if actual != expected:
            return False

    return True


class SupabaseCursor:
    def __init__(self, table: "SupabaseTable", query: Optional[Dict[str, Any]]):
        self.table = table
        self.query = query or {}

    async def to_list(self, limit: int = 1000) -> List[Dict[str, Any]]:
        docs = await self.table._all()
        return [d for d in docs if _matches(d, self.query)][:limit]


class SupabaseTable:
    def __init__(self, db: "SupabaseDatabase", name: str):
        self.db = db
        self.name = name

    async def _all(self) -> List[Dict[str, Any]]:
        def run():
            response = self.db.client.table(self.name).select("*").execute()
            return response.data or []
        return await asyncio.to_thread(run)

    def find(self, query: Optional[Dict[str, Any]] = None, projection=None) -> SupabaseCursor:
        return SupabaseCursor(self, query)

    async def find_one(
        self,
        query: Optional[Dict[str, Any]] = None,
        projection=None,
    ) -> Optional[Dict[str, Any]]:
        docs = await self.find(query, projection).to_list(1)
        return docs[0] if docs else None

    async def insert_one(self, data: Dict[str, Any]) -> None:
        def run():
            self.db.client.table(self.name).insert(data).execute()
        await asyncio.to_thread(run)

    async def insert_many(self, data: List[Dict[str, Any]]) -> None:
        if not data:
            return
        def run():
            self.db.client.table(self.name).insert(data).execute()
        await asyncio.to_thread(run)

    async def delete_many(self, query: Optional[Dict[str, Any]] = None) -> None:
        query = query or {}

        # Fast path for simple equality filters.
        if query and all(not isinstance(v, dict) for v in query.values()) and "$or" not in query:
            def run_simple():
                q = self.db.client.table(self.name).delete()
                for key, value in query.items():
                    if value is None:
                        q = q.is_(key, "null")
                    else:
                        q = q.eq(key, value)
                q.execute()
            await asyncio.to_thread(run_simple)
            return

        docs = await self.find(query).to_list(10000)
        ids = [d.get("id") for d in docs if d.get("id")]
        if not ids:
            return

        def run_ids():
            self.db.client.table(self.name).delete().in_("id", ids).execute()
        await asyncio.to_thread(run_ids)

    async def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        return len(await self.find(query).to_list(10000))

    async def update_one(
        self,
        query: Dict[str, Any],
        update: Dict[str, Any],
        upsert: bool = False,
    ) -> UpdateResult:
        existing = await self.find_one(query)

        if existing:
            data = dict(update.get("$set", {}))
            if data:
                row_id = existing.get("id")
                def run_update():
                    self.db.client.table(self.name).update(data).eq("id", row_id).execute()
                await asyncio.to_thread(run_update)
            return UpdateResult(matched_count=1)

        if upsert:
            data = {}
            for key, value in query.items():
                if key.startswith("$") or isinstance(value, dict):
                    continue
                data[key] = value
            data.update(update.get("$setOnInsert", {}))
            data.update(update.get("$set", {}))
            await self.insert_one(data)
            return UpdateResult(matched_count=1)

        return UpdateResult(matched_count=0)

    async def update_many(
        self,
        query: Dict[str, Any],
        update: Dict[str, Any],
    ) -> UpdateResult:
        docs = await self.find(query).to_list(10000)
        data = dict(update.get("$set", {}))
        ids = [d.get("id") for d in docs if d.get("id")]
        if not ids or not data:
            return UpdateResult(matched_count=0)

        def run():
            self.db.client.table(self.name).update(data).in_("id", ids).execute()
        await asyncio.to_thread(run)
        return UpdateResult(matched_count=len(ids))


class SupabaseDatabase:
    TABLES = {
        "users",
        "lesson_events",
        "subjects",
        "sync_status",
        "schedule_changes",
        "tasks",
        "study_sessions",
        "personal_events",
    }

    def __init__(self, url: str, secret_key: str):
        self.client: Client = create_client(url, secret_key)

    def __getattr__(self, name: str) -> SupabaseTable:
        if name in self.TABLES:
            return SupabaseTable(self, name)
        raise AttributeError(name)

    async def ping(self) -> bool:
        try:
            def run():
                self.client.table("users").select("id").limit(1).execute()
            await asyncio.to_thread(run)
            return True
        except Exception:
            return False
