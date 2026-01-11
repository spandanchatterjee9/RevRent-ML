# RevRent - Vehicle Rental Price Comparison Platform

RevRent is a full-stack web application that helps users find the most affordable vehicle rentals by aggregating listings from multiple vendors and online platforms. Built with FastAPI (Python) backend, React frontend, and MongoDB database.

## 🚀 Features

### For Users
- **Smart Search**: Search rentals by vehicle type, city, and price range
- **Price Comparison**: View sorted listings from cheapest to costliest
- **Location Detection**: Automatic location detection using browser geolocation
- **Reviews & Ratings**: Submit and view feedback for rental listings
- **Detailed Listings**: View complete vehicle information and vendor details

### For Vendors
- **Vendor Registration**: Easy registration process with admin approval
- **Listing Management**: Add, edit, and manage vehicle listings
- **Availability Control**: Toggle vehicle availability on/off
- **Dashboard**: Comprehensive vendor dashboard to track listings

### For Admins
- **Vendor Verification**: Approve or reject vendor registrations
- **Listing Approval**: Review and approve new listings
- **Feedback Management**: Monitor user feedback and ratings
- **Web Scraper Control**: Trigger scraping for specific cities

### Web Scraping
- **Multi-Source Aggregation**: Scrapes data from multiple rental platforms
- **Mock Data**: Includes mock scraper for demonstration
- **Extensible**: Easy to add real scrapers for actual websites
- **Background Jobs**: Scraping runs as background task

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Web Scraping**: BeautifulSoup4, Selenium (for future real scraping)
- **CORS**: Configured for frontend integration

### Frontend
- **Framework**: React 19
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI (Radix UI primitives)
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **State Management**: React Context API

### Database Schema
- **Users**: Authentication and role management (user/vendor/admin)
- **Vendors**: Business profiles with verification status
- **RentalListings**: Vehicle listings with approval workflow
- **Feedback**: User reviews and ratings

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+ and Yarn
- MongoDB (local or MongoDB Atlas)
- Linux/Unix environment (or WSL on Windows)

## ⚙️ How to Run Locally

### 1. Navigate to Project Directory
```bash
cd /app
```

### 2. Start All Services
```bash
# Start backend and frontend using supervisor
sudo supervisorctl restart all

# Check status
sudo supervisorctl status
```

Expected output:
```
backend                          RUNNING
frontend                         RUNNING
```

### 3. Seed the Database (First Time Only)

Populate with test data:
```bash
cd /app/backend
python seed_data.py
```

This creates test users and sample listings.

### 4. Access the Application

- **Frontend**: http://localhost:3000 (or your preview URL)
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

### 5. Login with Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@revrent.com | admin123 |
| User | user@example.com | user123 |
| Vendor | vendor@example.com | vendor123 |

## 🔧 How to Make Web Scraping Dynamic

The scraper is currently set up with mock data. To scrape real websites:

### File to Modify: `/app/backend/scraper.py`

### Current Mock Functions:
```python
def scrape_zoomcar(city: str) -> List[Dict]:
    """Mock scraper - returns generated data"""
    return generate_mock_listings(city, 5)
```

### Replace with Real Scraping:

#### Option A: BeautifulSoup (Static Websites)
```python
import requests
from bs4 import BeautifulSoup

def scrape_zoomcar(city: str) -> List[Dict]:
    url = f'https://www.zoomcar.com/in/{city.lower()}'
    
    response = requests.get(url, headers={
        'User-Agent': 'Mozilla/5.0...'
    })
    soup = BeautifulSoup(response.content, 'html.parser')
    
    listings = []
    # Inspect website to find correct CSS selectors
    for card in soup.find_all('div', class_='car-card'):
        listing = {
            "vehicle_name": card.find('h3').text.strip(),
            "price_per_day": float(
                card.find('span', class_='price')
                .text.replace('₹', '').strip()
            ),
            # ... extract other fields
        }
        listings.append(listing)
    
    return listings
```

#### Option B: Selenium (Dynamic Websites)
```python
from selenium import webdriver
from selenium.webdriver.common.by import By

def scrape_with_selenium(url: str):
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    driver = webdriver.Chrome(options=options)
    
    driver.get(url)
    # Wait for JavaScript to load
    driver.implicitly_wait(10)
    
    # Extract data
    listings = driver.find_elements(By.CLASS_NAME, 'listing-card')
    # Process listings...
    
    driver.quit()
    return listings
```

### Steps to Implement:

1. **Open scraper.py**
   ```bash
   nano /app/backend/scraper.py
   ```

2. **Replace mock functions** with real scraping logic

3. **Install Selenium (if needed)**
   ```bash
   cd /app/backend
   pip install selenium webdriver-manager
   pip freeze > requirements.txt
   ```

4. **Test the scraper**
   ```python
   # Test in Python shell
   from scraper import scrape_all_sources
   listings = scrape_all_sources("Bangalore")
   print(f"Scraped {len(listings)} listings")
   ```

5. **Restart backend**
   ```bash
   sudo supervisorctl restart backend
   ```

### Key Points for Web Scraping:
- Inspect target website HTML to find correct selectors
- Add error handling for network issues
- Respect rate limits (add delays between requests)
- Check website's Terms of Service
- Test with different cities

## 📁 Project Structure

