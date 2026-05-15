from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str

class MessageResponse(BaseModel):
    message: str

class NoteCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)

class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = Field(None, min_length=1)

class NoteResponse(BaseModel):
    id: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class ShareRequest(BaseModel):
    share_with_email: EmailStr
    permission: Optional[str] = Field("VIEWER", pattern=r"^(VIEWER|EDITOR)$")

class NoteVersionResponse(BaseModel):
    id: str
    note_id: str
    title: str
    content: str
    version_number: int
    created_at: datetime
    class Config:
        from_attributes = True

class AttachmentResponse(BaseModel):
    id: str
    note_id: str
    filename: str
    file_url: str
    size_bytes: int
    content_type: str
    created_at: datetime
    class Config:
        from_attributes = True

class AboutResponse(BaseModel):
    name: str
    email: str
    my_features: dict = Field(..., alias="my features")
    class Config:
        populate_by_name = True
