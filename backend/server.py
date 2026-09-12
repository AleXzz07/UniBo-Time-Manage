import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.middleware.cors import CORSMiddleware

from models import (
    OnboardingRequest,
    PersonalEvent,
    PersonalEventCreate,
    StudySession,
    StudySessionCreate,
    StudySessionUpdate,
    SubjectUpdate,
    Task,
    TaskCreate,
    TaskUpdate,
    UserProfile,
    now_iso,
)
from university.provider import COURSES, UniversityDataProvider
from university.repository import ScheduleRepository
from university.service import UniversityDataService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = (
    os.getenv("MONGODB_URI")
    or os.getenv("MONGO_URL")
    or ""
).strip()
db_name = (
    os.getenv("MONGODB_DB")
    or os.getenv("DB_NAME")
    or "unibo_planner"
).strip()

if not mongo_url:
    raise RuntimeError(
        "MongoDB non configurato: imposta MONGODB_URI su Render "
        "(oppure MONGO_URL in sviluppo locale)."
    )

client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=7000,
)
db = client[db_name]

app = FastAPI(title="UniBo Planner API")
api = APIRouter(prefix="/api")

service = UniversityDataService(db)
repo = ScheduleRepository(db)


@app.get("/health")
async def health():
    try:
        await client.admin.command("ping")
        return {
            "ok": True,
            "storage": "mongodb",
            "databaseOk": True,
            "database": db_name,
        }
    except Exception as exc:
        return {
            "ok": False,
            "storage": "mongodb",
            "databaseOk": False,
            "database": db_name,
            "error": type(exc).__name__,
        }

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Meta
# ---------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"message": "UniBo Planner API"}


@api.get("/courses")
async def get_courses():
    return list(COURSES.values())


async def _get_profile() -> Optional[dict]:
    return await db.users.find_one({}, {"_id": 0})


# ---------------------------------------------------------------------------
# Onboarding / profile / sync
# ---------------------------------------------------------------------------
@api.get("/me")
async def get_me():
    return await _get_profile()


@api.post("/onboarding")
async def onboarding(req: OnboardingRequest):
    course = COURSES.get(req.course_id)
    if not course:
        raise HTTPException(status_code=400, detail="Corso non supportato")

    profile = UserProfile(
        name=req.name,
        course_id=req.course_id,
        course_name=course["name"],
        academic_year=req.academic_year,
        year_of_course=req.year_of_course,
        curriculum=req.curriculum,
        group=req.group,
    )
    await db.users.delete_many({})
    await db.users.insert_one(profile.model_dump())

    sync_result = await service.sync(req.course_id, req.year_of_course)
    return {"profile": profile.model_dump(), "sync": sync_result}


@api.post("/sync")
async def sync_now():
    profile = await _get_profile()
    if not profile:
        raise HTTPException(status_code=400, detail="Profilo non configurato")
    result = await service.sync(profile["course_id"], profile["year_of_course"])
    return result


@api.get("/sync-status")
async def sync_status():
    profile = await _get_profile()
    if not profile:
        return None
    return await repo.get_sync_status(profile["course_id"])


# ---------------------------------------------------------------------------
# Lessons
# ---------------------------------------------------------------------------
@api.get("/lessons")
async def get_lessons(start: str, end: str):
    profile = await _get_profile()
    if not profile:
        return []
    return await repo.get_events_range(
        profile["course_id"], start, end, profile.get("group")
    )


