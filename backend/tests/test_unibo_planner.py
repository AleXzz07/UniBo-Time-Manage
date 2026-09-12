"""Backend tests for UniBo Planner API.

Covers:
- health (GET /api/)
- onboarding + real UniBo sync
- profile
- sync + sync-status
- lessons range + single lesson
- subjects list + patch
- tasks CRUD + toggle
- study sessions CRUD + completed -> subject minutes
- personal events CRUD
- schedule changes list + read-all
"""

import os
import time
from datetime import date

import pytest
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ONBOARDING = {
    "name": "Studente",
    "course_id": "ingegneria-meccanica-bologna",
    "year_of_course": 1,
    "group": "A-K",
    "academic_year": "2026/2027",
}


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def profile(client):
    r = client.get(f"{API}/me", timeout=30)
    if r.status_code == 200 and r.json():
        return r.json()
    r = client.post(f"{API}/onboarding", json=ONBOARDING, timeout=120)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["sync"].get("event_count", 0) > 0
    return data["profile"]


# ------------------- meta -------------------
class TestMeta:
    def test_health(self, client):
        r = client.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("message") == "UniBo Planner API"

    def test_courses(self, client):
        r = client.get(f"{API}/courses", timeout=15)
        assert r.status_code == 200
        courses = r.json()
        assert any(c["id"] == "ingegneria-meccanica-bologna" for c in courses)


