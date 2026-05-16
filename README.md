# Assignment detail

This is a full-stack application built for managing notes. It includes a FastAPI backend and a React frontend.

## Features
- User registration and JWT-based authentication.
- Create, read, update, and delete personal notes.
- Share notes with other users with Viewer or Editor permissions.
- Version history: Every edit creates a snapshot that can be restored.
- File attachments: Support for uploading images and PDFs via Cloudinary.
- Search: Full-text search for finding notes quickly.
- Responsive dark-mode interface.

## Tech Stack
- Backend: Python, FastAPI, SQLAlchemy, SQLite.
- Frontend: React, Vite, Vanilla CSS.
- Infrastructure: Docker, Cloudinary (for file storage).

## Local Setup

### Backend
1. Go to the backend folder.
2. Create a virtual environment: python -m venv venv
3. Activate it: venv\Scripts\activate 
4. Install dependencies: pip install -r requirements.txt
5. Set up your .env file with your SECRET_KEY and Cloudinary credentials.
6. Run the server: uvicorn app.main:app --reload

### Frontend
1. Go to the frontend folder.
2. Install dependencies: npm install
3. Run the development server: npm run dev

### Docker
Alternatively, run the entire stack using Docker Compose from the root directory:
docker-compose up --build

## API Documentation
Once the backend is running, visit /docs to view the interactive Swagger documentation.
