from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pymongo import AsyncMongoClient
from pymongo.server_api import ServerApi

from .models import Lesson

PATH = Path(__file__).resolve().parent.parent / "schedule_cache.json"
MONGODB_URI = os.getenv("MONGODB_URI", "").strip()
MONGODB_DB = os.getenv("MONGODB_DB", "unibo_time_manager").strip() or "unibo_time_manager"

_client: AsyncMongoClient[dict[str, Any]] | None = None


def _client_or_none() -> AsyncMongoClient[dict[str, Any]] | None:
    global _client
    if not MONGODB_URI:
        return None
    if _client is None:
        _client = AsyncMongoClient(
            MONGODB_URI,
            server_api=ServerApi("1"),
            serverSelectionTimeoutMS=5000,
        )
    return _client


def storage_backend() -> str:
    return "mongodb" if MONGODB_URI else "local-json"


async def ping() -> bool:
    client = _client_or_none()
    if client is None:
        return True
    try:
        await client.admin.command("ping")
        return True
    except Exception:
        return False


async def load() -> list[Lesson]:
    client = _client_or_none()
    if client is not None:
        doc = await client[MONGODB_DB]["schedule_state"].find_one({"_id": "current"})
        if not doc:
            return []
        return [Lesson.model_validate(x) for x in doc.get("lessons", [])]

    # Fallback solo per sviluppo locale e test. Su Render REQUIRE_MONGODB=true.
    if not PATH.exists():
        return []
    try:
        return [Lesson.model_validate(x) for x in json.loads(PATH.read_text(encoding="utf-8"))]
    except Exception:
        return []


async def save(items: list[Lesson]) -> None:
    client = _client_or_none()
    if client is not None:
        # Un singolo replace evita stati intermedi (cache cancellata ma non ancora riscritta).
        await client[MONGODB_DB]["schedule_state"].replace_one(
            {"_id": "current"},
            {
                "_id": "current",
                "updatedAt": datetime.now(timezone.utc),
                "lessons": [x.model_dump() for x in items],
            },
            upsert=True,
        )
        return

    PATH.write_text(
        json.dumps([x.model_dump() for x in items], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
