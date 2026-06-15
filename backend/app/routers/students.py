from fastapi import APIRouter, Depends, HTTPException
from app.database import get_supabase
from app.middleware import get_current_user, get_user_id
from app.schemas.student import ProfileUpdate, ProfileResponse

router = APIRouter()


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = sb.table("profiles").select("*").eq("id", uid).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data


@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(payload: ProfileUpdate, uid: str = Depends(get_user_id)):
    sb = get_supabase()
    update_data = payload.model_dump(exclude_none=True)
    update_data["updated_at"] = "now()"
    res = (
        sb.table("profiles")
        .update(update_data)
        .eq("id", uid)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data[0]


@router.get("/", summary="List all students (admin only)")
async def list_students(user: dict = Depends(get_current_user)):
    sb = get_supabase()
    res = sb.table("profiles").select("id, full_name, email, student_id, course_name").execute()
    return res.data
