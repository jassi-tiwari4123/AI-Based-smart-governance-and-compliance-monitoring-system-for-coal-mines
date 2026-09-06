from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.all_schemas import UserRegister, UserLogin, UserResponse, TokenResponse
from app.utils.security import hash_password, verify_password, create_access_token
from app.database.connection import get_database
from app.middleware.auth import get_current_user
from app.services.audit.audit_service import log_audit_event
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    db = get_database()
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    count = await db.users.count_documents({})
    user_id = f"USR-{count+1:04d}"

    hashed = hash_password(user_data.password)
    user_doc = {
        "userId": user_id,
        "email": user_data.email,
        "password": hashed,
        "name": user_data.name,
        "role": user_data.role,
        "mineId": user_data.mineId,
        "department": user_data.department or "Mining Governance",
        "createdAt": datetime.utcnow().isoformat()
    }
    
    res = await db.users.insert_one(user_doc)
    user_doc["_id"] = str(res.inserted_id)

    await log_audit_event(
        user_id=user_id,
        user_email=user_data.email,
        role=user_data.role,
        action="User Registered",
        module="AUTH",
        record_id=user_id
    )

    token = create_access_token({"sub": user_data.email, "role": user_data.role, "userId": user_id})
    user_resp = UserResponse(
        id=str(res.inserted_id),
        userId=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        mineId=user_data.mineId,
        department=user_data.department
    )
    return TokenResponse(access_token=token, user=user_resp)

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    db = get_database()
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = user.get("userId", str(user["_id"]))
    token = create_access_token({"sub": user["email"], "role": user["role"], "userId": user_id})

    await log_audit_event(
        user_id=user_id,
        user_email=user["email"],
        role=user["role"],
        action="User Login Success",
        module="AUTH",
        record_id=user_id
    )

    user_resp = UserResponse(
        id=str(user["_id"]),
        userId=user_id,
        email=user["email"],
        name=user["name"],
        role=user["role"],
        mineId=user.get("mineId"),
        department=user.get("department")
    )
    return TokenResponse(access_token=token, user=user_resp)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        userId=current_user.get("userId"),
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        mineId=current_user.get("mineId"),
        department=current_user.get("department")
    )

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="User Logout",
        module="AUTH"
    )
    return {"message": "Successfully logged out"}
