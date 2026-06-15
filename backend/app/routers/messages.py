from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.database import get_supabase
from app.middleware import get_user_id

router = APIRouter()


class MessageCreate(BaseModel):
    receiver_id: str
    content: str


@router.get("/")
async def get_conversations(uid: str = Depends(get_user_id)):
    """Return all messages for the current user (both sent and received)."""
    sb = get_supabase()
    res = (
        sb.table("messages")
        .select("*, sender:profiles!sender_id(id, full_name, profile_picture_url), receiver:profiles!receiver_id(id, full_name, profile_picture_url)")
        .or_(f"sender_id.eq.{uid},receiver_id.eq.{uid}")
        .order("sent_at", desc=True)
        .execute()
    )
    return res.data


@router.get("/thread/{contact_id}")
async def get_thread(contact_id: str, uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = (
        sb.table("messages")
        .select("*")
        .or_(
            f"and(sender_id.eq.{uid},receiver_id.eq.{contact_id}),"
            f"and(sender_id.eq.{contact_id},receiver_id.eq.{uid})"
        )
        .order("sent_at")
        .execute()
    )
    # Mark messages as read
    sb.table("messages").update({"is_read": True}).eq("receiver_id", uid).eq("sender_id", contact_id).execute()
    return res.data


@router.post("/")
async def send_message(payload: MessageCreate, uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = sb.table("messages").insert({
        "sender_id": uid,
        "receiver_id": payload.receiver_id,
        "content": payload.content,
        "is_read": False,
    }).execute()
    return res.data[0]
