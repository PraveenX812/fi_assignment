import math
from datetime import datetime, timezone
import cloudinary.uploader
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.core.config import settings
from app.api.deps import get_db, get_current_user
from app.models.models import Note, SharedNote, NoteVersion, Attachment, User
from app.schemas.schemas import NoteCreate, NoteUpdate, NoteResponse, ShareRequest, NoteVersionResponse, AttachmentResponse, MessageResponse

router = APIRouter()

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

def _get_owned_note(note_id: str, user_id: str, db: Session) -> Note:
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note: raise HTTPException(404, "Note not found")
    if note.owner_id != user_id: raise HTTPException(403, "Forbidden")
    return note

def _get_accessible_note(note_id: str, user_id: str, db: Session) -> Note:
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note: raise HTTPException(404, "Note not found")
    if note.owner_id == user_id: return note
    if db.query(SharedNote).filter(SharedNote.note_id == note_id, SharedNote.shared_with_user_id == user_id).first():
        return note
    raise HTTPException(404, "Note not found")

def _can_edit(note_id: str, user_id: str, db: Session) -> Note:
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note: raise HTTPException(404, "Note not found")
    if note.owner_id == user_id: return note
    shared = db.query(SharedNote).filter(SharedNote.note_id == note_id, SharedNote.shared_with_user_id == user_id).first()
    if shared and shared.permission == "EDITOR": return note
    raise HTTPException(403, "Read-only or no access")

def _save_version(note: Note, db: Session):
    latest = db.query(NoteVersion).filter(NoteVersion.note_id == note.id).order_by(NoteVersion.version_number.desc()).first()
    next_v = (latest.version_number + 1) if latest else 1
    db.add(NoteVersion(note_id=note.id, title=note.title, content=note.content, version_number=next_v))

@router.post("/notes", response_model=NoteResponse, status_code=201)
def create_note(payload: NoteCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    note = Note(title=payload.title, content=payload.content, owner_id=user.id)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.get("/notes", response_model=list[NoteResponse])
def list_notes(page: int = Query(None, ge=1), per_page: int = Query(10, ge=1), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    shared_note_ids = db.query(SharedNote.note_id).filter(SharedNote.shared_with_user_id == user.id)
    query = db.query(Note).filter(
        or_(Note.owner_id == user.id, Note.id.in_(shared_note_ids))
    ).order_by(Note.created_at.desc())
    if page: return query.offset((page-1)*per_page).limit(per_page).all()
    return query.all()

@router.get("/notes/{note_id}", response_model=NoteResponse)
def get_note(note_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _get_accessible_note(note_id, user.id, db)

@router.put("/notes/{note_id}", response_model=NoteResponse)
def update_note(note_id: str, payload: NoteUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    note = _can_edit(note_id, user.id, db)
    _save_version(note, db)
    if payload.title: note.title = payload.title
    if payload.content: note.content = payload.content
    note.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(note)
    return note

@router.delete("/notes/{note_id}", status_code=204)
def delete_note(note_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    note = _get_owned_note(note_id, user.id, db)
    for a in note.attachments:
        try: cloudinary.uploader.destroy(a.public_id)
        except: pass
    db.delete(note)
    db.commit()

@router.post("/notes/{note_id}/share", response_model=MessageResponse)
def share_note(note_id: str, payload: ShareRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _get_owned_note(note_id, user.id, db)
    target = db.query(User).filter(User.email == payload.share_with_email).first()
    if not target: raise HTTPException(404, "User not found")
    if target.id == user.id: raise HTTPException(400, "Cannot share with yourself")
    existing = db.query(SharedNote).filter(SharedNote.note_id == note_id, SharedNote.shared_with_user_id == target.id).first()
    if existing:
        existing.permission = payload.permission
        db.commit()
        return {"message": "Permission updated"}
    db.add(SharedNote(note_id=note_id, shared_with_user_id=target.id, permission=payload.permission))
    db.commit()
    return {"message": "Shared successfully"}

@router.get("/notes/{note_id}/versions", response_model=list[NoteVersionResponse])
def list_versions(note_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    note = _get_accessible_note(note_id, user.id, db)
    return db.query(NoteVersion).filter(NoteVersion.note_id == note.id).order_by(NoteVersion.version_number.desc()).all()

@router.post("/notes/{note_id}/restore/{version_id}", response_model=NoteResponse)
def restore_version(note_id: str, version_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    note = _can_edit(note_id, user.id, db)
    v = db.query(NoteVersion).filter(NoteVersion.id == version_id, NoteVersion.note_id == note_id).first()
    if not v: raise HTTPException(404, "Version not found")
    _save_version(note, db)
    note.title = v.title
    note.content = v.content
    db.commit()
    return note

@router.post("/notes/{note_id}/attachments", response_model=AttachmentResponse, status_code=201)
async def upload_attachment(note_id: str, file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    note = _can_edit(note_id, user.id, db)
    if file.content_type not in settings.ALLOWED_FILE_TYPES: raise HTTPException(400, "Invalid file type")
    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024: raise HTTPException(400, "File too large")
    res = cloudinary.uploader.upload(contents, folder=f"notes/{note_id}", resource_type="auto")
    a = Attachment(note_id=note_id, uploader_id=user.id, filename=file.filename, file_url=res["secure_url"], public_id=res["public_id"], size_bytes=len(contents), content_type=file.content_type)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a

@router.get("/search", response_model=list[NoteResponse])
def search_notes(q: str = Query(..., min_length=1), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = f"%{q}%"
    shared_note_ids = db.query(SharedNote.note_id).filter(SharedNote.shared_with_user_id == user.id)
    return db.query(Note).filter(
        or_(Note.owner_id == user.id, Note.id.in_(shared_note_ids)),
        or_(Note.title.ilike(p), Note.content.ilike(p))
    ).order_by(Note.created_at.desc()).all()
