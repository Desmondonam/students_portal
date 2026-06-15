from fastapi import APIRouter, Depends
from app.database import get_supabase
from app.middleware import get_user_id
from app.schemas.grade import AttendanceCreate, AttendanceResponse

router = APIRouter()


@router.get("/", response_model=list[AttendanceResponse])
async def get_attendance(uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = (
        sb.table("attendance")
        .select("*, course:courses(name, code)")
        .eq("student_id", uid)
        .order("date", desc=True)
        .execute()
    )
    return res.data


@router.get("/summary")
async def attendance_summary(uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = sb.table("attendance").select("status, course_id").eq("student_id", uid).execute()
    records = res.data
    if not records:
        return {"rate": 0, "total": 0, "present": 0}
    present = sum(1 for r in records if r["status"] in ("present", "late"))
    return {
        "rate": round(present / len(records) * 100, 1),
        "total": len(records),
        "present": present,
    }


@router.post("/", response_model=AttendanceResponse, summary="Record attendance (staff)")
async def record_attendance(payload: AttendanceCreate, uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = sb.table("attendance").insert({
        "student_id": uid,
        **payload.model_dump(),
    }).execute()
    return res.data[0]