@api.get("/lessons/{stable_id}")
async def get_lesson(stable_id: str):
    doc = await db.lesson_events.find_one({"stable_id": stable_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Lezione non trovata")
    return doc


# ---------------------------------------------------------------------------
# Subjects
# ---------------------------------------------------------------------------
@api.get("/subjects")
async def get_subjects():
    profile = await _get_profile()
    if not profile:
        return []
    subjects = await repo.get_subjects(profile["course_id"])
    # completed minutes computed live from completed study sessions
    sessions = await db.study_sessions.find(
        {"completed": True, "deleted_at": None}, {"_id": 0}
    ).to_list(5000)
    minutes_by_key: dict = {}
    for s in sessions:
        k = s.get("subject_key")
        if k:
            minutes_by_key[k] = minutes_by_key.get(k, 0) + (s.get("planned_minutes") or 0)
    for s in subjects:
        s["completed_minutes"] = minutes_by_key.get(s["subject_key"], 0)
    return subjects


@api.patch("/subjects/{subject_key}")
async def update_subject(subject_key: str, update: SubjectUpdate):
    profile = await _get_profile()
    if not profile:
        raise HTTPException(status_code=400, detail="Profilo non configurato")
    data = {k: v for k, v in update.model_dump().items() if v is not None}
    data["updated_at"] = now_iso()
    result = await db.subjects.update_one(
        {"course_id": profile["course_id"], "subject_key": subject_key},
        {"$set": data},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Materia non trovata")
    return await db.subjects.find_one(
        {"course_id": profile["course_id"], "subject_key": subject_key}, {"_id": 0}
    )


async def _subject_meta(subject_key: Optional[str]) -> tuple:
    if not subject_key:
        return None, None
    s = await db.subjects.find_one({"subject_key": subject_key}, {"_id": 0})
    if not s:
        return None, None
    return s.get("name"), s.get("color_token")


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------
@api.get("/tasks")
async def get_tasks():
    docs = await db.tasks.find({"deleted_at": None}, {"_id": 0}).to_list(2000)
    docs.sort(key=lambda d: (d.get("due_date") or "9999", d.get("created_at", "")))
    return docs


@api.post("/tasks")
async def create_task(req: TaskCreate):
    name, color = await _subject_meta(req.subject_key)
    task = Task(
        title=req.title,
        subject_key=req.subject_key,
        subject_name=name,
        color_token=color,
        due_date=req.due_date,
        estimated_minutes=req.estimated_minutes,
        priority=req.priority,
        notes=req.notes,
    )
    await db.tasks.insert_one(task.model_dump())
    return task.model_dump()


@api.patch("/tasks/{task_id}")
async def update_task(task_id: str, update: TaskUpdate):
    data = {k: v for k, v in update.model_dump().items() if v is not None}
    if "subject_key" in data:
        name, color = await _subject_meta(data["subject_key"])
        data["subject_name"] = name
        data["color_token"] = color
    if data.get("status") == "done":
        data["completed_at"] = now_iso()
    elif data.get("status") == "todo":
        data["completed_at"] = None
    data["updated_at"] = now_iso()
    result = await db.tasks.update_one({"id": task_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task non trovato")
    return await db.tasks.find_one({"id": task_id}, {"_id": 0})


@api.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.update_one(
        {"id": task_id}, {"$set": {"deleted_at": now_iso()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task non trovato")
    return {"ok": True}


# ---------------------------------------------------------------------------
# Study sessions
# ---------------------------------------------------------------------------
@api.get("/study-sessions")
async def get_study_sessions(start: Optional[str] = None, end: Optional[str] = None):
    query: dict = {"deleted_at": None}
    if start and end:
        query["date"] = {"$gte": start, "$lte": end}
    docs = await db.study_sessions.find(query, {"_id": 0}).to_list(2000)
    docs.sort(key=lambda d: d.get("start", ""))
    return docs


@api.post("/study-sessions")
async def create_study_session(req: StudySessionCreate):
    name, color = await _subject_meta(req.subject_key)
    session = StudySession(
        subject_key=req.subject_key,
        subject_name=name,
        color_token=color,
        date=req.date,
        start=req.start,
        end=req.end,
        planned_minutes=req.planned_minutes,
        notes=req.notes,
        source=req.source,
    )
    await db.study_sessions.insert_one(session.model_dump())
    return session.model_dump()


@api.patch("/study-sessions/{session_id}")
async def update_study_session(session_id: str, update: StudySessionUpdate):
    data = {k: v for k, v in update.model_dump().items() if v is not None}
    result = await db.study_sessions.update_one({"id": session_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sessione non trovata")
    return await db.study_sessions.find_one({"id": session_id}, {"_id": 0})


@api.delete("/study-sessions/{session_id}")
async def delete_study_session(session_id: str):
    result = await db.study_sessions.update_one(
        {"id": session_id}, {"$set": {"deleted_at": now_iso()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sessione non trovata")
    return {"ok": True}


# ---------------------------------------------------------------------------
# Personal events
# ---------------------------------------------------------------------------
@api.get("/personal-events")
async def get_personal_events(start: Optional[str] = None, end: Optional[str] = None):
    query: dict = {"deleted_at": None}
    if start and end:
        query["date"] = {"$gte": start, "$lte": end}
    docs = await db.personal_events.find(query, {"_id": 0}).to_list(2000)
    docs.sort(key=lambda d: d.get("start", ""))
    return docs


@api.post("/personal-events")
async def create_personal_event(req: PersonalEventCreate):
    event = PersonalEvent(
        title=req.title, date=req.date, start=req.start, end=req.end, notes=req.notes
    )
    await db.personal_events.insert_one(event.model_dump())
    return event.model_dump()


@api.delete("/personal-events/{event_id}")
async def delete_personal_event(event_id: str):
    result = await db.personal_events.update_one(
        {"id": event_id}, {"$set": {"deleted_at": now_iso()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    return {"ok": True}


# ---------------------------------------------------------------------------
# Schedule changes
# ---------------------------------------------------------------------------
@api.get("/schedule-changes")
async def get_schedule_changes():
    profile = await _get_profile()
    if not profile:
        return []
    return await repo.get_changes(profile["course_id"])


@api.post("/schedule-changes/read-all")
async def mark_all_changes_read():
    await db.schedule_changes.update_many({"read": False}, {"$set": {"read": True}})
    return {"ok": True}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
