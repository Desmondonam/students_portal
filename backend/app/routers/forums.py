from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import get_supabase
from app.middleware import get_user_id

router = APIRouter()


class ThreadCreate(BaseModel):
    title: str
    content: str
    category: Optional[str] = None


class PostCreate(BaseModel):
    content: str


@router.get("/threads")
async def list_threads(category: Optional[str] = None, _: str = Depends(get_user_id)):
    sb = get_supabase()
    query = (
        sb.table("forum_threads")
        .select("*, author:profiles(id, full_name, profile_picture_url)")
        .order("is_pinned", desc=True)
        .order("created_at", desc=True)
    )
    if category:
        query = query.ilike("category", category)
    res = query.execute()
    return res.data


@router.post("/threads")
async def create_thread(payload: ThreadCreate, uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = sb.table("forum_threads").insert({
        "author_id": uid,
        "title": payload.title,
        "content": payload.content,
        "category": payload.category,
        "views": 0,
        "is_pinned": False,
    }).execute()
    return res.data[0]


@router.get("/threads/{thread_id}")
async def get_thread(thread_id: str, _: str = Depends(get_user_id)):
    sb = get_supabase()
    # Increment views
    sb.rpc("increment_thread_views", {"thread_id": thread_id}).execute()
    res = (
        sb.table("forum_threads")
        .select("*, author:profiles(id, full_name, profile_picture_url)")
        .eq("id", thread_id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Thread not found")
    posts_res = (
        sb.table("forum_posts")
        .select("*, author:profiles(id, full_name, profile_picture_url)")
        .eq("thread_id", thread_id)
        .order("created_at")
        .execute()
    )
    return {**res.data, "posts": posts_res.data}


@router.post("/threads/{thread_id}/posts")
async def add_post(thread_id: str, payload: PostCreate, uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = sb.table("forum_posts").insert({
        "thread_id": thread_id,
        "author_id": uid,
        "content": payload.content,
    }).execute()
    return res.data[0]
