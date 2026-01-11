from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime
import uuid

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: Literal["user", "vendor", "admin"] = "user"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Vendor Models
class VendorBase(BaseModel):
    business_name: str
    contact: str
    location: str
    city: str
    description: Optional[str] = None

class VendorCreate(VendorBase):
    pass

class Vendor(VendorBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Rental Listing Models
class RentalListingBase(BaseModel):
    vehicle_type: Literal["2-wheeler", "4-wheeler"]
    vehicle_name: str
    model: str
    price_per_day: float
    location: str
    city: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    available: bool = True

class RentalListingCreate(RentalListingBase):
    pass

class RentalListing(RentalListingBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vendor_id: str
    vendor_name: Optional[str] = None
    source: Literal["manual", "scraped"] = "manual"
    approved: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Feedback Models
class FeedbackBase(BaseModel):
    listing_id: str
    rating: int = Field(ge=1, le=5)
    message: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    pass

class Feedback(FeedbackBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Token Model
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Search Query
class RentalSearchQuery(BaseModel):
    vehicle_type: Optional[Literal["2-wheeler", "4-wheeler"]] = None
    city: Optional[str] = None
    max_price: Optional[float] = None
    sort_by: Literal["price_asc", "price_desc", "newest"] = "price_asc"
