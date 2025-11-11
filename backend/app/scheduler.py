# scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from .database import SessionLocal
from . import crud

def check_overdue_items():
    db = SessionLocal()
    try:
        count = crud.update_overdue_borrows(db)
        print(f"Updated {count} overdue items")
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(check_overdue_items, 'interval', hours=1)  # Run every hour
scheduler.start()