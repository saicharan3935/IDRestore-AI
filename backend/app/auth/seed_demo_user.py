"""
Local Demonstration Account Seed Script
IDRestore AI — Obsidian Futurism Edition

Usage:
    python -m app.auth.seed_demo_user

This script provisions a local evaluation account in the SQLite database.
DO NOT RUN IN PRODUCTION.
"""

import sys
from app.database.session import SessionLocal, engine, Base
from app.models.user import User
from app.auth.security import hash_password

DEMO_EMAIL = "analyst@idrestore.ai"
DEMO_PASSWORD = "ObsidianRestore2026!"
DEMO_NAME = "HR Migration Lead"
DEMO_ROLE = "HR_ADMIN"

def seed_demo_user():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if existing:
            print(f"[INFO] Demo user already exists: {DEMO_EMAIL}")
            return existing

        hashed = hash_password(DEMO_PASSWORD)
        user = User(
            email=DEMO_EMAIL,
            hashed_password=hashed,
            full_name=DEMO_NAME,
            role=DEMO_ROLE,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print("==================================================")
        print(" [SUCCESS] IDRestore AI Local Demo User Seeded")
        print("==================================================")
        print(f" Email:    {DEMO_EMAIL}")
        print(f" Password: {DEMO_PASSWORD}")
        print(f" Role:     {DEMO_ROLE}")
        print("==================================================")
        return user
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_user()
