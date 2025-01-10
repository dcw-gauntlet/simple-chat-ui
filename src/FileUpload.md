# File Upload

When a user sends a message they can optionally add a file.  This works by uploading the file to the server first.  The server returns a file ID which can be used in the message.

Messages with files attached should have a component on the message that displays the file name and type along with a download button.

# Server code


class FileUploadResponse(Response):
    file_id: str

@app.post("/upload_file")
async def upload_file(
    file: UploadFile = File(...),
) -> FileUploadResponse:
    """
    Upload a file and get a file ID back.
    The file ID can then be used in a message to reference this file.
    """
    try:
        file_id = str(uuid.uuid4())
        file_content = await file.read()
        
        success = dl.save_file(
            file_id=file_id,
            filename=file.filename,
            content_type=file.content_type,
            data=file_content
        )
        
        if not success:
            return FileUploadResponse(message="Failed to save file", ok=False, file_id=None)
            
        return FileUploadResponse(
            message="File uploaded successfully",
            ok=True,
            file_id=file_id
        )
        
    except Exception as e:
        return FileUploadResponse(
            message=f"Error uploading file: {str(e)}",
            ok=False,
            file_id=None
        )

@app.get("/download_file/{file_id}")
async def download_file(file_id: str):
    """
    Download a file by its ID.
    """
    file_data = dl.get_file(file_id)
    if not file_data:
        raise HTTPException(status_code=404, detail="File not found")
        
    return FastAPIResponse(
        content=file_data['data'],
        media_type=file_data['content_type'],
        headers={
            'Content-Disposition': f'attachment; filename="{file_data["filename"]}"'
        }
    )


# Displaying a file in a message

When a message has a file attached we want to display it.  The FileDisplay component should show the file name, type, and a download button.  The file should be below the message and above the emoji reactions.