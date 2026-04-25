# RevRent-ML

RevRent-ML is a full-stack vehicle rental price comparison platform that enables users to find the most cost-effective rental options by aggregating listings from multiple vendors and platforms.

The system supports multiple user roles including customers, vendors, and administrators, with dedicated features for each.

---

## Features

### User
- Search rentals by city, vehicle type, and price range  
- Compare listings from multiple vendors  
- View detailed vehicle information  
- Submit reviews and ratings  

### Vendor
- Register as a vendor with admin approval  
- Add, update, and manage rental listings  
- Control vehicle availability  
- Access a dashboard for listing management  

### Admin
- Approve or reject vendor registrations  
- Review and approve rental listings  
- Monitor user feedback and ratings  
- Trigger data scraping processes  

### Web Scraping
- Aggregates rental data from multiple sources  
- Supports mock data and can be extended for real scraping  
- Runs scraping tasks in the background  

---

## Tech Stack

Frontend:
- React.js  
- Tailwind CSS  
- Axios  
- React Router  

Backend:
- FastAPI (Python)  
- REST APIs  
- JWT-based authentication  

Database:
- MongoDB  

---

## Project Structure
RevRent-ML/
│
├── APP/
│ ├── backend/
│ ├── frontend/
│ └── README.md
│
└── README.md
