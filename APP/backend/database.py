from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, List, Dict
import os
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'revrent')]

# Collections
users_collection = db.users
vendors_collection = db.vendors
listings_collection = db.listings
feedback_collection = db.feedback

# Helper functions
def serialize_datetime(obj: dict) -> dict:
    """Convert datetime objects to ISO strings for MongoDB"""
    for key, value in obj.items():
        if isinstance(value, datetime):
            obj[key] = value.isoformat()
    return obj

def deserialize_datetime(obj: dict, fields: List[str]) -> dict:
    """Convert ISO strings back to datetime objects"""
    for field in fields:
        if field in obj and isinstance(obj[field], str):
            obj[field] = datetime.fromisoformat(obj[field])
    return obj

# User operations
async def create_user(user_data: dict) -> dict:
    """Create a new user"""
    user_data = serialize_datetime(user_data)
    await users_collection.insert_one(user_data)
    return user_data

async def get_user_by_email(email: str) -> Optional[dict]:
    """Get user by email"""
    user = await users_collection.find_one({"email": email}, {"_id": 0})
    if user:
        user = deserialize_datetime(user, ["created_at"])
    return user

async def get_user_by_id(user_id: str) -> Optional[dict]:
    """Get user by ID"""
    user = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if user:
        user = deserialize_datetime(user, ["created_at"])
    return user

# Vendor operations
async def create_vendor(vendor_data: dict) -> dict:
    """Create a new vendor"""
    vendor_data = serialize_datetime(vendor_data)
    await vendors_collection.insert_one(vendor_data)
    return vendor_data

async def get_vendor_by_user_id(user_id: str) -> Optional[dict]:
    """Get vendor by user ID"""
    vendor = await vendors_collection.find_one({"user_id": user_id}, {"_id": 0})
    if vendor:
        vendor = deserialize_datetime(vendor, ["created_at"])
    return vendor

async def get_vendor_by_id(vendor_id: str) -> Optional[dict]:
    """Get vendor by ID"""
    vendor = await vendors_collection.find_one({"id": vendor_id}, {"_id": 0})
    if vendor:
        vendor = deserialize_datetime(vendor, ["created_at"])
    return vendor

async def update_vendor_verification(vendor_id: str, verified: bool) -> bool:
    """Update vendor verification status"""
    result = await vendors_collection.update_one(
        {"id": vendor_id},
        {"$set": {"verified": verified}}
    )
    return result.modified_count > 0

async def get_pending_vendors() -> List[dict]:
    """Get all pending vendor verifications"""
    vendors = await vendors_collection.find({"verified": False}, {"_id": 0}).to_list(100)
    for vendor in vendors:
        vendor = deserialize_datetime(vendor, ["created_at"])
    return vendors

# Listing operations
async def create_listing(listing_data: dict) -> dict:
    """Create a new rental listing"""
    listing_data = serialize_datetime(listing_data)
    await listings_collection.insert_one(listing_data)
    return listing_data

async def get_listing_by_id(listing_id: str) -> Optional[dict]:
    """Get listing by ID"""
    listing = await listings_collection.find_one({"id": listing_id}, {"_id": 0})
    if listing:
        listing = deserialize_datetime(listing, ["created_at"])
    return listing

async def search_listings(query: dict, sort_by: str = "price_asc") -> List[dict]:
    """Search rental listings with filters"""
    # Build query filter
    filter_query = {"approved": True, "available": True}
    
    if query.get("vehicle_type"):
        filter_query["vehicle_type"] = query["vehicle_type"]
    
    if query.get("city"):
        filter_query["city"] = {"$regex": query["city"], "$options": "i"}
    
    if query.get("max_price"):
        filter_query["price_per_day"] = {"$lte": query["max_price"]}
    
    # Determine sort order
    if sort_by == "price_desc":
        sort_order = [("price_per_day", -1)]
    elif sort_by == "newest":
        sort_order = [("created_at", -1)]
    else:  # price_asc (default)
        sort_order = [("price_per_day", 1)]
    
    listings = await listings_collection.find(filter_query, {"_id": 0}).sort(sort_order).to_list(1000)
    for listing in listings:
        listing = deserialize_datetime(listing, ["created_at"])
    return listings

async def get_vendor_listings(vendor_id: str) -> List[dict]:
    """Get all listings by a vendor"""
    listings = await listings_collection.find({"vendor_id": vendor_id}, {"_id": 0}).to_list(1000)
    for listing in listings:
        listing = deserialize_datetime(listing, ["created_at"])
    return listings

async def get_pending_listings() -> List[dict]:
    """Get all pending listing approvals"""
    listings = await listings_collection.find({"approved": False, "source": "manual"}, {"_id": 0}).to_list(100)
    for listing in listings:
        listing = deserialize_datetime(listing, ["created_at"])
    return listings

async def update_listing_approval(listing_id: str, approved: bool) -> bool:
    """Update listing approval status"""
    result = await listings_collection.update_one(
        {"id": listing_id},
        {"$set": {"approved": approved}}
    )
    return result.modified_count > 0

async def update_listing_availability(listing_id: str, available: bool) -> bool:
    """Update listing availability"""
    result = await listings_collection.update_one(
        {"id": listing_id},
        {"$set": {"available": available}}
    )
    return result.modified_count > 0

async def delete_listing(listing_id: str) -> bool:
    """Delete a listing"""
    result = await listings_collection.delete_one({"id": listing_id})
    return result.deleted_count > 0

# Feedback operations
async def create_feedback(feedback_data: dict) -> dict:
    """Create feedback"""
    feedback_data = serialize_datetime(feedback_data)
    await feedback_collection.insert_one(feedback_data)
    return feedback_data

async def get_listing_feedback(listing_id: str) -> List[dict]:
    """Get all feedback for a listing"""
    feedback = await feedback_collection.find({"listing_id": listing_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for item in feedback:
        item = deserialize_datetime(item, ["created_at"])
    return feedback

async def get_all_feedback() -> List[dict]:
    """Get all feedback (admin)"""
    feedback = await feedback_collection.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for item in feedback:
        item = deserialize_datetime(item, ["created_at"])
    return feedback

# Scraped data operations
async def save_scraped_listings(listings: List[dict]) -> int:
    """Save scraped listings to database"""
    if not listings:
        return 0
    
    # Serialize datetimes
    for listing in listings:
        listing = serialize_datetime(listing)
    
    # Insert or update listings
    count = 0
    for listing in listings:
        # Check if listing already exists (by vendor_name + vehicle_name + city)
        existing = await listings_collection.find_one({
            "vendor_name": listing.get("vendor_name"),
            "vehicle_name": listing.get("vehicle_name"),
            "city": listing.get("city"),
            "source": "scraped"
        })
        
        if existing:
            # Update price and availability
            await listings_collection.update_one(
                {"id": existing["id"]},
                {"$set": {
                    "price_per_day": listing["price_per_day"],
                    "available": listing["available"],
                    "created_at": listing["created_at"]
                }}
            )
        else:
            # Insert new listing
            await listings_collection.insert_one(listing)
            count += 1
    
    return count
