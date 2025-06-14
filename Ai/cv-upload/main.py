from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Proper CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Your Angular frontend URL
    allow_credentials=True,
    allow_methods=["POST"],  # Must specify methods (can't be empty string)
    allow_headers=["*"],     # Or specify exact headers needed
)

@app.post("/upload-video/")
async def upload_video(file: UploadFile = File(...)):
    try:
        # Simulate processing the uploaded video
        filename = file.filename
        content_type = file.content_type
        
        # Optional: Validate file type
        if not content_type.startswith("video/"):
            return JSONResponse(
                status_code=400,
                content={"message": "Only video files are allowed", "status": "error"}
            )

        # Dummy processing logic
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