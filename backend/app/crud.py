#crud.py
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from . import models, schemas
from .auth import get_password_hash
from typing import List, Optional
from datetime import datetime
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# User CRUD operations
def get_password_hash(password):
    return pwd_context.hash(password)

# User CRUD operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        student_id=user.student_id,
        role=user.role,
        password_hash=hashed_password,
        # New profile fields with default values
        profile_picture=user.profile_picture,
        phone_number=user.phone_number,
        course=user.course
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = get_user(db, user_id)
    if db_user:
        update_data = user_update.dict(exclude_unset=True)
        
        # Handle password update
        if 'password' in update_data and update_data['password']:
            update_data['password_hash'] = get_password_hash(update_data.pop('password'))
        
        for field, value in update_data.items():
            setattr(db_user, field, value)
        
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False
# Category CRUD operations
def get_category(db: Session, category_id: int):
    return db.query(models.Category).filter(models.Category.id == category_id).first()

def get_category_by_name(db: Session, name: str):
    return db.query(models.Category).filter(models.Category.name == name).first()

def get_categories(db: Session, skip: int = 0, limit: int = 100):
    categories = db.query(models.Category).offset(skip).limit(limit).all()
    
    # Add items count to each category
    for category in categories:
        category.items_count = db.query(models.Item).filter(
            models.Item.category_id == category.id
        ).count()
    
    return categories

def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_category(db: Session, category_id: int, category_update: schemas.CategoryUpdate):
    db_category = get_category(db, category_id)
    if db_category:
        update_data = category_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_category, field, value)
        db.commit()
        db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: int):
    db_category = get_category(db, category_id)
    if db_category:
        db.delete(db_category)
        db.commit()
    return db_category

# Item CRUD operations
def get_item(db: Session, item_id: int):
    return db.query(models.Item).filter(models.Item.id == item_id).first()

def get_items(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    storage_location: Optional[str] = None,
    condition: Optional[str] = None,
    low_stock: Optional[bool] = None,
    borrowable_only: Optional[bool] = None
):
    query = db.query(models.Item)
    
    # Apply filters
    if search:
        query = query.filter(
            or_(
                models.Item.name.ilike(f"%{search}%"),
                models.Item.description.ilike(f"%{search}%")
            )
        )
    
    if category_id:
        query = query.filter(models.Item.category_id == category_id)
    
    if storage_location:
        query = query.filter(models.Item.storage_location.ilike(f"%{storage_location}%"))
    
    if condition:
        query = query.filter(models.Item.condition == condition)
    
    if low_stock:
        query = query.filter(models.Item.available_quantity <= models.Item.min_stock_level)
    
    if borrowable_only:
        query = query.filter(models.Item.is_borrowable == True)
    
    return query.offset(skip).limit(limit).all()

def create_item(db: Session, item: schemas.ItemCreate):
    # Convert Pydantic model to dict
    item_data = item.dict()
    
    # Set available_quantity same as quantity for new items
    item_data['available_quantity'] = item_data['quantity']
    
    # Create database item - image_url is now included in item_data
    db_item = models.Item(**item_data)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_item(db: Session, item_id: int, item_update: schemas.ItemUpdate):
    db_item = get_item(db, item_id)
    if db_item:
        update_data = item_update.dict(exclude_unset=True)
        
        # If quantity is updated, also update available_quantity
        if 'quantity' in update_data and 'available_quantity' not in update_data:
            quantity_diff = update_data['quantity'] - db_item.quantity
            update_data['available_quantity'] = db_item.available_quantity + quantity_diff
        
        # Update fields
        for field, value in update_data.items():
            setattr(db_item, field, value)
        
        db.commit()
        db.refresh(db_item)
    return db_item

def delete_item(db: Session, item_id: int):
    db_item = get_item(db, item_id)
    if db_item:
        db.delete(db_item)
        db.commit()
    return db_item

# Borrow Log CRUD operations
def get_borrow_log(db: Session, borrow_log_id: int):
    return db.query(models.BorrowLog).filter(models.BorrowLog.id == borrow_log_id).first()

def get_borrow_logs(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    item_id: Optional[int] = None,
    status: Optional[str] = None,
    overdue_only: Optional[bool] = None
):
    query = db.query(models.BorrowLog)
    
    if user_id:
        query = query.filter(models.BorrowLog.user_id == user_id)
    
    if item_id:
        query = query.filter(models.BorrowLog.item_id == item_id)
    
    if status:
        # Convert string to uppercase to match enum values
        status_upper = status.upper()
        if hasattr(models.BorrowStatus, status_upper):
            status_enum = getattr(models.BorrowStatus, status_upper)
            query = query.filter(models.BorrowLog.status == status_enum)
        else:
            # If status validation fails, return empty results
            return []
    
    if overdue_only:
        query = query.filter(
            and_(
                models.BorrowLog.status == models.BorrowStatus.BORROWED,
                models.BorrowLog.expected_return_date < datetime.now()
            )
        )
    
    return query.offset(skip).limit(limit).all()

