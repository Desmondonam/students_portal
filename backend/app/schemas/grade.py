from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal


class GradeCreate(BaseModel):
    course_id: str
    assignment_name: str
    score: float
    max_score: float = 100.0
    grade_type: Literal["assignment", "midterm", "final", "quiz"]


class GradeResponse(GradeCreate):
    id: str
    student_id: str
    graded_at: datetime

    class Config:
        from_attributes = True


class AttendanceCreate(BaseModel):
    course_id: str
    date: str
    status: Literal["present", "absent", "late", "excused"]
    notes: Optional[str] = None


class AttendanceResponse(AttendanceCreate):
    id: str
    student_id: str

    class Config:
        from_attributes = True
