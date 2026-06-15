from fastapi import APIRouter, Depends, HTTPException
from app.database import get_supabase
from app.middleware import get_user_id
from app.schemas.document import DocumentRequestCreate, DocumentRequestResponse, DocumentStatusUpdate

router = APIRouter()


@router.get("/", response_model=list[DocumentRequestResponse])
async def list_my_requests(uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = (
        sb.table("document_requests")
        .select("*")
        .eq("student_id", uid)
        .order("requested_at", desc=True)
        .execute()
    )
    return res.data


@router.post("/", response_model=DocumentRequestResponse)
async def create_request(payload: DocumentRequestCreate, uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = sb.table("document_requests").insert({
        "student_id": uid,
        **payload.model_dump(),
        "status": "pending",
    }).execute()
    return res.data[0]


@router.patch("/{request_id}/status", response_model=DocumentRequestResponse, summary="Update status (admin)")
async def update_status(
    request_id: str,
    payload: DocumentStatusUpdate,
    _: str = Depends(get_user_id),
):
    sb = get_supabase()
    res = (
        sb.table("document_requests")
        .update({"status": payload.status, "updated_at": "now()"})
        .eq("id", request_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Request not found")
    return res.data[0]
