from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CourseBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    credits: int = 3
    instructor: Optional[str] = None
    department: Optional[str] = None
    duration_weeks: Optional[int] = None


class CourseCreate(CourseBase):
    pass


class CourseResponse(CourseBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class EnrollmentResponse(BaseModel):
    id: str
    student_id: str
    course_id: str
    enrolled_at: datetime
    status: str
    course: Optional[CourseResponse] = None

    class Config:
        from_attributes = True
