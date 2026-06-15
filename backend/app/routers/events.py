from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.database import get_supabase
from app.middleware import get_user_id

router = APIRouter()


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    event_date: datetime
    end_date: Optional[datetime] = None
    category: Optional[str] = None
    max_attendees: Optional[int] = None


@router.get("/")
async def list_events(upcoming: bool = True, _: str = Depends(get_user_id)):
    sb = get_supabase()
    now = datetime.utcnow().isoformat()
    query = sb.table("events").select("*")
    if upcoming:
        query = query.gte("event_date", now).order("event_date")
    else:
        query = query.lt("event_date", now).order("event_date", desc=True)
    res = query.execute()
    return res.data


@router.post("/{event_id}/register")
async def register_for_event(event_id: str, uid: str = Depends(get_user_id)):
    sb = get_supabase()
    existing = (
        sb.table("event_registrations")
        .select("id")
        .eq("event_id", event_id)
        .eq("student_id", uid)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="Already registered")
    res = sb.table("event_registrations").insert({
        "event_id": event_id,
        "student_id": uid,
    }).execute()
    return {"message": "Registered successfully", "registration": res.data[0]}


@router.delete("/{event_id}/register")
async def unregister_from_event(event_id: str, uid: str = Depends(get_user_id)):
    sb = get_supabase()
    sb.table("event_registrations").delete().eq("event_id", event_id).eq("student_id", uid).execute()
    return {"message": "Unregistered successfully"}


@router.get("/my-registrations")
async def my_registrations(uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = (
        sb.table("event_registrations")
        .select("*, event:events(*)")
        .eq("student_id", uid)
        .execute()
    )
    return res.data


@router.post("/", summary="Create event (admin)")
async def create_event(payload: EventCreate, uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = sb.table("events").insert({
        **payload.model_dump(),
        "created_by": uid,
        "event_date": payload.event_date.isoformat(),
        "end_date": payload.end_date.isoformat() if payload.end_date else None,
    }).execute()
    return res.data[0]
