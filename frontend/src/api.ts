/**
 * api.ts - API client for communicating with the backend
 */

import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { Donation, ApiResponse, DonationFormData } from './types';

// API base URL - connects to your Express backend
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API Error class for better error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    status?: number,
    errors?: string[]
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
  status?: number;
  errors?: string[];
}

/**
 * Helper function to handle API responses and errors
 */
const handleApiResponse = async <T>(
  apiCall: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> => {
  try {
    const response = await apiCall();
    const { data } = response;
    
    if (!data.success) {
      throw new ApiError(
        data.message || 'API request failed',
        response.status,
        data.errors
      );
    }
    
    return data.data as T;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const response = error.response;
      const message = response?.data?.message || error.message;
      const errors = response?.data?.errors;
      throw new ApiError(message, response?.status, errors);
    }
    throw error;
  }
};

/**
 * Health check - Test if backend API is running
 */
export const checkHealth = async (): Promise<any> => {
  return handleApiResponse(() => apiClient.get('/health'));
};

/**
 * Get all donations from the backend
 */
export const getAllDonations = async (): Promise<Donation[]> => {
  return handleApiResponse(() => apiClient.get('/donations'));
};

/**
 * Create a new donation
 */
export const createDonation = async (donationData: DonationFormData): Promise<Donation> => {
  const apiData = {
    donor_name: donationData.donor_name.trim(),
    donation_type: donationData.donation_type,
    quantity: parseFloat(donationData.quantity),
    date: donationData.date,
  };
  
  return handleApiResponse(() => apiClient.post('/donations', apiData));
};

/**
 * Update an existing donation
 */
export const updateDonation = async (
  id: number, 
  donationData: Partial<DonationFormData>
): Promise<Donation> => {
  const apiData: any = {};
  
  if (donationData.donor_name !== undefined) {
    apiData.donor_name = donationData.donor_name.trim();
  }
  if (donationData.donation_type !== undefined && donationData.donation_type !== '') {
    apiData.donation_type = donationData.donation_type;
  }
  if (donationData.quantity !== undefined && donationData.quantity !== '') {
    apiData.quantity = parseFloat(donationData.quantity);
  }
  if (donationData.date !== undefined) {
    apiData.date = donationData.date;
  }
  
  return handleApiResponse(() => apiClient.put(`/donations/${id}`, apiData));
};

/**
 * Delete a donation
 */
export const deleteDonation = async (id: number): Promise<void> => {
  return handleApiResponse(() => apiClient.delete(`/donations/${id}`));
};

/**
 * Utility function to test API connectivity
 */
export const testApiConnection = async (): Promise<boolean> => {
  try {
    await checkHealth();
    return true;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};