
#schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Borrow Status Enum
class BorrowStatus(str, Enum):
    BORROWED = "BORROWED"
    RETURNED = "RETURNED"
    OVERDUE = "OVERDUE"

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    student_id: Optional[str] = None
    role: str = "viewer"
    profile_picture: Optional[str] = None
    phone_number: Optional[str] = None
    course: Optional[str] = None

# Schema for creating user (includes password)
class UserCreate(UserBase):
    password: str

# Schema for updating user (all fields optional)
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    student_id: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    profile_picture: Optional[str] = None
    phone_number: Optional[str] = None
    course: Optional[str] = None

    class Config:
        from_attributes = True

# Schema for user response (includes all fields)
class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    profile_picture: Optional[str] = None
    phone_number: Optional[str] = None
    course: Optional[str] = None

    class Config:
        from_attributes = True

# Profile-specific schemas
class ProfileBase(BaseModel):
    profile_picture: Optional[str] = None
    phone_number: Optional[str] = None
    course: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class Profile(ProfileBase):
    user_id: int

    class Config:
        from_attributes = True

class UserWithPassword(User):
    password_hash: str

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Category(CategoryBase):
    id: int
    created_at: datetime
    items_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

# Item Schemas
class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: int
    quantity: int = Field(0, ge=0)  # ge=0 means greater than or equal to 0
    available_quantity: int = Field(0, ge=0)
    unit: str = "pieces"
    storage_location: Optional[str] = None
    condition: str = "good"
    min_stock_level: int = Field(5, ge=0)
    expiry_date: Optional[datetime] = None
    is_borrowable: bool = True

class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: int
    quantity: int = Field(0, ge=0)
    unit: str = "pieces"
    storage_location: Optional[str] = None
    condition: str = "good"
    min_stock_level: int = Field(5, ge=0)
    expiry_date: Optional[datetime] = None
    is_borrowable: bool = True
    created_by: int
    image_url: Optional[str] = None


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    quantity: Optional[int] = None
    available_quantity: Optional[int] = None
    unit: Optional[str] = None
    storage_location: Optional[str] = None
    condition: Optional[str] = None
    min_stock_level: Optional[int] = None
    expiry_date: Optional[datetime] = None
    is_borrowable: Optional[bool] = None
    image_url: Optional[str] = None

class Item(ItemBase):
    id: int
    image_url: Optional[str] = None
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ItemWithDetails(Item):
    category: Optional['Category'] = None
    created_by_user: Optional['User'] = None
# Borrow Log Schemas
class BorrowLogBase(BaseModel):
    item_id: int
    user_id: int
    quantity_borrowed: int
    expected_return_date: datetime
    notes: Optional[str] = None

class BorrowLogCreate(BorrowLogBase):
    admin_id: int

class BorrowLogUpdate(BaseModel):
    actual_return_date: Optional[datetime] = None
    status: Optional[str] = None  # Change from BorrowStatus to str for flexibility
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True
class BorrowLog(BorrowLogBase):
    id: int
    admin_id: int
    borrow_date: datetime
    actual_return_date: Optional[datetime] = None
    status: BorrowStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

class BorrowLogWithDetails(BorrowLog):
    item: Optional[Item] = None
    user: Optional[User] = None
    admin: Optional[User] = None

# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None

class LoginRequest(BaseModel):
    username: str
    password: str

# Dashboard Stats
class DashboardStats(BaseModel):
    total_items: int
    total_categories: int
    low_stock_items: int
    expired_items: int
    items_for_disposal: int
    total_borrowed_items: int
    overdue_borrows: int
    total_users: int