from fastapi import APIRouter, Depends, HTTPException
from app.database import get_supabase
from app.middleware import get_user_id
from app.schemas.course import CourseCreate, CourseResponse, EnrollmentResponse

router = APIRouter()


@router.get("/", response_model=list[CourseResponse])
async def list_courses(_: str = Depends(get_user_id)):
    sb = get_supabase()
    res = sb.table("courses").select("*").order("name").execute()
    return res.data


@router.get("/my-enrollments", response_model=list[EnrollmentResponse])
async def my_enrollments(uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = (
        sb.table("enrollments")
        .select("*, course:courses(*)")
        .eq("student_id", uid)
        .eq("status", "active")
        .execute()
    )
    return res.data


@router.post("/enroll/{course_id}")
async def enroll_in_course(course_id: str, uid: str = Depends(get_user_id)):
    sb = get_supabase()
    existing = (
        sb.table("enrollments")
        .select("id")
        .eq("student_id", uid)
        .eq("course_id", course_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="Already enrolled in this course")
    res = sb.table("enrollments").insert({
        "student_id": uid,
        "course_id": course_id,
        "status": "active",
    }).execute()
    return res.data[0]


@router.get("/{course_id}/materials")
async def course_materials(course_id: str, _: str = Depends(get_user_id)):
    sb = get_supabase()
    res = (
        sb.table("course_materials")
        .select("*")
        .eq("course_id", course_id)
        .order("week_number")
        .order("order_index")
        .execute()
    )
    return res.data
