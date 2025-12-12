"""
Script to initialize default users in the database
Run this once to create the initial admin and user accounts
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def init_users():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'service_order_db')]
    
    # Check if users already exist
    existing_gustavo = await db.users.find_one({"email": "gustavo_tsm"})
    existing_vinnicius = await db.users.find_one({"email": "vinnicius_tsm"})
    
    if existing_gustavo and existing_vinnicius:
        print("✅ Users already exist. Skipping initialization.")
        client.close()
        return
    
    # Create Gustavo (ADMIN)
    if not existing_gustavo:
        gustavo = {
            "id": str(uuid.uuid4()),
            "email": "gustavo_tsm",
            "name": "Gustavo",
            "role": "ADMIN",
            "password": hash_password("3758"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(gustavo)
        print("✅ Admin user created: gustavo_tsm (password: 3758)")
    
    # Create Vinnicius (USER)
    if not existing_vinnicius:
        vinnicius = {
            "id": str(uuid.uuid4()),
            "email": "vinnicius_tsm",
            "name": "Vinnicius",
            "role": "USER",
            "password": hash_password("3758"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(vinnicius)
        print("✅ Standard user created: vinnicius_tsm (password: 3758)")
    
    print("\n🎉 Initialization complete!")
    print("\nLogin credentials:")
    print("  Admin: gustavo_tsm / 3758")
    print("  User:  vinnicius_tsm / 3758")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_users())
