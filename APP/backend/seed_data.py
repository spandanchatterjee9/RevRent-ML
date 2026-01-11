"""
Seed script to populate the database with initial data for testing

Run this script once to create:
- Admin user
- Sample vendors
- Sample rental listings
"""

import asyncio
from database import (
    create_user, create_vendor, create_listing, save_scraped_listings
)
from auth import get_password_hash
from scraper import generate_mock_listings
import uuid
from datetime import datetime

async def seed_database():
    print("🌱 Seeding database...")
    
    # 1. Create Admin User
    print("\n1. Creating admin user...")
    admin_id = str(uuid.uuid4())
    admin = {
        "id": admin_id,
        "email": "admin@revrent.com",
        "password_hash": get_password_hash("admin123"),
        "name": "Admin User",
        "role": "admin",
        "created_at": datetime.utcnow()
    }
    try:
        await create_user(admin)
        print("   ✅ Admin user created")
        print("      Email: admin@revrent.com")
        print("      Password: admin123")
    except Exception as e:
        print(f"   ⚠️  Admin user may already exist: {e}")
    
    # 2. Create Sample Regular User
    print("\n2. Creating sample user...")
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": "user@example.com",
        "password_hash": get_password_hash("user123"),
        "name": "John Doe",
        "role": "user",
        "created_at": datetime.utcnow()
    }
    try:
        await create_user(user)
        print("   ✅ Sample user created")
        print("      Email: user@example.com")
        print("      Password: user123")
    except Exception as e:
        print(f"   ⚠️  User may already exist: {e}")
    
    # 3. Create Sample Vendor User
    print("\n3. Creating vendor user...")
    vendor_user_id = str(uuid.uuid4())
    vendor_user = {
        "id": vendor_user_id,
        "email": "vendor@example.com",
        "password_hash": get_password_hash("vendor123"),
        "name": "Rental Shop Owner",
        "role": "vendor",
        "created_at": datetime.utcnow()
    }
    try:
        await create_user(vendor_user)
        print("   ✅ Vendor user created")
        print("      Email: vendor@example.com")
        print("      Password: vendor123")
    except Exception as e:
        print(f"   ⚠️  Vendor user may already exist: {e}")
    
    # 4. Create Verified Vendor Profile
    print("\n4. Creating vendor profile...")
    vendor_id = str(uuid.uuid4())
    vendor = {
        "id": vendor_id,
        "user_id": vendor_user_id,
        "business_name": "City Rentals",
        "contact": "+91 9876543210",
        "location": "MG Road, Koramangala",
        "city": "Bangalore",
        "description": "Premium vehicle rentals with best prices",
        "verified": True,
        "created_at": datetime.utcnow()
    }
    try:
        await create_vendor(vendor)
        print("   ✅ Vendor profile created (verified)")
    except Exception as e:
        print(f"   ⚠️  Vendor profile may already exist: {e}")
    
    # 5. Create Sample Listings from Vendor
    print("\n5. Creating vendor listings...")
    vendor_listings = [
        {
            "id": str(uuid.uuid4()),
            "vendor_id": vendor_id,
            "vendor_name": "City Rentals",
            "vehicle_type": "2-wheeler",
            "vehicle_name": "Honda Activa",
            "model": "6G",
            "price_per_day": 400.0,
            "location": "Koramangala",
            "city": "Bangalore",
            "description": "Well-maintained scooter, perfect for city rides",
            "image_url": None,
            "available": True,
            "source": "manual",
            "approved": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "vendor_id": vendor_id,
            "vendor_name": "City Rentals",
            "vehicle_type": "4-wheeler",
            "vehicle_name": "Maruti Swift",
            "model": "VXI",
            "price_per_day": 1800.0,
            "location": "MG Road",
            "city": "Bangalore",
            "description": "Comfortable hatchback with GPS and music system",
            "image_url": None,
            "available": True,
            "source": "manual",
            "approved": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    for listing in vendor_listings:
        try:
            await create_listing(listing)
            print(f"   ✅ Created listing: {listing['vehicle_name']}")
        except Exception as e:
            print(f"   ⚠️  Listing may already exist: {e}")
    
    # 6. Create Scraped Listings for Multiple Cities
    print("\n6. Creating scraped listings...")
    cities = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai"]
    
    for city in cities:
        mock_listings = generate_mock_listings(city, count=15)
        count = await save_scraped_listings(mock_listings)
        print(f"   ✅ Created {len(mock_listings)} scraped listings for {city}")
    
    print("\n✨ Database seeding completed!")
    print("\n📝 Test Credentials:")
    print("   Admin: admin@revrent.com / admin123")
    print("   User: user@example.com / user123")
    print("   Vendor: vendor@example.com / vendor123")

if __name__ == "__main__":
    asyncio.run(seed_database())