def create_borrow_log(db: Session, borrow_log: schemas.BorrowLogCreate):
    # Check if item exists and is borrowable
    item = get_item(db, borrow_log.item_id)
    if not item:
        raise ValueError("Item not found")
    if not item.is_borrowable:
        raise ValueError("Item is not borrowable")
    if item.available_quantity < borrow_log.quantity_borrowed:
        raise ValueError("Not enough available quantity")
    
    # Create borrow log
    db_borrow_log = models.BorrowLog(**borrow_log.dict())
    
    # Update item available quantity
    item.available_quantity -= borrow_log.quantity_borrowed
    
    db.add(db_borrow_log)
    db.commit()
    db.refresh(db_borrow_log)
    return db_borrow_log

def update_borrow_log(db: Session, borrow_log_id: int, borrow_log_update: schemas.BorrowLogUpdate):
    db_borrow_log = get_borrow_log(db, borrow_log_id)
    if db_borrow_log:
        update_data = borrow_log_update.dict(exclude_unset=True)
        
        # Convert status string to enum if present
        if 'status' in update_data:
            if isinstance(update_data['status'], str):
                # Convert string to enum
                status_upper = update_data['status'].upper()
                if hasattr(models.BorrowStatus, status_upper):
                    update_data['status'] = getattr(models.BorrowStatus, status_upper)
                else:
                    raise ValueError(f"Invalid status: {update_data['status']}")
        
        # If returning item, update available quantity
# If returning item, update available quantity
        if 'status' in update_data and update_data['status'] == models.BorrowStatus.RETURNED:
            if not db_borrow_log.actual_return_date:
                update_data['actual_return_date'] = datetime.now()
            
            # Return the borrowed quantity to available quantity
            item = db_borrow_log.item
            item.available_quantity += db_borrow_log.quantity_borrowed        
        # If marking as overdue
        if 'status' in update_data and update_data['status'] == models.BorrowStatus.OVERDUE:
            update_data['actual_return_date'] = None
        
        for field, value in update_data.items():
            setattr(db_borrow_log, field, value)
        
        db.commit()
        db.refresh(db_borrow_log)
    return db_borrow_log
def delete_borrow_log(db: Session, borrow_log_id: int):
    db_borrow_log = get_borrow_log(db, borrow_log_id)
    if db_borrow_log:
        # Return quantity if item was borrowed
        if db_borrow_log.status == models.BorrowStatus.BORROWED:
            item = db_borrow_log.item
            item.available_quantity += db_borrow_log.quantity_borrowed
        
        db.delete(db_borrow_log)
        db.commit()
    return db_borrow_log

# Dashboard statistics
def get_dashboard_stats(db: Session, user_id: Optional[int] = None, user_role: Optional[str] = None):
    # System-wide stats (for admins)
    total_items = db.query(models.Item).count()
    total_categories = db.query(models.Category).count()
    total_users = db.query(models.User).count()
    
    low_stock_items = db.query(models.Item).filter(
        models.Item.available_quantity <= models.Item.min_stock_level
    ).count()
    
    expired_items = db.query(models.Item).filter(
        and_(
            models.Item.expiry_date.isnot(None),
            models.Item.expiry_date < datetime.now()
        )
    ).count()
    
    items_for_disposal = db.query(models.Item).filter(
        models.Item.condition == "for_disposal"
    ).count()
    
    # Borrow statistics - different logic for admin vs viewer
    if user_role == "admin":
        # Admin sees all borrowed items
        total_borrowed_items = db.query(models.BorrowLog).filter(
            models.BorrowLog.status == models.BorrowStatus.BORROWED
        ).count()
        
        overdue_borrows = db.query(models.BorrowLog).filter(
            and_(
                models.BorrowLog.status == models.BorrowStatus.BORROWED,
                models.BorrowLog.expected_return_date < datetime.now()
            )
        ).count()
    else:
        # Viewer sees only their own borrowed items
        total_borrowed_items = db.query(models.BorrowLog).filter(
            and_(
                models.BorrowLog.status == models.BorrowStatus.BORROWED,
                models.BorrowLog.user_id == user_id
            )
        ).count()
        
        overdue_borrows = db.query(models.BorrowLog).filter(
            and_(
                models.BorrowLog.status == models.BorrowStatus.BORROWED,
                models.BorrowLog.user_id == user_id,
                models.BorrowLog.expected_return_date < datetime.now()
            )
        ).count()
    
    return {
        "total_items": total_items,
        "total_categories": total_categories,
        "total_users": total_users,
        "low_stock_items": low_stock_items,
        "expired_items": expired_items,
        "items_for_disposal": items_for_disposal,
        "total_borrowed_items": total_borrowed_items,
        "overdue_borrows": overdue_borrows
    }
# Add this to crud.py
def update_overdue_borrows(db: Session):
    """Update status of borrowed items that are past due date"""
    overdue_logs = db.query(models.BorrowLog).filter(
        and_(
            models.BorrowLog.status == models.BorrowStatus.BORROWED,
            models.BorrowLog.expected_return_date < datetime.now()
        )
    ).all()
    
    for log in overdue_logs:
        log.status = models.BorrowStatus.OVERDUE
    
    db.commit()
    return len(overdue_logs)