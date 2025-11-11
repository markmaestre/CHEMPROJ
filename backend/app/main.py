from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .database import engine, get_db
from . import models, schemas, crud
from .routes import items, categories, users, borrowed, auth, profile

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Chemistry Lab Inventory API",
    description="Digital inventory catalog for chemistry laboratory items with admin control",
    version="2.0.0"
)

# CORS middleware - Enhanced configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(items.router, prefix="/api/items", tags=["items"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(borrowed.router, prefix="/api/borrowed", tags=["borrowed"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])  # Add profile router
@app.get("/")
async def root():
    return {"message": "Chemistry Lab Inventory System API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Chemistry Lab Inventory API"}

# Test endpoint to check CORS
@app.options("/api/borrowed/")
async def options_borrowed():
    return {"message": "CORS preflight"}

@app.get("/api/test-cors")
async def test_cors():
    return {"message": "CORS is working!"}

# Create default admin user on startup
@app.on_event("startup")
async def startup_event():
    db = next(get_db())
    try:
        # Check if admin user exists
        admin_user = crud.get_user_by_username(db, "admin")
        if not admin_user:
            # Create default admin user
            admin_data = schemas.UserCreate(
                username="admin",
                email="admin@chemlab.edu",
                full_name="System Administrator",
                role="admin",
                password="admin123"  # Change this in production!
            )
            crud.create_user(db, admin_data)
            print("✅ Default admin user created: admin / admin123")
        else:
            print("✅ Admin user already exists")
            
        # Create a demo viewer user
        viewer_user = crud.get_user_by_username(db, "viewer")
        if not viewer_user:
            viewer_data = schemas.UserCreate(
                username="viewer",
                email="viewer@chemlab.edu",
                full_name="Demo Viewer",
                role="viewer",
                password="viewer123"
            )
            crud.create_user(db, viewer_data)
            print("✅ Default viewer user created: viewer / viewer123")
        else:
            print("✅ Viewer user already exists")
            
        print("🎉 Database initialization complete!")
        
    except Exception as e:
        print(f"❌ Error creating default users: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)