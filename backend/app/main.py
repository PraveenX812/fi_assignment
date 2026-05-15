from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, Base
from app.api.endpoints import users, notes, about

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Notes Service API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, tags=["Auth"])
app.include_router(notes.router, tags=["Notes"])
app.include_router(about.router, tags=["About"])
