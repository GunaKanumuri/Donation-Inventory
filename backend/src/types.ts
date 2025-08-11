/**
 * types.ts - TypeScript type definitions for the donation management system
 * 
 * This file defines the core data types used throughout the backend API.
 * These types ensure type safety and consistency across the application.
 */

import { z } from 'zod';

// Enum for donation types - matches the frontend requirements
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
 * Core Donation interface - represents a donation record in the database
 */
export interface Donation {
  id: number;                    // Auto-generated primary key
  donor_name: string;           // Name of the person/organization donating
  donation_type: DonationType;  // Type of donation from enum above
  quantity: number;             // Amount or quantity donated
  date: string;                 // Date of donation (ISO string format)
  created_at: string;           // Timestamp when record was created
  updated_at: string;           // Timestamp when record was last updated
}

/**
 * Input type for creating a new donation (excludes auto-generated fields)
 */
export interface CreateDonationInput {
  donor_name: string;
  donation_type: DonationType;
  quantity: number;
  date: string;
}

/**
 * Input type for updating an existing donation
 */
export interface UpdateDonationInput {
  donor_name?: string;
  donation_type?: DonationType;
  quantity?: number;
  date?: string;
}

/**
 * Zod validation schemas for runtime type checking and validation
 * These schemas validate incoming API requests to ensure data integrity
 */

// Schema for creating a new donation
export const CreateDonationSchema = z.object({
  donor_name: z.string()
    .min(2, 'Donor name must be at least 2 characters')
    .max(100, 'Donor name must be less than 100 characters')
    .trim(),
  
  donation_type: z.enum([
    DonationType.MONEY,
    DonationType.FOOD,
    DonationType.CLOTHING,
    DonationType.TOYS,
    DonationType.BOOKS,
    DonationType.HOUSEHOLD,
    DonationType.OTHER
  ]),
  
  quantity: z.number()
    .positive('Quantity must be a positive number')
    .max(1000000, 'Quantity seems too large'),
  
  date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Please provide a valid date'
    })
});

// Schema for updating a donation (all fields optional)
export const UpdateDonationSchema = z.object({
  donor_name: z.string()
    .min(2, 'Donor name must be at least 2 characters')
    .max(100, 'Donor name must be less than 100 characters')
    .trim()
    .optional(),
  
  donation_type: z.enum([
    DonationType.MONEY,
    DonationType.FOOD,
    DonationType.CLOTHING,
    DonationType.TOYS,
    DonationType.BOOKS,
    DonationType.HOUSEHOLD,
    DonationType.OTHER
  ]).optional(),
  
  quantity: z.number()
    .positive('Quantity must be a positive number')
    .max(1000000, 'Quantity seems too large')
    .optional(),
  
  date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Please provide a valid date'
    })
    .optional()
});

/**
 * API Response types for consistent response formatting
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}