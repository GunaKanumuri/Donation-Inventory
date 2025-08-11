/**
 * types.ts - Complete TypeScript type definitions for the frontend
 * 
 * This file contains ALL the type definitions needed by the frontend,
 * including the missing ApiResponse interface.
 */

// Donation types enum - matches backend exactly
export const DonationType = {
  MONEY: 'money',
  FOOD: 'food',
  CLOTHING: 'clothing',
  TOYS: 'toys',
  BOOKS: 'books',
  HOUSEHOLD: 'household',
  OTHER: 'other'
} as const;

export type DonationType = typeof DonationType[keyof typeof DonationType];

/**
 * Core Donation interface - represents a complete donation record
 */
export interface Donation {
  id: number;
  donor_name: string;
  donation_type: DonationType;
  quantity: number;
  date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Form data types for creating and editing donations
 */
export interface DonationFormData {
  donor_name: string;
  donation_type: DonationType | '';
  quantity: string; // String in form, converted to number before API call
  date: string;
}

/**
 * API Response types - matches backend response format
 * THIS IS THE MISSING INTERFACE THAT WAS CAUSING THE ERROR
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

/**
 * UI State types for managing component state
 */
export interface UIState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Form validation error type
 */
export interface FormErrors {
  donor_name?: string;
  donation_type?: string;
  quantity?: string;
  date?: string;
}

/**
 * Donation type options for form dropdown
 */
export interface DonationTypeOption {
  value: DonationType;
  label: string;
  icon: string;
}

/**
 * Statistics type for potential dashboard features
 */
export interface DonationStats {
  total: number;
  byType: Record<DonationType, number>;
  totalValue: number;
  recentCount: number;
}

/**
 * Edit mode state for inline editing
 */
export interface EditState {
  isEditing: boolean;
  editingId: number | null;
  editData: DonationFormData;
}

// ...existing code...