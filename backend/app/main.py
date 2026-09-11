import asyncio
import os
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import SUBJECTS, timetable_url
from .diff import detect_changes
from .store import load, ping, save, storage_backend
from .unibo_provider import UniBoProvider

TZ = ZoneInfo("Europe/Rome")
REQUIRE_MONGODB = os.getenv("REQUIRE_MONGODB", "false").lower() == "true"

app = FastAPI(title="UniBo Time Manager API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
provider = UniBoProvider()


@app.get("/")
def root():
    return {"name": "UniBo Time Manager API", "version": "0.2.0", "docs": "/docs"}


@app.get("/health")
async def health():
    backend = storage_backend()
    database_ok = await ping()
    configured_ok = not REQUIRE_MONGODB or backend == "mongodb"
    return {
        "ok": database_ok and configured_ok,
        "time": datetime.now(TZ).isoformat(),
        "storage": backend,
        "databaseOk": database_ok,
        "cloudStorageRequired": REQUIRE_MONGODB,
    }


@app.get("/api/subjects")
def subjects():
    return [{**s, "url": timetable_url(s["page_id"])} for s in SUBJECTS]


@app.get("/api/schedule")
async def schedule():
    items = await load()
    return {
        "ok": bool(items),
        "lessons": [x.model_dump() for x in items],
        "source": "cache",
    }


async def _fetch_subject(subject: dict):
    url = timetable_url(subject["page_id"])
    try:
        rows = await provider.fetch(subject, url)
        return subject, rows, None
    except Exception as exc:
        return subject, [], exc


@app.post("/api/sync")
async def sync():
    old = await load()
    lessons = []
    warnings = []
    success = 0

    # Le fonti sono indipendenti: fetch concorrente per ridurre molto il tempo di sync.
    results = await asyncio.gather(*[_fetch_subject(subject) for subject in SUBJECTS])
    for subject, rows, error in results:
        if error is None:
            lessons.extend(rows)
            success += 1
        else:
            warnings.append(f"{subject['name']}: {error}")
            # Se una singola fonte fallisce, preserva gli ultimi eventi noti.
            lessons.extend([x for x in old if x.subjectCode == subject["code"]])

    lessons = sorted({x.id: x for x in lessons}.values(), key=lambda x: x.start)
    if lessons:
        await save(lessons)

    changes = detect_changes(old, lessons) if old else []
    if success == len(SUBJECTS):
        source = "remote"
    elif success == 0 and old:
        source = "cache"
    else:
        source = "remote"

    return {
        "ok": success > 0 or bool(old),
        "syncedAt": datetime.now(TZ).isoformat(),
        "source": source,
        "warnings": warnings,
        "lessons": [x.model_dump() for x in lessons],
        "changes": [x.model_dump() for x in changes],
    }
