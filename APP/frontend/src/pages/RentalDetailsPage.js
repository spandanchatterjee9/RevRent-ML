import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRentalDetails, getListingFeedback, submitFeedback } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { ArrowLeft, MapPin, IndianRupee, Star, Send } from 'lucide-react';

const RentalDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [listing, setListing] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Feedback form
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [listingData, feedbackData] = await Promise.all([
        getRentalDetails(id),
        getListingFeedback(id)
      ]);
      
      setListing(listingData);
      setFeedback(feedbackData);
    } catch (error) {
      console.error('Failed to load rental details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please login to submit feedback');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback({
        listing_id: id,
        rating,
        message
      });
      
      setMessage('');
      setRating(5);
      await loadData();
      alert('Feedback submitted successfully!');
    } catch (error) {
      alert('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">Rental not found</p>
              <Button onClick={() => navigate('/')} className="mt-4">
                Go Back Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Back to Search
        </Button>

        {/* Rental Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{listing.vehicle_name}</CardTitle>
                <p className="text-gray-500">{listing.model}</p>
              </div>
              <Badge variant={listing.vehicle_type === '2-wheeler' ? 'default' : 'secondary'}>
                {listing.vehicle_type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <MapPin size={20} className="mr-2" />
                <span>{listing.location}, {listing.city}</span>
              </div>

              <div className="flex items-center text-3xl font-bold text-indigo-600">
                <IndianRupee size={28} />
                {listing.price_per_day}
                <span className="text-lg font-normal text-gray-500 ml-2">/day</span>
              </div>

              {listing.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-600">{listing.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Vendor Information</h3>
                <p className="text-gray-600">{listing.vendor_name}</p>
                {listing.source === 'scraped' && (
                  <Badge variant="outline" className="mt-2">Aggregated Listing</Badge>
                )}
              </div>

              <div className="pt-4 border-t">
                <Badge variant={listing.available ? 'default' : 'secondary'}>
                  {listing.available ? 'Available' : 'Not Available'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {isAuthenticated ? (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className="focus:outline-none"
                        data-testid={`rating-${value}-button`}
                      >
                        <Star
                          size={32}
                          className={value <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback-message">Your Feedback (Optional)</Label>
                  <Textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Share your experience..."
                    data-testid="feedback-message-input"
                  />
                </div>

                <Button type="submit" disabled={submitting} data-testid="submit-feedback-button">
                  <Send size={16} className="mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </form>
            ) : (
              <p className="text-gray-500">
                Please <Button variant="link" onClick={() => navigate('/login')} className="p-0">login</Button> to submit feedback
              </p>
            )}
          </CardContent>
        </Card>

        {/* Existing Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Reviews ({feedback.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {feedback.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {feedback.map((item) => (
                  <div key={item.id} className="border-b pb-4 last:border-b-0" data-testid="feedback-item">
                    <div className="flex justify-between items-start mb-2">
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
                    {item.message && <p className="text-gray-600 text-sm">{item.message}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RentalDetailsPage;
