from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import os
from ..database import get_db
from .. import schemas, crud, models
from ..auth import get_current_user, get_current_admin
from ..utils.image_helper import save_upload_file

router = APIRouter()

# Get current user's profile
@router.get("/me", response_model=schemas.User)
async def get_my_profile(
    current_user: models.User = Depends(get_current_user)
):
    return current_user

# Update current user's profile (users can update their own profile fields)
@router.put("/me", response_model=schemas.User)
async def update_my_profile(
    profile_update: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Convert profile update to user update (only allow profile fields)
    user_update_data = profile_update.dict(exclude_unset=True)
    user_update = schemas.UserUpdate(**user_update_data)
    
    updated_user = crud.update_user(db, user_id=current_user.id, user_update=user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

# Upload profile picture
@router.post("/me/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # Save the uploaded file
        filename = await save_upload_file(file)
        
        # Create URL for the uploaded file
        profile_picture_url = f"/uploads/{filename}"
        
        # Update user's profile picture
        user_update = schemas.UserUpdate(profile_picture=profile_picture_url)
        updated_user = crud.update_user(db, user_id=current_user.id, user_update=user_update)
        
        return {"profile_picture_url": profile_picture_url, "message": "Profile picture updated successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Admin-only: Update any user's profile
@router.put("/{user_id}/profile", response_model=schemas.User)
async def update_user_profile(
    user_id: int,
    profile_update: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    user_update_data = profile_update.dict(exclude_unset=True)
    user_update = schemas.UserUpdate(**user_update_data)
    
    updated_user = crud.update_user(db, user_id=user_id, user_update=user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

# Admin-only: Upload profile picture for any user
@router.post("/{user_id}/profile-picture")
async def upload_user_profile_picture(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    # Check if user exists
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        # Save the uploaded file
        filename = await save_upload_file(file)
        
        # Create URL for the uploaded file
        profile_picture_url = f"/uploads/{filename}"
        
        # Update user's profile picture
        user_update = schemas.UserUpdate(profile_picture=profile_picture_url)
        updated_user = crud.update_user(db, user_id=user_id, user_update=user_update)
        
        return {"profile_picture_url": profile_picture_url, "message": "Profile picture updated successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Get user profile (admin only)
@router.get("/{user_id}", response_model=schemas.User)
async def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user