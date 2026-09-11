from pydantic import BaseModel
from typing import Optional

class Lesson(BaseModel):
    id: str
    subjectCode: str
    subject: str
    teacher: Optional[str] = None
    start: str
    end: str
    room: Optional[str] = None
    building: Optional[str] = None
    address: Optional[str] = None
    sourceUrl: Optional[str] = None
    updatedAt: Optional[str] = None

class Change(BaseModel):
    type: str
    lesson_id: str
    message: str
