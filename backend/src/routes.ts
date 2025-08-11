/**
 * routes.ts - Express router with RESTful API endpoints for donation management
 * 
 * This module defines all HTTP endpoints for the donation management system:
 * - GET /api/donations - Get all donations
 * - POST /api/donations - Create new donation
 * - PUT /api/donations/:id - Update existing donation
 * - DELETE /api/donations/:id - Delete donation
 * - GET /api/health - Health check endpoint
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { database } from './database';
import { 
  CreateDonationSchema, 
  UpdateDonationSchema,
  ApiResponse,
  Donation,
  CreateDonationInput,
  UpdateDonationInput
} from './types';
import { ZodIssue } from 'zod';

const router = Router();

/**
 * Utility function to handle async route errors
 * Wraps async route handlers to catch and forward errors to error middleware
 */
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Utility function to send consistent API responses
 */
const sendResponse = <T>(res: Response, status: number, data: ApiResponse<T>) => {
  res.status(status).json(data);
};

/**
 * GET /api/health
 * Health check endpoint to verify API is running
 * 
 * @route GET /api/health
 * @returns {ApiResponse} Health status with timestamp
 */
router.get('/health', (req: Request, res: Response) => {
  sendResponse(res, 200, {
    success: true,
    message: 'Donation Management API is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

/**
 * GET /api/donations
 * Retrieve all donation records from the database
 * 
 * @route GET /api/donations
 * @returns {ApiResponse<Donation[]>} Array of all donations
 */
router.get('/donations', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('📊 Fetching all donations...');
    
    const donations = await database.getAllDonations();
    
    sendResponse(res, 200, {
      success: true,
      data: donations,
      message: `Retrieved ${donations.length} donations`
    });
    
    console.log(`✅ Successfully returned ${donations.length} donations`);
  } catch (error) {
    console.error('❌ Error in GET /donations:', error);
    sendResponse(res, 500, {
      success: false,
      message: 'Failed to retrieve donations'
    });
  }
}));

/**
 * POST /api/donations
 * Create a new donation record
 * 
 * @route POST /api/donations
 * @param {CreateDonationInput} req.body - Donation data to create
 * @returns {ApiResponse<Donation>} Created donation with generated ID
 */
router.post('/donations', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('📝 Creating new donation:', req.body);
    
    // Validate request body using Zod schema
    const validationResult = CreateDonationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err: ZodIssue) => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      console.log('⚠️ Validation failed:', errors);
      return sendResponse(res, 400, {
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    const donationData: CreateDonationInput = validationResult.data;
    
    // Create donation in database
    const newDonation = await database.createDonation(donationData);
    
    sendResponse(res, 201, {
      success: true,
      data: newDonation,
      message: 'Donation created successfully'
    });
    
    console.log(`✅ Successfully created donation with ID: ${newDonation.id}`);
  } catch (error) {
    console.error('❌ Error in POST /donations:', error);
    sendResponse(res, 500, {
      success: false,
      message: 'Failed to create donation'
    });
  }
}));

/**
 * PUT /api/donations/:id
 * Update an existing donation record
 * 
 * @route PUT /api/donations/:id
 * @param {string} req.params.id - Donation ID to update
 * @param {UpdateDonationInput} req.body - Fields to update
 * @returns {ApiResponse<Donation>} Updated donation data
 */
