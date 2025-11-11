#routes/items.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import json
from ..database import get_db
from .. import models, schemas, crud
from ..utils.image_helper import save_upload_file

router = APIRouter()

@router.get("/", response_model=List[schemas.ItemWithDetails])
def read_items(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    storage_location: Optional[str] = Query(None),
    condition: Optional[str] = Query(None),
    low_stock: Optional[bool] = Query(None),
    borrowable_only: Optional[bool] = Query(None),  # Added missing parameter
    db: Session = Depends(get_db)
):
    items = crud.get_items(
        db, 
        skip=skip, 
        limit=limit,
        search=search,
        category_id=category_id,
        storage_location=storage_location,
        condition=condition,
        low_stock=low_stock,
        borrowable_only=borrowable_only  # Pass the parameter
    )
    return items

@router.get("/{item_id}", response_model=schemas.ItemWithDetails)
def read_item(item_id: int, db: Session = Depends(get_db)):
    db_item = crud.get_item(db, item_id=item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item
@router.post("/", response_model=schemas.Item)
async def create_item(
    name: str = Form(...),
    description: str = Form(None),
    category_id: int = Form(...),
    quantity: int = Form(0),
    unit: str = Form("pieces"),
    storage_location: str = Form(None),
    condition: str = Form("good"),
    min_stock_level: int = Form(5),
    expiry_date: str = Form(None),
    created_by: int = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # Handle expiry date conversion
    expiry_date_obj = None
    if expiry_date:
        from datetime import datetime
        try:
            expiry_date_obj = datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expiry date format")
    
    # Handle image upload
    image_url = None
    if image:
        image_url = await save_upload_file(image)
    
    item_data = {
        "name": name,
        "description": description,
        "category_id": category_id,
        "quantity": quantity,
        "unit": unit,
        "storage_location": storage_location,
        "condition": condition,
        "min_stock_level": min_stock_level,
        "expiry_date": expiry_date_obj,
        "created_by": created_by
    }
    
    if image_url:
        item_data["image_url"] = image_url
    
    db_item = crud.create_item(db=db, item=schemas.ItemCreate(**item_data))
    return db_item

@router.put("/{item_id}", response_model=schemas.Item)
async def update_item(
    item_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category_id: Optional[int] = Form(None),
    quantity: Optional[int] = Form(None),
    unit: Optional[str] = Form(None),
    storage_location: Optional[str] = Form(None),
    condition: Optional[str] = Form(None),
    min_stock_level: Optional[int] = Form(None),
    expiry_date: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # Check if item exists
    db_item = crud.get_item(db, item_id=item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Handle expiry date conversion
    expiry_date_obj = None
    if expiry_date:
        from datetime import datetime
        try:
            expiry_date_obj = datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expiry date format")
    
    # Handle image upload
    image_url = None
    if image:
        image_url = await save_upload_file(image)
    
    # Prepare update data
    update_data = {}
    if name is not None: update_data["name"] = name
    if description is not None: update_data["description"] = description
    if category_id is not None: update_data["category_id"] = category_id
    if quantity is not None: update_data["quantity"] = quantity
    if unit is not None: update_data["unit"] = unit
    if storage_location is not None: update_data["storage_location"] = storage_location
    if condition is not None: update_data["condition"] = condition
    if min_stock_level is not None: update_data["min_stock_level"] = min_stock_level
    if expiry_date is not None: update_data["expiry_date"] = expiry_date_obj
    if image_url is not None: update_data["image_url"] = image_url
    
    db_item = crud.update_item(db=db, item_id=item_id, item_update=schemas.ItemUpdate(**update_data))
    return db_item

@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    db_item = crud.delete_item(db, item_id=item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}