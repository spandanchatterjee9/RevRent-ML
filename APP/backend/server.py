from fastapi import FastAPI, APIRouter, HTTPException, Depends, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from typing import List, Optional

# Import local modules
from models import (
    User, UserCreate, UserLogin, Token,
    Vendor, VendorCreate,
    RentalListing, RentalListingCreate, RentalSearchQuery,
    Feedback, FeedbackCreate
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, require_admin, require_vendor
)
from database import (
    create_user, get_user_by_email, get_user_by_id,
    create_vendor, get_vendor_by_user_id, get_vendor_by_id,
    update_vendor_verification, get_pending_vendors,
    create_listing, get_listing_by_id, search_listings,
    get_vendor_listings, get_pending_listings,
    update_listing_approval, update_listing_availability, delete_listing,
    create_feedback, get_listing_feedback, get_all_feedback,
    save_scraped_listings
)
from scraper import scrape_all_sources

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI(title="RevRent API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = user_data.model_dump()
    password = user_dict.pop("password")
    user_dict["password_hash"] = get_password_hash(password)
    
    user = User(**user_dict)
    await create_user(user.model_dump())
    
    # Create access token
    access_token = create_access_token(data={
        "sub": user.id,
        "email": user.email,
        "role": user.role
    })
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user"""
    user_data = await get_user_by_email(credentials.email)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_data["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = create_access_token(data={
        "sub": user_data["id"],
        "email": user_data["email"],
        "role": user_data["role"]
    })
    
    # Remove password hash from response
    user_data.pop("password_hash", None)
    user = User(**user_data)
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user"""
    user_data = await get_user_by_id(current_user["sub"])
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data.pop("password_hash", None)
    return User(**user_data)

# ============================================================================
# VENDOR ROUTES
# ============================================================================

@api_router.post("/vendor/register", response_model=Vendor)
async def register_vendor(vendor_data: VendorCreate, current_user: dict = Depends(get_current_user)):
    """Register as a vendor"""
    # Check if user is already a vendor
    existing_vendor = await get_vendor_by_user_id(current_user["sub"])
    if existing_vendor:
        raise HTTPException(status_code=400, detail="User is already registered as a vendor")
    
    # Update user role to vendor
    user_data = await get_user_by_id(current_user["sub"])
    if user_data["role"] == "user":
        # In production, update the user's role in database
        pass
    
    # Create vendor
    vendor = Vendor(**vendor_data.model_dump(), user_id=current_user["sub"])
    await create_vendor(vendor.model_dump())
    
    return vendor

@api_router.get("/vendor/me", response_model=Vendor)
async def get_my_vendor_profile(current_user: dict = Depends(require_vendor)):
    """Get vendor profile"""
    vendor = await get_vendor_by_user_id(current_user["sub"])
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    return Vendor(**vendor)

@api_router.get("/vendor/listings", response_model=List[RentalListing])
async def get_my_listings(current_user: dict = Depends(require_vendor)):
    """Get vendor's own listings"""
    vendor = await get_vendor_by_user_id(current_user["sub"])
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    listings = await get_vendor_listings(vendor["id"])
    return [RentalListing(**listing) for listing in listings]

@api_router.post("/vendor/listings", response_model=RentalListing)
async def add_listing(listing_data: RentalListingCreate, current_user: dict = Depends(require_vendor)):
    """Add a new rental listing"""
    vendor = await get_vendor_by_user_id(current_user["sub"])
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    if not vendor["verified"]:
        raise HTTPException(status_code=403, detail="Vendor must be verified to add listings")
    
    # Create listing
    listing = RentalListing(
        **listing_data.model_dump(),
        vendor_id=vendor["id"],
        vendor_name=vendor["business_name"],
        source="manual",
        approved=False  # Requires admin approval
    )
    
    await create_listing(listing.model_dump())
    return listing

@api_router.patch("/vendor/listings/{listing_id}/availability")
async def toggle_listing_availability(
    listing_id: str,
    available: bool,
    current_user: dict = Depends(require_vendor)
):
    """Toggle listing availability"""
    vendor = await get_vendor_by_user_id(current_user["sub"])
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    listing = await get_listing_by_id(listing_id)
    if not listing or listing["vendor_id"] != vendor["id"]:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    success = await update_listing_availability(listing_id, available)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update listing")
    
    return {"message": "Listing availability updated", "available": available}

@api_router.delete("/vendor/listings/{listing_id}")
async def remove_listing(listing_id: str, current_user: dict = Depends(require_vendor)):
    """Delete a listing"""
    vendor = await get_vendor_by_user_id(current_user["sub"])
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    listing = await get_listing_by_id(listing_id)
    if not listing or listing["vendor_id"] != vendor["id"]:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    success = await delete_listing(listing_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete listing")
    
    return {"message": "Listing deleted successfully"}

# ============================================================================
# RENTAL SEARCH ROUTES
# ============================================================================

@api_router.get("/rentals", response_model=List[RentalListing])
async def search_rentals(
    vehicle_type: Optional[str] = None,
    city: Optional[str] = None,
    max_price: Optional[float] = None,
    sort_by: str = "price_asc"
):
    """Search for rental vehicles"""
    query = {
        "vehicle_type": vehicle_type,
        "city": city,
        "max_price": max_price
    }
    
    listings = await search_listings(query, sort_by)
    return [RentalListing(**listing) for listing in listings]

@api_router.get("/rentals/{listing_id}", response_model=RentalListing)
async def get_rental_details(listing_id: str):
    """Get rental listing details"""
    listing = await get_listing_by_id(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return RentalListing(**listing)

# ============================================================================
# FEEDBACK ROUTES
# ============================================================================

@api_router.post("/feedback", response_model=Feedback)
async def submit_feedback(
    feedback_data: FeedbackCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit feedback for a listing"""
    # Verify listing exists
    listing = await get_listing_by_id(feedback_data.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    user_data = await get_user_by_id(current_user["sub"])
    
    feedback = Feedback(
        **feedback_data.model_dump(),
        user_id=current_user["sub"],
        user_name=user_data["name"]
    )
    
    await create_feedback(feedback.model_dump())
    return feedback

@api_router.get("/feedback/listing/{listing_id}", response_model=List[Feedback])
async def get_feedback_for_listing(listing_id: str):
    """Get all feedback for a listing"""
    feedback = await get_listing_feedback(listing_id)
    return [Feedback(**item) for item in feedback]

# ============================================================================
# ADMIN ROUTES
# ============================================================================

@api_router.get("/admin/vendors/pending", response_model=List[Vendor])
async def get_pending_vendor_approvals(current_user: dict = Depends(require_admin)):
    """Get pending vendor approvals"""
    vendors = await get_pending_vendors()
    return [Vendor(**vendor) for vendor in vendors]

@api_router.patch("/admin/vendors/{vendor_id}/verify")
async def verify_vendor(
    vendor_id: str,
    verified: bool,
    current_user: dict = Depends(require_admin)
):
    """Verify or reject a vendor"""
    success = await update_vendor_verification(vendor_id, verified)
    if not success:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {"message": "Vendor verification updated", "verified": verified}

@api_router.get("/admin/listings/pending", response_model=List[RentalListing])
async def get_pending_listing_approvals(current_user: dict = Depends(require_admin)):
    """Get pending listing approvals"""
    listings = await get_pending_listings()
    return [RentalListing(**listing) for listing in listings]

@api_router.patch("/admin/listings/{listing_id}/approve")
async def approve_listing(
    listing_id: str,
    approved: bool,
    current_user: dict = Depends(require_admin)
):
    """Approve or reject a listing"""
    success = await update_listing_approval(listing_id, approved)
    if not success:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    return {"message": "Listing approval updated", "approved": approved}

@api_router.get("/admin/feedback", response_model=List[Feedback])
async def get_all_user_feedback(current_user: dict = Depends(require_admin)):
    """Get all feedback"""
    feedback = await get_all_feedback()
    return [Feedback(**item) for item in feedback]

@api_router.delete("/admin/listings/{listing_id}")
async def admin_delete_listing(listing_id: str, current_user: dict = Depends(require_admin)):
    """Admin delete a listing"""
    success = await delete_listing(listing_id)
    if not success:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    return {"message": "Listing deleted successfully"}

# ============================================================================
# SCRAPER ROUTES
# ============================================================================

async def run_scraper_task(city: str):
    """Background task to run scraper"""
    try:
        logger.info(f"Starting scraper for city: {city}")
        listings = scrape_all_sources(city)
        count = await save_scraped_listings(listings)
        logger.info(f"Scraper completed. Saved {count} new listings for {city}")
    except Exception as e:
        logger.error(f"Scraper error: {e}")

@api_router.post("/scraper/run")
async def trigger_scraper(
    city: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_admin)
):
    """Trigger web scraper for a city (admin only)"""
    background_tasks.add_task(run_scraper_task, city)
    return {"message": f"Scraper started for {city}"}

# ============================================================================
# HEALTH CHECK
# ============================================================================

@api_router.get("/")
async def root():
    return {"message": "RevRent API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