router.put('/donations/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const donationId = parseInt(req.params.id);
    console.log(`📝 Updating donation ID: ${donationId}`, req.body);
    
    // Validate donation ID
    if (isNaN(donationId) || donationId <= 0) {
      return sendResponse(res, 400, {
        success: false,
        message: 'Invalid donation ID'
      });
    }
    
    // Validate request body using Zod schema
    const validationResult = UpdateDonationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err: ZodIssue) => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      console.log('⚠️ Validation failed:', errors);
      return sendResponse(res, 400, {
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    const updateData: UpdateDonationInput = validationResult.data;
    
    // Check if donation exists
    const existingDonation = await database.getDonationById(donationId);
    if (!existingDonation) {
      return sendResponse(res, 404, {
        success: false,
        message: 'Donation not found'
      });
    }
    
    // Update donation in database
    const updatedDonation = await database.updateDonation(donationId, updateData);
    
    if (!updatedDonation) {
      return sendResponse(res, 404, {
        success: false,
        message: 'Donation not found'
      });
    }
    
    sendResponse(res, 200, {
      success: true,
      data: updatedDonation,
      message: 'Donation updated successfully'
    });
    
    console.log(`✅ Successfully updated donation ID: ${donationId}`);
  } catch (error) {
    console.error('❌ Error in PUT /donations/:id:', error);
    sendResponse(res, 500, {
      success: false,
      message: 'Failed to update donation'
    });
  }
}));

/**
 * DELETE /api/donations/:id
 * Delete a donation record
 * 
 * @route DELETE /api/donations/:id
 * @param {string} req.params.id - Donation ID to delete
 * @returns {ApiResponse} Success confirmation
 */
router.delete('/donations/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const donationId = parseInt(req.params.id);
    console.log(`🗑️ Deleting donation ID: ${donationId}`);
    
    // Validate donation ID
    if (isNaN(donationId) || donationId <= 0) {
      return sendResponse(res, 400, {
        success: false,
        message: 'Invalid donation ID'
      });
    }
    
    // Check if donation exists
    const existingDonation = await database.getDonationById(donationId);
    if (!existingDonation) {
      return sendResponse(res, 404, {
        success: false,
        message: 'Donation not found'
      });
    }
    
    // Delete donation from database
    const deleted = await database.deleteDonation(donationId);
    
    if (!deleted) {
      return sendResponse(res, 404, {
        success: false,
        message: 'Donation not found'
      });
    }
    
    sendResponse(res, 200, {
      success: true,
      message: 'Donation deleted successfully'
    });
    
    console.log(`✅ Successfully deleted donation ID: ${donationId}`);
  } catch (error) {
    console.error('❌ Error in DELETE /donations/:id:', error);
    sendResponse(res, 500, {
      success: false,
      message: 'Failed to delete donation'
    });
  }
}));

/**
 * GET /api/donations/:id
 * Get a single donation by ID (bonus endpoint for future use)
 * 
 * @route GET /api/donations/:id
 * @param {string} req.params.id - Donation ID to retrieve
 * @returns {ApiResponse<Donation>} Single donation data
 */
router.get('/donations/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const donationId = parseInt(req.params.id);
    console.log(`📊 Fetching donation ID: ${donationId}`);
    
    // Validate donation ID
    if (isNaN(donationId) || donationId <= 0) {
      return sendResponse(res, 400, {
        success: false,
        message: 'Invalid donation ID'
      });
    }
    
    // Get donation from database
    const donation = await database.getDonationById(donationId);
    
    if (!donation) {
      return sendResponse(res, 404, {
        success: false,
        message: 'Donation not found'
      });
    }
    
    sendResponse(res, 200, {
      success: true,
      data: donation,
      message: 'Donation retrieved successfully'
    });
    
    console.log(`✅ Successfully returned donation ID: ${donationId}`);
  } catch (error) {
    console.error('❌ Error in GET /donations/:id:', error);
    sendResponse(res, 500, {
      success: false,
      message: 'Failed to retrieve donation'
    });
  }
}));

/**
 * 404 handler for undefined API routes
 * Provides helpful error message for invalid endpoints
 */
router.use('*', (req: Request, res: Response) => {
  sendResponse(res, 404, {
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    data: {
      availableEndpoints: [
        'GET /api/health',
        'GET /api/donations',
        'POST /api/donations',
        'PUT /api/donations/:id',
        'DELETE /api/donations/:id',
        'GET /api/donations/:id'
      ]
    }
  });
});

export default router;