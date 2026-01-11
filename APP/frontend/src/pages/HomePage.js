import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { searchRentals, triggerScraper } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Car, MapPin, Search, IndianRupee, LogOut, User, RefreshCw } from 'lucide-react';

const HomePage = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [city, setCity] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('price_asc');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [scrapingCity, setScrapingCity] = useState('');

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In production, use reverse geocoding API to get city from coordinates
          // For now, we'll just set a default city
          console.log('Location detected:', position.coords);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const params = {
        vehicle_type: vehicleType || undefined,
        city: city || undefined,
        max_price: maxPrice ? parseFloat(maxPrice) : undefined,
        sort_by: sortBy
      };

      const data = await searchRentals(params);
      setListings(data);
    } catch (error) {
      console.error('Search error:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScrape = async () => {
    if (!scrapingCity) return;
    
    try {
      await triggerScraper(scrapingCity);
      alert(`Scraper started for ${scrapingCity}. This may take a few moments.`);
      // Refresh listings after scraping
      setTimeout(() => {
        if (city) handleSearch({ preventDefault: () => {} });
      }, 3000);
    } catch (error) {
      console.error('Scraping error:', error);
      alert('Failed to trigger scraper');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="text-indigo-600" size={32} />
            <h1 className="text-2xl font-bold text-gray-900">RevRent</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.name}
              <Badge className="ml-2" variant={user?.role === 'admin' ? 'destructive' : 'default'}>
                {user?.role}
              </Badge>
            </span>
            
            {user?.role === 'vendor' && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/vendor')}
                data-testid="vendor-dashboard-button"
              >
                <User size={16} className="mr-2" />
                Vendor Dashboard
              </Button>
            )}
            
            {user?.role === 'admin' && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin')}
                data-testid="admin-dashboard-button"
              >
                <User size={16} className="mr-2" />
                Admin Panel
              </Button>
            )}
            
            <Button variant="ghost" onClick={logout} data-testid="logout-button">
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white p-8 mb-8">
          <h2 className="text-3xl font-bold mb-2">Find the Best Rental Deals</h2>
          <p className="text-indigo-100">Compare prices from multiple vendors and save money</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8" data-testid="search-form">
          <CardHeader>
            <CardTitle>Search Rental Vehicles</CardTitle>
            <CardDescription>Enter your preferences to find the best deals</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City / Location</Label>
                  <Input
                    id="city"
                    placeholder="e.g., Bangalore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    data-testid="search-city-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle-type">Vehicle Type</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger id="vehicle-type" data-testid="search-vehicle-type-select">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="2-wheeler">2-Wheeler</SelectItem>
                      <SelectItem value="4-wheeler">4-Wheeler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-price">Max Price (per day)</Label>
                  <Input
                    id="max-price"
                    type="number"
                    placeholder="e.g., 2000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    data-testid="search-max-price-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sort-by">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger id="sort-by" data-testid="search-sort-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price_asc">Price: Low to High</SelectItem>
                      <SelectItem value="price_desc">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading} data-testid="search-button">
                <Search size={16} className="mr-2" />
                {loading ? 'Searching...' : 'Search Rentals'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Admin Scraper Controls */}
        {isAdmin && (
          <Card className="mb-8 border-indigo-200 bg-indigo-50">
            <CardHeader>
              <CardTitle className="text-indigo-900">Admin: Trigger Web Scraper</CardTitle>
              <CardDescription className="text-indigo-700">
                Manually trigger scraping for a specific city
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Enter city to scrape"
                  value={scrapingCity}
                  onChange={(e) => setScrapingCity(e.target.value)}
                  data-testid="scraper-city-input"
                />
                <Button onClick={handleScrape} disabled={!scrapingCity} data-testid="trigger-scraper-button">
                  <RefreshCw size={16} className="mr-2" />
                  Scrape
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {searched && (
          <div data-testid="search-results">
            <h3 className="text-xl font-semibold mb-4">
              {listings.length} {listings.length === 1 ? 'Result' : 'Results'} Found
            </h3>

            {listings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No rentals found matching your criteria.</p>
                  <p className="text-sm text-gray-400 mt-2">Try adjusting your search filters.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Card 
                    key={listing.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/rental/${listing.id}`)}
                    data-testid="rental-listing-card"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{listing.vehicle_name}</CardTitle>
                          <p className="text-sm text-gray-500">{listing.model}</p>
                        </div>
                        <Badge variant={listing.vehicle_type === '2-wheeler' ? 'default' : 'secondary'}>
                          {listing.vehicle_type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600">
                          <MapPin size={16} className="mr-2" />
                          <span className="text-sm">{listing.location}</span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center text-2xl font-bold text-indigo-600">
                            <IndianRupee size={20} />
                            {listing.price_per_day}
                            <span className="text-sm font-normal text-gray-500 ml-1">/day</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2">
                          Provided by: {listing.vendor_name}
                        </div>
                        
                        {listing.source === 'scraped' && (
                          <Badge variant="outline" className="text-xs">Aggregated</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {!searched && (
          <Card>
            <CardContent className="text-center py-12">
              <Car size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Start searching to find rental vehicles</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default HomePage;
