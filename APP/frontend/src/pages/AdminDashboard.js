import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getPendingVendors, 
  verifyVendor, 
  getPendingListings, 
  approveListing,
  getAllFeedback 
} from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, CheckCircle, XCircle, Star } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [vendors, listings, feedbackData] = await Promise.all([
        getPendingVendors(),
        getPendingListings(),
        getAllFeedback()
      ]);
      
      setPendingVendors(vendors);
      setPendingListings(listings);
      setFeedback(feedbackData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyVendor = async (vendorId, verified) => {
    try {
      await verifyVendor(vendorId, verified);
      await loadAdminData();
    } catch (error) {
      alert('Failed to update vendor verification');
    }
  };

  const handleApproveListing = async (listingId, approved) => {
    try {
      await approveListing(listingId, approved);
      await loadAdminData();
    } catch (error) {
      alert('Failed to update listing approval');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
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
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
        </div>

        <Tabs defaultValue="vendors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="vendors" data-testid="vendors-tab">
              Pending Vendors ({pendingVendors.length})
            </TabsTrigger>
            <TabsTrigger value="listings" data-testid="listings-tab">
              Pending Listings ({pendingListings.length})
            </TabsTrigger>
            <TabsTrigger value="feedback" data-testid="feedback-tab">
              Feedback ({feedback.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Vendors Tab */}
          <TabsContent value="vendors" className="space-y-4" data-testid="vendors-content">
            <h2 className="text-xl font-semibold">Vendor Verifications</h2>
            
            {pendingVendors.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No pending vendor verifications</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingVendors.map((vendor) => (
                  <Card key={vendor.id} data-testid="pending-vendor-card">
                    <CardHeader>
                      <CardTitle>{vendor.business_name}</CardTitle>
                      <CardDescription>{vendor.location}, {vendor.city}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Contact:</strong> {vendor.contact}</p>
                        {vendor.description && (
                          <p className="text-sm text-gray-600">{vendor.description}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          Registered: {new Date(vendor.created_at).toLocaleDateString()}
                        </p>
                        
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => handleVerifyVendor(vendor.id, true)}
                            className="flex-1"
                            data-testid="approve-vendor-button"
                          >
                            <CheckCircle size={16} className="mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleVerifyVendor(vendor.id, false)}
                            variant="destructive"
                            className="flex-1"
                            data-testid="reject-vendor-button"
                          >
                            <XCircle size={16} className="mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending Listings Tab */}
          <TabsContent value="listings" className="space-y-4" data-testid="listings-content">
            <h2 className="text-xl font-semibold">Listing Approvals</h2>
            
            {pendingListings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No pending listing approvals</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingListings.map((listing) => (
                  <Card key={listing.id} data-testid="pending-listing-card">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{listing.vehicle_name}</CardTitle>
                          <p className="text-sm text-gray-500">{listing.model}</p>
                        </div>
                        <Badge>{listing.vehicle_type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">{listing.location}</p>
                        <p className="text-2xl font-bold text-indigo-600">₹{listing.price_per_day}/day</p>
                        <p className="text-xs text-gray-500">{listing.description}</p>
                        <p className="text-xs text-gray-400">Vendor: {listing.vendor_name}</p>
                        
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => handleApproveListing(listing.id, true)}
                            className="flex-1"
                            size="sm"
                            data-testid="approve-listing-button"
                          >
                            <CheckCircle size={16} className="mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleApproveListing(listing.id, false)}
                            variant="destructive"
                            className="flex-1"
                            size="sm"
                            data-testid="reject-listing-button"
                          >
                            <XCircle size={16} className="mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4" data-testid="feedback-content">
            <h2 className="text-xl font-semibold">User Feedback</h2>
            
            {feedback.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No feedback received yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {feedback.map((item) => (
                  <Card key={item.id} data-testid="feedback-card">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">{item.user_name || 'Anonymous'}</p>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={i < item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                          </div>
                          {item.message && <p className="text-sm text-gray-600">{item.message}</p>}
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
