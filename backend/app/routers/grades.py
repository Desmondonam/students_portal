from fastapi import APIRouter, Depends
from app.database import get_supabase
from app.middleware import get_user_id
from app.schemas.grade import GradeCreate, GradeResponse

router = APIRouter()


@router.get("/", response_model=list[GradeResponse])
async def get_my_grades(uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = (
        sb.table("grades")
        .select("*, course:courses(name, code)")
        .eq("student_id", uid)
        .order("graded_at", desc=True)
        .execute()
    )
    return res.data


@router.get("/summary")
async def grade_summary(uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = sb.table("grades").select("score, max_score, course_id").eq("student_id", uid).execute()
    grades = res.data
    if not grades:
        return {"average": 0, "gpa": 0.0, "total": 0}
    avg = sum(g["score"] / g["max_score"] * 100 for g in grades) / len(grades)
    return {
        "average": round(avg, 2),
        "gpa": round(avg / 100 * 4, 2),
        "total": len(grades),
    }


@router.post("/", response_model=GradeResponse, summary="Record a grade (staff/admin)")
async def create_grade(payload: GradeCreate, uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = sb.table("grades").insert({
        "student_id": uid,
        **payload.model_dump(),
    }).execute()
    return res.data[0]
