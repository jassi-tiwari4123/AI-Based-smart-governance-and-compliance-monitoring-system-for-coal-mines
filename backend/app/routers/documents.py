from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from app.database.connection import get_database
from app.middleware.auth import get_current_user
from app.services.document.ocr_service import OCRService
from app.services.audit.audit_service import log_audit_event
from app.config import settings
from datetime import datetime
import os
import shutil

router = APIRouter(prefix="/api/documents", tags=["Document Management & OCR"])

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    mineId: str = Form(...),
    documentType: str = Form(...),
    issueDate: str = Form(None),
    expiryDate: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    
    # Save file locally
    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"DOC_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Perform OCR metadata extraction
    ocr_result = await OCRService.extract_text_and_metadata(file_path, documentType)

    count = await db.documents.count_documents({})
    doc_id = f"DOC-{datetime.utcnow().year}-{count+1:04d}"

    doc_record = {
        "documentId": doc_id,
        "mineId": mineId,
        "fileName": file.filename,
        "filePath": f"/uploads/{safe_filename}",
        "documentType": documentType,
        "issueDate": issueDate or "2026-01-15",
        "expiryDate": expiryDate or "2027-01-14",
        "uploadedBy": current_user.get("name"),
        "uploaderId": current_user.get("userId"),
        "ocrText": ocr_result["ocrText"],
        "extractedMetadata": ocr_result["extractedMetadata"],
        "verificationStatus": ocr_result["verificationStatus"],
        "createdAt": datetime.utcnow().isoformat()
    }

    res = await db.documents.insert_one(doc_record)
    doc_record["_id"] = str(res.inserted_id)

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="Document Uploaded & OCR Processed",
        module="DOCUMENT",
        record_id=doc_id,
        metadata={"fileName": file.filename, "documentType": documentType}
    )

    return doc_record

@router.get("")
async def list_documents(mineId: str = None, current_user: dict = Depends(get_current_user)):
    db = get_database()
    query = {}
    if mineId:
        query["mineId"] = mineId
    elif current_user.get("role") in ["MINE_MANAGER", "INSPECTOR"] and current_user.get("mineId"):
        query["mineId"] = current_user.get("mineId")

    docs = await db.documents.find(query).sort("createdAt", -1).to_list(length=200)
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs
