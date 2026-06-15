from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal


class DocumentRequestCreate(BaseModel):
    document_type: Literal["transcript", "certificate", "letter"]
    reason: Optional[str] = None


class DocumentRequestResponse(DocumentRequestCreate):
    id: str
    student_id: str
    status: str
    requested_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentStatusUpdate(BaseModel):
    status: Literal["pending", "processing", "ready", "delivered"]
