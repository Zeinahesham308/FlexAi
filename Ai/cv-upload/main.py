from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

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
    workout: str = Form(...)  # Receive the string here
):
    try:
        filename = file.filename
        content_type = file.content_type
        
        
        if not content_type.startswith("video/"):
            return JSONResponse(
                status_code=400,
                content={"message": "Only video files are allowed", "status": "error"}
            )

        # dummy logic
        return JSONResponse(
            status_code=200,
            content={
                "message": f"Received file '{filename}' with type '{content_type}'",
                "status": "success",
                "filename": filename,
                "content_type": content_type,
                "size": file.size
            }
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Error processing file: {str(e)}", "status": "error"}
        )