from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import (
    students, courses, grades, attendance,
    finance, documents, messages, forums, events,
)

settings = get_settings()

app = FastAPI(
    title="NextEdge Student Portal API",
    description="Backend API for the NextEdge Student Portal",
    version="1.0.0",
)

_origins = settings.origins_list
_wildcard = _origins == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=not _wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students.router,   prefix="/api/students",   tags=["Students"])
app.include_router(courses.router,    prefix="/api/courses",    tags=["Courses"])
app.include_router(grades.router,     prefix="/api/grades",     tags=["Grades"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(finance.router,    prefix="/api/finance",    tags=["Finance"])
app.include_router(documents.router,  prefix="/api/documents",  tags=["Documents"])
app.include_router(messages.router,   prefix="/api/messages",   tags=["Messages"])
app.include_router(forums.router,     prefix="/api/forums",     tags=["Forums"])
app.include_router(events.router,     prefix="/api/events",     tags=["Events"])


@app.get("/")
async def root():
    return {"message": "NextEdge Student Portal API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok"}
