"""Pydantic models for UniBo Planner.

We use plain string `id`s (uuid or a deterministic stable id) instead of Mongo
ObjectId, and always store documents with that string `id` while excluding the
raw `_id` from every response (projection {"_id": 0}). This keeps everything
JSON-serialisable and avoids ObjectId leakage entirely.

All datetimes coming from UniBo are already local Europe/Rome wall-clock times
(e.g. "2026-09-14T09:00:00"); we keep them as naive ISO strings and treat them
consistently as Rome local time across the whole stack.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field


def new_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Lessons
# ---------------------------------------------------------------------------
class LessonEvent(BaseModel):
    id: str = Field(default_factory=new_id)
    stable_id: str                      # cod_modulo + start  (unique occurrence)
    course_id: str
    cod_modulo: str
    subject_key: str                    # groups occurrences into a subject
    subject_name: str
    docente: Optional[str] = None
    date: str                           # YYYY-MM-DD
    start: str                          # ISO local  YYYY-MM-DDTHH:MM:SS
    end: str
    start_time: str                     # HH:MM
    end_time: str                       # HH:MM
    aula: Optional[str] = None
    edificio: Optional[str] = None
    indirizzo: Optional[str] = None
    piano: Optional[str] = None
    campus: str = "Bologna"
    gruppo: Optional[str] = None        # "A-K" / "L-Z" / None
    teledidattica: bool = False
    cfu: Optional[float] = None
    note: Optional[str] = None
    color_token: str = "subjectCAD"
    source_url: str
    last_updated: str = Field(default_factory=now_iso)


# ---------------------------------------------------------------------------
# Subjects (derived from lessons, enriched by the user)
# ---------------------------------------------------------------------------
class Subject(BaseModel):
    id: str = Field(default_factory=new_id)
    course_id: str
    subject_key: str
    name: str
    docente: Optional[str] = None
    color_token: str = "subjectCAD"
    cfu: Optional[float] = None
    exam_date: Optional[str] = None      # YYYY-MM-DD
    planned_hours: float = 30
    completed_minutes: int = 0
    topics: List[str] = Field(default_factory=list)
    attended: bool = True
    updated_at: str = Field(default_factory=now_iso)


class SubjectUpdate(BaseModel):
    exam_date: Optional[str] = None
    planned_hours: Optional[float] = None
    topics: Optional[List[str]] = None
    attended: Optional[bool] = None


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------
class Task(BaseModel):
    id: str = Field(default_factory=new_id)
    title: str
    subject_key: Optional[str] = None
    subject_name: Optional[str] = None
    color_token: Optional[str] = None
    due_date: Optional[str] = None       # YYYY-MM-DD
    estimated_minutes: int = 60
    priority: str = "medium"             # low | medium | high
    status: str = "todo"                 # todo | done
    notes: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)
    completed_at: Optional[str] = None
    deleted_at: Optional[str] = None


class TaskCreate(BaseModel):
    title: str
    subject_key: Optional[str] = None
    due_date: Optional[str] = None
    estimated_minutes: int = 60
    priority: str = "medium"
    notes: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    subject_key: Optional[str] = None
    due_date: Optional[str] = None
    estimated_minutes: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Study sessions
# ---------------------------------------------------------------------------
class StudySession(BaseModel):
    id: str = Field(default_factory=new_id)
    subject_key: Optional[str] = None
    subject_name: Optional[str] = None
    color_token: Optional[str] = None
    date: str                            # YYYY-MM-DD
    start: str                           # ISO local
    end: str
    planned_minutes: int = 90
    completed: bool = False
    notes: Optional[str] = None
    source: str = "manual"               # manual | planner
    created_at: str = Field(default_factory=now_iso)
    deleted_at: Optional[str] = None


class StudySessionCreate(BaseModel):
    subject_key: Optional[str] = None
    date: str
    start: str
    end: str
    planned_minutes: int = 90
    notes: Optional[str] = None
    source: str = "manual"


class StudySessionUpdate(BaseModel):
    start: Optional[str] = None
    end: Optional[str] = None
    completed: Optional[bool] = None
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Personal events
# ---------------------------------------------------------------------------
class PersonalEvent(BaseModel):
    id: str = Field(default_factory=new_id)
    title: str
    date: str
    start: str
    end: str
    notes: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    deleted_at: Optional[str] = None


class PersonalEventCreate(BaseModel):
    title: str
    date: str
    start: str
    end: str
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Schedule changes
# ---------------------------------------------------------------------------
class ScheduleChange(BaseModel):
    id: str = Field(default_factory=new_id)
    course_id: str
    type: str                            # room_change | time_change | cancelled | new
    subject_name: str
    subject_key: Optional[str] = None
    date: str
    message: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    detected_at: str = Field(default_factory=now_iso)
    read: bool = False


# ---------------------------------------------------------------------------
# Sync status
# ---------------------------------------------------------------------------
class SyncStatus(BaseModel):
    id: str = Field(default_factory=new_id)
    course_id: str
    status: str = "ok"                   # ok | error | cache
    last_sync: Optional[str] = None
    last_success: Optional[str] = None
    source_url: Optional[str] = None
    message: Optional[str] = None
    event_count: int = 0
    updated_at: str = Field(default_factory=now_iso)


# ---------------------------------------------------------------------------
# User profile (single user)
# ---------------------------------------------------------------------------
class UserProfile(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str = "Studente"
    university: str = "Università di Bologna"
    course_id: str
    course_name: str
    academic_year: str = "2026/2027"
    year_of_course: int = 1
    curriculum: Optional[str] = None
    group: Optional[str] = None          # "A-K" / "L-Z"
    onboarded: bool = True
    created_at: str = Field(default_factory=now_iso)


class OnboardingRequest(BaseModel):
    name: str = "Studente"
    course_id: str = "ingegneria-meccanica-bologna"
    academic_year: str = "2026/2027"
    year_of_course: int = 1
    curriculum: Optional[str] = None
    group: Optional[str] = None
