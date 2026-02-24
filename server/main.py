import os
import logging
from dotenv import load_dotenv

# Load env before importing modules that read env at import time
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Routine Bright Animation Backend")

BACKEND_CORS_ORIGIN = os.getenv("BACKEND_CORS_ORIGIN", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[BACKEND_CORS_ORIGIN, "http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated videos and recordings as static files so the frontend can play them
VIDEOS_DIR = os.path.join(os.path.dirname(__file__), "videos")
os.makedirs(VIDEOS_DIR, exist_ok=True)
app.mount("/videos", StaticFiles(directory=VIDEOS_DIR), name="videos")

# Recordings resolver: use MP4s from server/recordings (no moviepy dependency)
from recordings_resolver import resolve_recording


@app.post("/generate-animation")
async def generate_animation_endpoint(
    prompt: str = Query(..., description="Flashcard text, e.g., 'Brush your teeth'"),
    request: Request = None,
):
    """
    Return a video URL by matching the prompt to pre-recorded MP4s in server/recordings.
    No external models – videos are generated from the prompt-to-video mapping only.
    """
    try:
        local_path = resolve_recording(prompt, VIDEOS_DIR, filename_prefix="animation")
        if not local_path:
            logging.warning("No video match for prompt: %s", prompt)
            raise HTTPException(
                status_code=404,
                detail=f"No video found for this step. Try phrases like 'wake up', 'brush teeth', 'get dressed', 'eat breakfast', 'read a book', 'night clothes'.",
            )
        base = str(request.base_url).rstrip("/") if request else ""
        filename = os.path.basename(local_path)
        public_url = f"{base}/videos/{filename}" if base else f"/videos/{filename}"
        return {"video_path": public_url}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Error in /generate-animation endpoint")
        raise HTTPException(status_code=500, detail=str(e))