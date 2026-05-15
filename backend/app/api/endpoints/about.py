from fastapi import APIRouter
from app.schemas.schemas import AboutResponse

router = APIRouter()

@router.get("/about", response_model=AboutResponse)
def about():
    return {
        "name": "Praveen Rawat",
        "email": "praveenrawat784@gmail.com",
        "my features": {
            "Version History & Restore": "Every edit creates a snapshot. Chose this for data integrity.",
            "Granular Share Permissions": "VIEWER/EDITOR levels for shared notes.",
            "File Attachments": "cloud storage for attachments."
        }
    }
