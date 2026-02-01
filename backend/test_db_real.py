import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import ssl

async def test_db():
    load_dotenv('.env')
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    print(f"Connecting to: {mongo_url}")
    
    # Try with tlsAllowInvalidCertificates
    client = AsyncIOMotorClient(
        mongo_url, 
        serverSelectionTimeoutMS=10000,
        tlsAllowInvalidCertificates=True
    )
    db = client[db_name]
    
    try:
        print("Running ping...")
        await db.command("ping")
        print("Ping successful!")
    except Exception as e:
        print(f"Database operation failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_db())
