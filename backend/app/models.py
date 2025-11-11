from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

# Enum for borrow status - FIXED: Changed values to uppercase
class BorrowStatus(enum.Enum):
    BORROWED = "BORROWED"
    RETURNED = "RETURNED"
    OVERDUE = "OVERDUE"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    student_id = Column(String(20), unique=True)
    role = Column(String(20), default="viewer")
    password_hash = Column(String(255))
    is_active = Column(Boolean, default=True)
    
    # New profile fields
    profile_picture = Column(String(255), nullable=True)  # URL to profile picture
    phone_number = Column(String(20), nullable=True)
    course = Column(String(100), nullable=True)  # e.g., BS Chemistry, BS Biology
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Cascade delete configuration
    items = relationship("Item", back_populates="created_by_user", cascade="all, delete-orphan")
    borrowed_logs = relationship("BorrowLog", foreign_keys="[BorrowLog.user_id]", back_populates="user", cascade="all, delete-orphan")
    admin_processed_logs = relationship("BorrowLog", foreign_keys="[BorrowLog.admin_id]", back_populates="admin", cascade="all, delete-orphan")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Cascade delete configuration
    items = relationship("Item", back_populates="category", cascade="all, delete-orphan")

class Item(Base):
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, default=0)
    available_quantity = Column(Integer, default=0)
    unit = Column(String(20), default="pieces")
    storage_location = Column(String(100))
    image_url = Column(String(255))
    condition = Column(String(20), default="good")
    min_stock_level = Column(Integer, default=5)
    expiry_date = Column(DateTime, nullable=True)
    is_borrowable = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    category = relationship("Category", back_populates="items")
    created_by_user = relationship("User", back_populates="items")
    # Cascade delete configuration
    borrow_logs = relationship("BorrowLog", back_populates="item", cascade="all, delete-orphan")

class BorrowLog(Base):
    __tablename__ = "borrow_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quantity_borrowed = Column(Integer, nullable=False)
    borrow_date = Column(DateTime(timezone=True), server_default=func.now())
    expected_return_date = Column(DateTime(timezone=True))
    actual_return_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(BorrowStatus), default=BorrowStatus.BORROWED)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    item = relationship("Item", back_populates="borrow_logs")
    user = relationship("User", foreign_keys=[user_id], back_populates="borrowed_logs")
    admin = relationship("User", foreign_keys=[admin_id], back_populates="admin_processed_logs")