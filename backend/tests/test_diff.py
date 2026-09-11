from app.diff import detect_changes
from app.models import Lesson


def L(room='A', start='2026-09-14T09:00:00+02:00', end='2026-09-14T11:00:00+02:00', id='x'):
    return Lesson(id=id, subjectCode='1', subject='Test', start=start, end=end, room=room)


def test_room_change():
    changes = detect_changes([L('A')], [L('B')])
    assert any(x.type == 'room' for x in changes)


def test_time_change():
    changes = detect_changes(
        [L(start='2026-09-14T09:00:00+02:00', end='2026-09-14T11:00:00+02:00')],
        [L(start='2026-09-14T10:00:00+02:00', end='2026-09-14T12:00:00+02:00')],
    )
    assert any(x.type == 'time' for x in changes)


def test_multiple_lessons_same_subject_same_day_are_not_collapsed():
    old = [
        L(start='2026-09-14T09:00:00+02:00', end='2026-09-14T11:00:00+02:00', id='a'),
        L(start='2026-09-14T15:00:00+02:00', end='2026-09-14T17:00:00+02:00', id='b'),
    ]
    new = [
        L(start='2026-09-14T09:00:00+02:00', end='2026-09-14T11:00:00+02:00', id='a2'),
        L(room='B', start='2026-09-14T15:00:00+02:00', end='2026-09-14T17:00:00+02:00', id='b2'),
    ]
    changes = detect_changes(old, new)
    assert len([x for x in changes if x.type == 'room']) == 1
    assert not any(x.type in {'new', 'cancelled'} for x in changes)
