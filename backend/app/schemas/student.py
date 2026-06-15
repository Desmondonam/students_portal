from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional


class ProfileBase(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    student_id: Optional[str] = None
    profile_picture_url: Optional[str] = None
    year_of_study: Optional[int] = None
    course_name: Optional[str] = None


class ProfileUpdate(ProfileBase):
    pass


class ProfileResponse(ProfileBase):
    id: str
    email: str
    is_profile_complete: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
