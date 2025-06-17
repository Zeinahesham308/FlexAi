from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import PlainTextResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import curls
import pullup
import os

UPLOAD_DIR = "uploaded_videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app = FastAPI()

# Proper CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)

#string workout -> (Push up, Pull up, Shoulder Press, Incline bench press, Flat bench press, Squats, Lateral rasies, Triceps overhead extension, Lat pull down)
@app.post("/upload-video/")
async def upload_video(
    file: UploadFile = File(...),
    workoutType: str = Form(...)  # Receive the string here
):
    try:
        filename = file.filename
        content_type = file.content_type
        
        
        if not content_type.startswith("video/"):
            return JSONResponse(
                status_code=400,
                content={"message": "Only video files are allowed", "status": "error"}
            )


        # dummy 
        saved_path = os.path.join(UPLOAD_DIR, filename)
        with open(saved_path, "wb") as buffer:
            contents = await file.read()
            buffer.write(contents)
        if workoutType == "Curls":
            res = curls.process(video_path=saved_path)
        elif workoutType == "Pull Up":
            res = pullup.process(video_path=saved_path)
        return JSONResponse(
            content={
                "message": res,
            }
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Error processing file: {str(e)}", "status": "error"}
        )