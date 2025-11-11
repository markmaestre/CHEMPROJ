#borrowed.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from ..database import get_db
from .. import models, schemas, crud
from ..auth import get_current_admin, get_current_user

router = APIRouter()

@router.get("/", response_model=List[schemas.BorrowLogWithDetails])
def read_borrow_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[str] = Query(None),  # Change to string and convert later
    item_id: Optional[str] = Query(None),  # Change to string and convert later
    status: Optional[str] = Query(None),
    overdue_only: Optional[bool] = Query(False),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    # Convert string parameters to integers if provided
    user_id_int = None
    item_id_int = None
    
    if user_id:
        try:
            user_id_int = int(user_id)
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid user_id format")
    
    if item_id:
        try:
            item_id_int = int(item_id)
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid item_id format")
    
    # Only admin can see all logs, users can only see their own
    if current_user.role != "admin":
        user_id_int = current_user.id
    
    borrow_logs = crud.get_borrow_logs(
        db,
        skip=skip,
        limit=limit,
        user_id=user_id_int,
        item_id=item_id_int,
        status=status,
        overdue_only=overdue_only
    )
    return borrow_logs

@router.get("/{borrow_log_id}", response_model=schemas.BorrowLogWithDetails)
def read_borrow_log(
    borrow_log_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    db_borrow_log = crud.get_borrow_log(db, borrow_log_id=borrow_log_id)
    if db_borrow_log is None:
        raise HTTPException(status_code=404, detail="Borrow log not found")
    
    # Users can only see their own borrow logs
    if current_user.role != "admin" and db_borrow_log.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this borrow log")
    
    return db_borrow_log

@router.post("/", response_model=schemas.BorrowLog)
def create_borrow_log(
    borrow_log: schemas.BorrowLogCreate,
    db: Session = Depends(get_db),
    current_admin: schemas.User = Depends(get_current_admin)
):
    try:
        db_borrow_log = crud.create_borrow_log(db=db, borrow_log=borrow_log)
        return db_borrow_log
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{borrow_log_id}", response_model=schemas.BorrowLog)
def update_borrow_log(
    borrow_log_id: int,
    borrow_log_update: schemas.BorrowLogUpdate,
    db: Session = Depends(get_db),
    current_admin: schemas.User = Depends(get_current_admin)
):
    db_borrow_log = crud.update_borrow_log(
        db=db, 
        borrow_log_id=borrow_log_id, 
        borrow_log_update=borrow_log_update
    )
    if db_borrow_log is None:
        raise HTTPException(status_code=404, detail="Borrow log not found")
    return db_borrow_log

@router.delete("/{borrow_log_id}")
def delete_borrow_log(
    borrow_log_id: int,
    db: Session = Depends(get_db),
    current_admin: schemas.User = Depends(get_current_admin)
):
    db_borrow_log = crud.delete_borrow_log(db, borrow_log_id=borrow_log_id)
    if not db_borrow_log:
        raise HTTPException(status_code=404, detail="Borrow log not found")
    return {"message": "Borrow log deleted successfully"}

@router.post("/{borrow_log_id}/return")
def return_borrowed_item(
    borrow_log_id: int,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: schemas.User = Depends(get_current_admin)
):
    db_borrow_log = crud.get_borrow_log(db, borrow_log_id=borrow_log_id)
    if not db_borrow_log:
        raise HTTPException(status_code=404, detail="Borrow log not found")
    
    if db_borrow_log.status == models.BorrowStatus.RETURNED:
        raise HTTPException(status_code=400, detail="Item already returned")
    
    # Update borrow log - pass status as string
    update_data = {
        "status": "RETURNED",  # Changed from models.BorrowStatus.RETURNED to string
        "actual_return_date": datetime.now(),
        "notes": notes or db_borrow_log.notes
    }
    
    db_borrow_log = crud.update_borrow_log(
        db=db,
        borrow_log_id=borrow_log_id,
        borrow_log_update=schemas.BorrowLogUpdate(**update_data)
    )
    
    return {"message": "Item returned successfully", "borrow_log": db_borrow_log}