# ------------------- onboarding / sync -------------------
class TestOnboardingSync:
    def test_me(self, client, profile):
        r = client.get(f"{API}/me", timeout=15)
        assert r.status_code == 200
        me = r.json()
        assert me["course_id"] == "ingegneria-meccanica-bologna"
        assert me["group"] == "A-K"

    def test_sync(self, client, profile):
        r = client.post(f"{API}/sync", timeout=120)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("status") in ("ok", "cache")
        assert d.get("event_count", 0) > 0

    def test_sync_status(self, client, profile):
        r = client.get(f"{API}/sync-status", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d is not None
        assert d.get("event_count", 0) > 0
        assert d.get("last_success")


# ------------------- lessons -------------------
class TestLessons:
    def test_lessons_range(self, client, profile):
        r = client.get(
            f"{API}/lessons", params={"start": "2026-09-14", "end": "2026-09-20"}, timeout=30
        )
        assert r.status_code == 200
        lessons = r.json()
        assert isinstance(lessons, list) and len(lessons) > 0
        for l in lessons:
            # group filter: null OR user group A-K
            assert l.get("gruppo") in (None, "A-K")
            assert l["date"] >= "2026-09-14" and l["date"] <= "2026-09-20"
            assert "stable_id" in l and "subject_key" in l

    def test_lesson_detail(self, client, profile):
        r = client.get(
            f"{API}/lessons", params={"start": "2026-09-14", "end": "2026-09-20"}, timeout=30
        )
        assert r.status_code == 200
        first = r.json()[0]
        sid = first["stable_id"]
        r2 = client.get(f"{API}/lessons/{sid}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["stable_id"] == sid

    def test_lesson_404(self, client, profile):
        r = client.get(f"{API}/lessons/does-not-exist", timeout=15)
        assert r.status_code == 404


# ------------------- subjects -------------------
class TestSubjects:
    def test_subjects_list(self, client, profile):
        r = client.get(f"{API}/subjects", timeout=15)
        assert r.status_code == 200
        subs = r.json()
        assert isinstance(subs, list) and len(subs) >= 4
        for s in subs:
            assert "subject_key" in s
            assert "color_token" in s
            assert "completed_minutes" in s

    def test_subject_patch(self, client, profile):
        subs = client.get(f"{API}/subjects", timeout=15).json()
        key = subs[0]["subject_key"]
        payload = {"exam_date": "2027-01-20", "planned_hours": 42, "topics": ["cap1", "cap2"]}
        r = client.patch(f"{API}/subjects/{key}", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        updated = r.json()
        assert updated["exam_date"] == "2027-01-20"
        assert updated["planned_hours"] == 42
        assert updated["topics"] == ["cap1", "cap2"]
        # verify via GET
        subs2 = client.get(f"{API}/subjects", timeout=15).json()
        found = next(s for s in subs2 if s["subject_key"] == key)
        assert found["exam_date"] == "2027-01-20"

    def test_subject_patch_404(self, client, profile):
        r = client.patch(f"{API}/subjects/does-not-exist", json={"planned_hours": 1}, timeout=15)
        assert r.status_code == 404


# ------------------- tasks -------------------
class TestTasks:
    def test_task_full_cycle(self, client, profile):
        subs = client.get(f"{API}/subjects", timeout=15).json()
        skey = subs[0]["subject_key"]
        payload = {
            "title": "TEST_task_pytest",
            "subject_key": skey,
            "due_date": "2026-09-15",
            "estimated_minutes": 90,
            "priority": "high",
        }
        r = client.post(f"{API}/tasks", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        t = r.json()
        assert t["title"] == "TEST_task_pytest"
        assert t["subject_key"] == skey
        assert t["color_token"] is not None
        tid = t["id"]

        # list contains task
        lst = client.get(f"{API}/tasks", timeout=15).json()
        assert any(x["id"] == tid for x in lst)

        # toggle done
        r2 = client.patch(f"{API}/tasks/{tid}", json={"status": "done"}, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["status"] == "done"
        assert r2.json()["completed_at"] is not None

        # toggle back
        r3 = client.patch(f"{API}/tasks/{tid}", json={"status": "todo"}, timeout=15)
        assert r3.status_code == 200
        assert r3.json()["completed_at"] is None

        # edit title
        r4 = client.patch(f"{API}/tasks/{tid}", json={"title": "TEST_task_updated"}, timeout=15)
        assert r4.status_code == 200
        assert r4.json()["title"] == "TEST_task_updated"

        # delete (soft)
        r5 = client.delete(f"{API}/tasks/{tid}", timeout=15)
        assert r5.status_code == 200
        lst2 = client.get(f"{API}/tasks", timeout=15).json()
        assert not any(x["id"] == tid for x in lst2)

    def test_task_delete_404(self, client, profile):
        r = client.delete(f"{API}/tasks/does-not-exist", timeout=15)
        assert r.status_code == 404


# ------------------- study sessions -------------------
class TestStudySessions:
    def test_full_cycle_and_completed_minutes(self, client, profile):
        subs_before = client.get(f"{API}/subjects", timeout=15).json()
        target = subs_before[0]
        skey = target["subject_key"]
        before = target["completed_minutes"]

        payload = {
            "subject_key": skey,
            "date": "2026-09-15",
            "start": "2026-09-15T14:00:00",
            "end": "2026-09-15T15:30:00",
            "planned_minutes": 90,
        }
        r = client.post(f"{API}/study-sessions", json=payload, timeout=15)
        assert r.status_code == 200
        sess = r.json()
        sid = sess["id"]

        # list
        lst = client.get(
            f"{API}/study-sessions", params={"start": "2026-09-14", "end": "2026-09-20"}, timeout=15
        ).json()
        assert any(x["id"] == sid for x in lst)

        # mark completed
        r2 = client.patch(f"{API}/study-sessions/{sid}", json={"completed": True}, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["completed"] is True

        # subject minutes bumped
        subs_after = client.get(f"{API}/subjects", timeout=15).json()
        found = next(s for s in subs_after if s["subject_key"] == skey)
        assert found["completed_minutes"] == before + 90

        # delete
        r3 = client.delete(f"{API}/study-sessions/{sid}", timeout=15)
        assert r3.status_code == 200

        # after delete, minutes back
        subs_final = client.get(f"{API}/subjects", timeout=15).json()
        found2 = next(s for s in subs_final if s["subject_key"] == skey)
        assert found2["completed_minutes"] == before


# ------------------- personal events -------------------
class TestPersonalEvents:
    def test_full_cycle(self, client, profile):
        payload = {
            "title": "TEST_personal",
            "date": "2026-09-15",
            "start": "2026-09-15T18:00:00",
            "end": "2026-09-15T19:00:00",
        }
        r = client.post(f"{API}/personal-events", json=payload, timeout=15)
        assert r.status_code == 200
        eid = r.json()["id"]

        lst = client.get(
            f"{API}/personal-events",
            params={"start": "2026-09-14", "end": "2026-09-20"},
            timeout=15,
        ).json()
        assert any(x["id"] == eid for x in lst)

        r2 = client.delete(f"{API}/personal-events/{eid}", timeout=15)
        assert r2.status_code == 200


# ------------------- schedule changes -------------------
class TestScheduleChanges:
    def test_list_and_read_all(self, client, profile):
        r = client.get(f"{API}/schedule-changes", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        r2 = client.post(f"{API}/schedule-changes/read-all", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["ok"] is True
