import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Rental APIs
export const searchRentals = async (params) => {
  const response = await axios.get(`${API}/rentals`, { params });
  return response.data;
};

export const getRentalDetails = async (id) => {
  const response = await axios.get(`${API}/rentals/${id}`);
  return response.data;
};

// Vendor APIs
export const registerVendor = async (data) => {
  const response = await axios.post(`${API}/vendor/register`, data, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getVendorProfile = async () => {
  const response = await axios.get(`${API}/vendor/me`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getVendorListings = async () => {
  const response = await axios.get(`${API}/vendor/listings`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const addListing = async (data) => {
  const response = await axios.post(`${API}/vendor/listings`, data, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const toggleListingAvailability = async (id, available) => {
  const response = await axios.patch(
    `${API}/vendor/listings/${id}/availability`,
    null,
    {
      params: { available },
      headers: getAuthHeaders()
    }
  );
  return response.data;
};

export const deleteListing = async (id) => {
  const response = await axios.delete(`${API}/vendor/listings/${id}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Feedback APIs
export const submitFeedback = async (data) => {
  const response = await axios.post(`${API}/feedback`, data, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getListingFeedback = async (listingId) => {
  const response = await axios.get(`${API}/feedback/listing/${listingId}`);
  return response.data;
};

// Admin APIs
export const getPendingVendors = async () => {
  const response = await axios.get(`${API}/admin/vendors/pending`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const verifyVendor = async (vendorId, verified) => {
  const response = await axios.patch(
    `${API}/admin/vendors/${vendorId}/verify`,
    null,
    {
      params: { verified },
      headers: getAuthHeaders()
    }
  );
  return response.data;
};

export const getPendingListings = async () => {
  const response = await axios.get(`${API}/admin/listings/pending`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const approveListing = async (listingId, approved) => {
  const response = await axios.patch(
    `${API}/admin/listings/${listingId}/approve`,
    null,
    {
      params: { approved },
      headers: getAuthHeaders()
    }
  );
  return response.data;
};

export const getAllFeedback = async () => {
  const response = await axios.get(`${API}/admin/feedback`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const triggerScraper = async (city) => {
  const response = await axios.post(
    `${API}/scraper/run`,
    null,
    {
      params: { city },
      headers: getAuthHeaders()
    }
  );
  return response.data;
};