```
/app/
├── backend/
│   ├── server.py           # FastAPI app with all routes
│   ├── models.py           # Pydantic data models
│   ├── auth.py             # JWT authentication
│   ├── database.py         # MongoDB operations
│   ├── scraper.py          # Web scraping ⭐ MODIFY THIS
│   ├── seed_data.py        # Test data generator
│   ├── requirements.txt    # Python packages
│   └── .env                # Backend config
│
├── frontend/
│   ├── src/
│   │   ├── pages/          # All React pages
│   │   ├── contexts/       # Auth context
│   │   ├── lib/api.js      # API calls
│   │   └── App.js          # Main app
│   ├── package.json        # Node packages
│   └── .env                # Frontend config
│
└── README.md               # This file
```

## 🔌 Main API Endpoints

### Public
- `GET /api/rentals` - Search rentals
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register

### Vendor (Protected)
- `POST /api/vendor/register` - Register as vendor
- `POST /api/vendor/listings` - Add listing
- `GET /api/vendor/listings` - View my listings

### Admin (Protected)
- `GET /api/admin/vendors/pending` - Pending vendors
- `PATCH /api/admin/listings/{id}/approve` - Approve listing
- `POST /api/scraper/run?city=Bangalore` - Trigger scraper

Full API documentation: http://localhost:8001/docs

## 🐛 Troubleshooting

### Services not running:
```bash
sudo supervisorctl status
sudo supervisorctl restart all
```

### Check logs:
```bash
# Backend logs
tail -f /var/log/supervisor/backend.err.log

# Frontend logs
tail -f /var/log/supervisor/frontend.err.log
```

### MongoDB issues:
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

### Port conflicts:
```bash
# Check what's using port 8001
sudo lsof -i :8001

# Check what's using port 3000
sudo lsof -i :3000
```

## 🌐 Environment Configuration

### Backend (.env)
Location: `/app/backend/.env`
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=revrent
CORS_ORIGINS=*
SECRET_KEY=your-secret-key
```

### Frontend (.env)
Location: `/app/frontend/.env`
```env
REACT_APP_BACKEND_URL=https://your-backend-url
```

**Important:** Don't hardcode URLs in code - always use these environment variables!

## 🎯 How to Add a New Feature

### Example: Add SMS Notifications

1. **Backend - Install package:**
   ```bash
   cd /app/backend
   pip install twilio
   pip freeze > requirements.txt
   ```

2. **Backend - Add endpoint:**
   ```python
   # In server.py
   @api_router.post("/notifications/sms")
   async def send_sms(phone: str, message: str):
       # Twilio code here
       pass
   ```

3. **Frontend - Call API:**
   ```javascript
   // In lib/api.js
   export const sendSMS = async (phone, message) => {
       await axios.post(`${API}/notifications/sms`, { phone, message });
   };
   ```

4. **Restart services:**
   ```bash
   sudo supervisorctl restart backend frontend
   ```

## 📊 Database Collections

- **users**: User accounts and authentication
- **vendors**: Vendor business profiles
- **listings**: Rental vehicle listings
- **feedback**: User reviews and ratings

View data:
```bash
mongosh
use revrent
db.listings.find().pretty()
```

## 🚀 Deployment Tips

### Backend (Railway/Render):
- Set environment variables in dashboard
- Use MongoDB Atlas (not local MongoDB)
- Update CORS_ORIGINS to frontend URL

### Frontend (Vercel/Netlify):
- Build command: `yarn build`
- Output directory: `build`
- Set REACT_APP_BACKEND_URL to backend URL

## 📝 Quick Commands

```bash
# View all services
sudo supervisorctl status

# Restart services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
sudo supervisorctl restart all

# View logs
tail -f /var/log/supervisor/backend.*.log
tail -f /var/log/supervisor/frontend.*.log

# Seed database
cd /app/backend && python seed_data.py

# Test API
curl http://localhost:8001/api/
curl http://localhost:8001/api/rentals

# MongoDB shell
mongosh
```

## 🎓 User Flows

### Customer Flow:
1. Register/Login
2. Search rentals by city
3. View and compare prices
4. Click listing for details
5. Submit feedback

### Vendor Flow:
1. Register as vendor
2. Wait for admin approval
3. Add vehicle listings
4. Wait for listing approval
5. Manage availability

### Admin Flow:
1. Login as admin
2. Approve pending vendors
3. Approve pending listings
4. Monitor feedback
5. Trigger web scraper

## 💡 Tips for Dynamic Scraping

### Finding CSS Selectors:
1. Open target website in Chrome
2. Right-click element → "Inspect"
3. Note the class name or ID
4. Use in BeautifulSoup: `soup.find('div', class_='car-card')`

### Testing Scrapers:
```bash
cd /app/backend
python
>>> from scraper import scrape_zoomcar
>>> listings = scrape_zoomcar("Bangalore")
>>> print(listings)
```

### Common Issues:
- **403 Forbidden**: Add proper User-Agent header
- **Empty results**: Website uses JavaScript → use Selenium
- **Timeout**: Increase timeout or add retries
- **Blocked**: Implement delays between requests

---

## 🎉 You're All Set!

The application is now running with:
- ✅ Full authentication system
- ✅ Role-based access control
- ✅ Search and filtering
- ✅ Vendor management
- ✅ Admin panel
- ✅ Web scraper (mock data)
- ✅ Feedback system

**Next Steps:**
1. Login and explore the features
2. Try different user roles
3. Implement real web scraping
4. Customize for your needs

For questions or issues, check the logs and API documentation!
