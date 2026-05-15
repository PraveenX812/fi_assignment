from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base

def _utcnow():
    return datetime.now(timezone.utc)

def _new_id():
    return str(uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=_new_id)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=_utcnow)
    notes = relationship("Note", back_populates="owner", cascade="all, delete-orphan")
    shared_notes = relationship("SharedNote", back_populates="user", cascade="all, delete-orphan")

class Note(Base):
    __tablename__ = "notes"
    id = Column(String, primary_key=True, default=_new_id)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    owner_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)
    owner = relationship("User", back_populates="notes")
    shared_with = relationship("SharedNote", back_populates="note", cascade="all, delete-orphan")
    versions = relationship("NoteVersion", back_populates="note", cascade="all, delete-orphan", order_by="NoteVersion.version_number.desc()")
    attachments = relationship("Attachment", back_populates="note", cascade="all, delete-orphan")

class SharedNote(Base):
    __tablename__ = "shared_notes"
    id = Column(String, primary_key=True, default=_new_id)
    note_id = Column(String, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    shared_with_user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    permission = Column(String, nullable=False, default="VIEWER")
    shared_at = Column(DateTime, default=_utcnow)
    note = relationship("Note", back_populates="shared_with")
    user = relationship("User", back_populates="shared_notes")
    __table_args__ = (UniqueConstraint("note_id", "shared_with_user_id", name="uq_note_shared_user"),)

class NoteVersion(Base):
    __tablename__ = "note_versions"
    id = Column(String, primary_key=True, default=_new_id)
    note_id = Column(String, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    version_number = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=_utcnow)
    note = relationship("Note", back_populates="versions")

class Attachment(Base):
    __tablename__ = "attachments"
    id = Column(String, primary_key=True, default=_new_id)
    note_id = Column(String, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    uploader_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    public_id = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    content_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=_utcnow)
    note = relationship("Note", back_populates="attachments")
