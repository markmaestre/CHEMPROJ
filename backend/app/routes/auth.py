from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from ..database import get_db
from .. import schemas, crud
from ..auth import authenticate_user, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

@router.post("/login")
async def login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    print(f"Login attempt for user: {login_data.username}")  # Debug log
    
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        print("Authentication failed: Incorrect username or password")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    if not user.is_active:
        print("Authentication failed: User account disabled")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled",
        )
    
    print(f"Authentication successful for user: {user.username}")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "student_id": user.student_id,
            "is_active": user.is_active,
            # Include new profile fields
            "profile_picture": user.profile_picture,
            "phone_number": user.phone_number,
            "course": user.course
        }
    }
@router.get("/me")
async def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user