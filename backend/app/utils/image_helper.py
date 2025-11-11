import os
import uuid
from fastapi import UploadFile, HTTPException
from PIL import Image
import io

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename: str) -> bool:
    if not filename or "." not in filename:
        return False
    
    file_extension = filename.rsplit(".", 1)[1].lower()
    return file_extension in ALLOWED_EXTENSIONS

async def save_upload_file(upload_file: UploadFile) -> str:
    # Check if file has a name
    if not upload_file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file size
    contents = await upload_file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    
    # Check file type
    if not allowed_file(upload_file.filename):
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Generate unique filename
    file_extension = upload_file.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Validate and process image
    try:
        image = Image.open(io.BytesIO(contents))
        
        # Check if image is valid
        image.verify()
        
        # Reopen the image for processing (verify() closes the image)
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        
        # Resize if too large (max 800px width)
        if image.width > 800:
            ratio = 800 / image.width
            new_height = int(image.height * ratio)
            image = image.resize((800, new_height), Image.Resampling.LANCZOS)
        
        # Save processed image
        # Use appropriate format based on extension
        if file_extension in ["jpg", "jpeg"]:
            image.save(file_path, "JPEG", quality=85)
        elif file_extension == "png":
            image.save(file_path, "PNG", optimize=True)
        elif file_extension == "gif":
            image.save(file_path, "GIF")
        elif file_extension == "webp":
            image.save(file_path, "WEBP", quality=85)
        else:
            # Default to JPEG
            image.save(file_path, "JPEG", quality=85)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
    
    return filename