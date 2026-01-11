import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getVendorProfile, 
  registerVendor, 
  getVendorListings, 
  addListing,
  toggleListingAvailability,
  deleteListing 
} from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { ArrowLeft, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

const VendorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [vendorProfile, setVendorProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showAddListingForm, setShowAddListingForm] = useState(false);

  // Vendor registration form
  const [businessName, setBusinessName] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');

  // Listing form
  const [vehicleType, setVehicleType] = useState('2-wheeler');
  const [vehicleName, setVehicleName] = useState('');
  const [model, setModel] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [listingLocation, setListingLocation] = useState('');
  const [listingCity, setListingCity] = useState('');
  const [listingDescription, setListingDescription] = useState('');

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      const profile = await getVendorProfile();
      setVendorProfile(profile);
      
      const listingsData = await getVendorListings();
      setListings(listingsData);
    } catch (error) {
      if (error.response?.status === 404) {
        setShowRegisterForm(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVendor = async (e) => {
    e.preventDefault();
    try {
      await registerVendor({
        business_name: businessName,
        contact,
        location,
        city,
        description
      });
      await loadVendorData();
      setShowRegisterForm(false);
      alert('Vendor registration submitted! Wait for admin approval.');
    } catch (error) {
      alert('Failed to register vendor');
    }
  };

  const handleAddListing = async (e) => {
    e.preventDefault();
    try {
      await addListing({
        vehicle_type: vehicleType,
        vehicle_name: vehicleName,
        model,
        price_per_day: parseFloat(pricePerDay),
        location: listingLocation,
        city: listingCity,
        description: listingDescription
      });
      await loadVendorData();
      setShowAddListingForm(false);
      // Reset form
      setVehicleName('');
      setModel('');
      setPricePerDay('');
      setListingLocation('');
      setListingDescription('');
      alert('Listing submitted for admin approval!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to add listing');
    }
  };

  const handleToggleAvailability = async (id, currentAvailability) => {
    try {
      await toggleListingAvailability(id, !currentAvailability);
      await loadVendorData();
    } catch (error) {
      alert('Failed to update availability');
    }
  };

  const handleDeleteListing = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await deleteListing(id);
        await loadVendorData();
      } catch (error) {
        alert('Failed to delete listing');
      }
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (showRegisterForm) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft size={16} className="mr-2" />
            Back to Home
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Register as Vendor</CardTitle>
              <CardDescription>Complete your vendor profile to start listing vehicles</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegisterVendor} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name *</Label>
                  <Input
                    id="business-name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    data-testid="vendor-business-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Number *</Label>
                  <Input
                    id="contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                    data-testid="vendor-contact-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Address *</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    data-testid="vendor-location-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    data-testid="vendor-city-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    data-testid="vendor-description-input"
                  />
                </div>

                <Button type="submit" className="w-full" data-testid="vendor-register-button">
                  Submit Registration
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-2">
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
          </div>
        </div>

        {/* Vendor Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{vendorProfile?.business_name}</CardTitle>
                <CardDescription>{vendorProfile?.location}, {vendorProfile?.city}</CardDescription>
              </div>
              <Badge variant={vendorProfile?.verified ? 'default' : 'secondary'}>
                {vendorProfile?.verified ? 'Verified' : 'Pending Verification'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Contact: {vendorProfile?.contact}</p>
            {vendorProfile?.description && (
              <p className="text-sm text-gray-600 mt-2">{vendorProfile?.description}</p>
            )}
          </CardContent>
        </Card>

        {!vendorProfile?.verified && (
          <Alert className="mb-6">
            <AlertDescription>
              Your vendor account is pending admin verification. You can add listings once verified.
            </AlertDescription>
          </Alert>
        )}

        {/* Listings Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">My Listings ({listings.length})</h2>
          {vendorProfile?.verified && (
            <Dialog open={showAddListingForm} onOpenChange={setShowAddListingForm}>
              <DialogTrigger asChild>
                <Button data-testid="add-listing-button">
                  <Plus size={16} className="mr-2" />
                  Add Listing
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Listing</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddListing} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vehicle Type</Label>
                      <Select value={vehicleType} onValueChange={setVehicleType}>
                        <SelectTrigger data-testid="listing-vehicle-type-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2-wheeler">2-Wheeler</SelectItem>
                          <SelectItem value="4-wheeler">4-Wheeler</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Vehicle Name *</Label>
                      <Input
                        value={vehicleName}
                        onChange={(e) => setVehicleName(e.target.value)}
                        required
                        placeholder="e.g., Honda Activa"
                        data-testid="listing-vehicle-name-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Model *</Label>
                      <Input
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        required
                        placeholder="e.g., 6G"
                        data-testid="listing-model-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Price per Day (₹) *</Label>
                      <Input
                        type="number"
                        value={pricePerDay}
                        onChange={(e) => setPricePerDay(e.target.value)}
                        required
                        placeholder="e.g., 500"
                        data-testid="listing-price-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Location *</Label>
                      <Input
                        value={listingLocation}
                        onChange={(e) => setListingLocation(e.target.value)}
                        required
                        placeholder="e.g., Koramangala"
                        data-testid="listing-location-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>City *</Label>
                      <Input
                        value={listingCity}
                        onChange={(e) => setListingCity(e.target.value)}
                        required
                        placeholder="e.g., Bangalore"
                        data-testid="listing-city-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={listingDescription}
                      onChange={(e) => setListingDescription(e.target.value)}
                      rows={3}
                      placeholder="Additional details about the vehicle"
                      data-testid="listing-description-input"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" data-testid="submit-listing-button">Add Listing</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddListingForm(false)}>Cancel</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {listings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No listings yet. Add your first vehicle listing!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card key={listing.id} data-testid="vendor-listing-card">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{listing.vehicle_name}</CardTitle>
                      <p className="text-sm text-gray-500">{listing.model}</p>
                    </div>
                    <Badge variant={listing.approved ? 'default' : 'secondary'}>
                      {listing.approved ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">{listing.location}</p>
                    <p className="text-2xl font-bold text-indigo-600">₹{listing.price_per_day}/day</p>
                    <p className="text-xs text-gray-500">{listing.description}</p>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant={listing.available ? 'default' : 'secondary'}
                        onClick={() => handleToggleAvailability(listing.id, listing.available)}
                        className="flex-1"
                        data-testid="toggle-availability-button"
                      >
                        {listing.available ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        <span className="ml-2">{listing.available ? 'Available' : 'Unavailable'}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteListing(listing.id)}
                        data-testid="delete-listing-button"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
