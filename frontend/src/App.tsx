
import React, { useState, useEffect, useCallback } from 'react';

// ErrorBoundary component to catch rendering errors
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    // You can log errorInfo to an error reporting service here
    console.error('Global ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', background: '#fff3f3', border: '1px solid #f00' }}>
          <h2>Something went wrong in the app.</h2>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <p>Please check the browser console for details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
import type {
  Donation,
  DonationFormData,
  DonationTypeOption,
  UIState,
  FormErrors,
  EditState
} from './types';
import { DonationType } from './types';
import {
  getAllDonations,
  createDonation,
  updateDonation,
  deleteDonation,
  testApiConnection,
  ApiError
} from './api';
import './App.css';

function App() {
  // ===== STATE MANAGEMENT =====
  
  // Donation data - always fetched from backend
  const [donations, setDonations] = useState<Donation[]>([]);
  
  // UI state management
  const [uiState, setUIState] = useState<UIState>({
    loading: true,
    error: null,
    success: null
  });
  
  // Form state for new donations
  const [formData, setFormData] = useState<DonationFormData>({
    donor_name: '',
    donation_type: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // Edit mode state
  const [editState, setEditState] = useState<EditState>({
    isEditing: false,
    editingId: null,
    editData: {
      donor_name: '',
      donation_type: '',
      quantity: '',
      date: ''
    }
  });
  
  // API connection status
  const [apiConnected, setApiConnected] = useState<boolean>(false);

  // ===== CONSTANTS =====
  
  // Donation type options with emojis
  const donationTypeOptions: DonationTypeOption[] = [
    { value: DonationType.MONEY, label: 'Money', icon: '💰' },
    { value: DonationType.FOOD, label: 'Food', icon: '🍎' },
    { value: DonationType.CLOTHING, label: 'Clothing', icon: '👕' },
    { value: DonationType.TOYS, label: 'Toys', icon: '🧸' },
    { value: DonationType.BOOKS, label: 'Books', icon: '📚' },
    { value: DonationType.HOUSEHOLD, label: 'Household Items', icon: '🏠' },
    { value: DonationType.OTHER, label: 'Other', icon: '📦' }
  ];

  // ===== UTILITY FUNCTIONS =====
  
  /**
   * Update UI state helper
   */
  const updateUIState = useCallback((updates: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Clear messages after delay
   */
  const clearMessages = useCallback(() => {
    setTimeout(() => {
      updateUIState({ success: null, error: null });
    }, 5000);
  }, [updateUIState]);

  /**
   * Load all donations from backend API
   */
  const loadDonations = useCallback(async () => {
    try {
      updateUIState({ loading: true, error: null });
      
      // Test API connection first
      const connected = await testApiConnection();
      setApiConnected(connected);
      
      if (!connected) {
        throw new Error('Cannot connect to backend API. Please ensure the server is running on port 5000.');
      }
      
      // Fetch donations from backend
      const donationsData = await getAllDonations();
      setDonations(donationsData);
      
      console.log(`📊 Loaded ${donationsData.length} donations from backend`);
    } catch (error) {
      console.error('❌ Error loading donations:', error);
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to load donations. Please check if the backend server is running.';
      updateUIState({ error: errorMessage });
    } finally {
      updateUIState({ loading: false });
    }
  }, [updateUIState]);

  // Load donations on component mount
  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  // ===== FORM VALIDATION =====
  
  /**
   * Validate form data
   */
  const validateForm = (data: DonationFormData): FormErrors => {
    const errors: FormErrors = {};
    
    if (!data.donor_name.trim()) {
      errors.donor_name = 'Donor name is required';
    } else if (data.donor_name.trim().length < 2) {
      errors.donor_name = 'Donor name must be at least 2 characters';
    }
    
    if (!data.donation_type) {
      errors.donation_type = 'Please select a donation type';
    }
    
    if (!data.quantity) {
      errors.quantity = 'Quantity is required';
    } else if (isNaN(Number(data.quantity)) || Number(data.quantity) <= 0) {
      errors.quantity = 'Quantity must be a positive number';
    }
    
    if (!data.date) {
      errors.date = 'Date is required';
    }
    
    return errors;
  };

  // ===== FORM HANDLERS =====
  
  /**
   * Handle form input changes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Handle form submission for new donations
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      updateUIState({ loading: true, error: null, success: null });
      
      // Create donation via API
      const newDonation = await createDonation(formData);
      
      // Reset form
      setFormData({
        donor_name: '',
        donation_type: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0]
      });
      setFormErrors({});
      
      // Reload donations to show updated list
      await loadDonations();
      
      updateUIState({ 
        success: `Donation from ${newDonation.donor_name} added successfully!`,
        loading: false 
      });
      clearMessages();
      
    } catch (error) {
      console.error('❌ Error creating donation:', error);
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to create donation';
      updateUIState({ error: errorMessage, loading: false });
      clearMessages();
    }
  };

  // ===== EDIT HANDLERS =====
  
  /**
   * Start editing a donation
   */
  const startEditing = (donation: Donation) => {
    setEditState({
      isEditing: true,
      editingId: donation.id,
      editData: {
        donor_name: donation.donor_name,
        donation_type: donation.donation_type,
        quantity: donation.quantity.toString(),
        date: donation.date
      }
    });
  };

  /**
   * Cancel editing
   */
  const cancelEditing = () => {
    setEditState({
      isEditing: false,
      editingId: null,
      editData: { donor_name: '', donation_type: '', quantity: '', date: '' }
    });
  };

  /**
   * Handle edit form input changes
   */
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditState(prev => ({
      ...prev,
      editData: { ...prev.editData, [name]: value }
    }));
  };

  /**
   * Save edited donation
   */
  const saveEdit = async () => {
    if (!editState.editingId) return;
    
    // Validate edit data
    const errors = validateForm(editState.editData);
    if (Object.keys(errors).length > 0) {
      updateUIState({ error: 'Please fix validation errors before saving' });
      clearMessages();
      return;
    }
    
    try {
      updateUIState({ loading: true, error: null, success: null });
      
      // Update donation via API
      const updatedDonation = await updateDonation(editState.editingId, editState.editData);
      
      // Exit edit mode
      cancelEditing();
      
      // Reload donations to show updated data
      await loadDonations();
      
      updateUIState({ 
        success: `Donation from ${updatedDonation.donor_name} updated successfully!`,
        loading: false 
      });
      clearMessages();
      
    } catch (error) {
      console.error('❌ Error updating donation:', error);
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to update donation';
      updateUIState({ error: errorMessage, loading: false });
      clearMessages();
    }
  };

  // ===== DELETE HANDLER =====
  
  /**
   * Delete a donation with confirmation
   */
  const handleDelete = async (donation: Donation) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the donation from ${donation.donor_name}? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      updateUIState({ loading: true, error: null, success: null });
      
      // Delete donation via API
      await deleteDonation(donation.id);
      
      // Reload donations to show updated list
      await loadDonations();
      
      updateUIState({ 
        success: `Donation from ${donation.donor_name} deleted successfully!`,
        loading: false 
      });
      clearMessages();
      
    } catch (error) {
      console.error('❌ Error deleting donation:', error);
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to delete donation';
      updateUIState({ error: errorMessage, loading: false });
      clearMessages();
    }
  };

  // ===== UTILITY FUNCTIONS =====
  
  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * Get donation type display info
   */
  const getDonationTypeInfo = (type: DonationType) => {
    return donationTypeOptions.find(option => option.value === type) || 
           { value: type, label: type, icon: '📦' };
  };

  /**
   * Format quantity display
   */
  const formatQuantity = (quantity: number, type: DonationType): string => {
    if (type === DonationType.MONEY) {
      return `$${quantity.toFixed(2)}`;
    }
    return `${quantity} items`;
  };

  // ===== RENDER =====
  
  return (
    <ErrorBoundary>
      <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-title">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minHeight: '100px' }}>
                    <h1 style={{ margin: 0, fontWeight: 700, fontSize: '2.5rem', textAlign: 'center' }}>Donation Management</h1>
                    <p style={{ margin: 0, fontSize: '1.2rem', textAlign: 'center', color: '#555' }}>Track and manage donations easily</p>
                  </div>
          </div>
          {/* API Status Indicator */}
          <div className="api-status">
            <span className={`status-indicator ${apiConnected ? 'connected' : 'disconnected'}`}>●</span>
            <span className="status-text">{apiConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </header>

  <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Alert Messages */}
        {uiState.error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span className="alert-message">{uiState.error}</span>
            <button
              className="alert-close"
              onClick={() => updateUIState({ error: null })}
            >
              ×
            </button>
          </div>
        )}

        {uiState.success && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            <span className="alert-message">{uiState.success}</span>
            <button
              className="alert-close"
              onClick={() => updateUIState({ success: null })}
            >
              ×
            </button>
          </div>
        )}

        {/* DONATION INPUT FORM - Core Requirement */}
        <section className="form-section" style={{ margin: '0 auto', maxWidth: 600, width: '100%' }}>
          <h2 style={{ textAlign: 'center' }}>Add New Donation</h2>
          <form onSubmit={handleSubmit} className="donation-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-row">
              {/* Donor Name */}
              <div className="form-group">
                <label htmlFor="donor_name">Donor Name *</label>
                <input
                  type="text"
                  id="donor_name"
                  name="donor_name"
                  value={formData.donor_name}
                  onChange={handleInputChange}
                  placeholder="Enter donor's full name"
                  className={formErrors.donor_name ? 'error' : ''}
                  required
                />
                {formErrors.donor_name && (
                  <span className="error-message">{formErrors.donor_name}</span>
                )}
              </div>

              {/* Donation Type */}
              <div className="form-group">
                <label htmlFor="donation_type">Donation Type *</label>
                <select
                  id="donation_type"
                  name="donation_type"
                  value={formData.donation_type}
                  onChange={handleInputChange}
                  className={formErrors.donation_type ? 'error' : ''}
                  required
                >
                  <option value="">Select donation type</option>
                  {donationTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
                {formErrors.donation_type && (
                  <span className="error-message">{formErrors.donation_type}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              {/* Quantity/Amount */}
              <div className="form-group">
                <label htmlFor="quantity">Quantity/Amount *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="Enter amount or quantity"
                  min="0.01"
                  step="0.01"
                  className={formErrors.quantity ? 'error' : ''}
                  required
                />
                {formErrors.quantity && (
                  <span className="error-message">{formErrors.quantity}</span>
                )}
              </div>

              {/* Date */}
              <div className="form-group">
                <label htmlFor="date">Date *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={formErrors.date ? 'error' : ''}
                  required
                />
                {formErrors.date && (
                  <span className="error-message">{formErrors.date}</span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={uiState.loading}>
                {uiState.loading ? (
                  <>
                    <span className="spinner"></span>
                    Adding...
                  </>
                ) : (
                  <>
                    ➕ Add Donation
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* DONATION LIST - Core Requirement */}
        <section className="list-section">
          <div className="section-header">
            <h2>📊 Donation Records</h2>
            {donations.length > 0 && (
              <span className="record-count">
                {donations.length} donation{donations.length !== 1 ? 's' : ''} recorded
              </span>
            )}
            {donations.length > 0 && (
              <button 
                onClick={loadDonations} 
                className="btn btn-secondary btn-small"
                disabled={uiState.loading}
              >
                🔄 Refresh
              </button>
            )}
          </div>

          {/* Loading State */}
          {uiState.loading ? (
            <div className="loading-state">
              <span className="spinner large"></span>
              <p>Loading donations from database...</p>
            </div>
          ) : donations.length === 0 ? (
            /* Empty State */
            <div className="empty-state">
              <div className="empty-icon">❤️</div>
              <h3>No donations recorded yet</h3>
              <p>Use the form above to add your first donation record.</p>
              <p className="help-text">All donations will be saved to the backend database and persist between sessions.</p>
            </div>
          ) : (
            /* Donation List */
            <div className="donations-grid">
              {donations.map(donation => (
                <div key={donation.id} className="donation-card">
                  {editState.isEditing && editState.editingId === donation.id ? (
                    /* Edit Mode */
                    <div className="edit-form">
                      <div className="form-group">
                        <label>Donor Name</label>
                        <input
                          type="text"
                          name="donor_name"
                          value={editState.editData.donor_name}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Donation Type</label>
                        <select
                          name="donation_type"
                          value={editState.editData.donation_type}
                          onChange={handleEditInputChange}
                          required
                        >
                          {donationTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.icon} {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Quantity/Amount</label>
                        <input
                          type="number"
                          name="quantity"
                          value={editState.editData.quantity}
                          onChange={handleEditInputChange}
                          min="0.01"
                          step="0.01"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Date</label>
                        <input
                          type="date"
                          name="date"
                          value={editState.editData.date}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      
                      <div className="edit-actions">
                        <button 
                          onClick={saveEdit}
                          className="btn btn-success btn-small"
                          disabled={uiState.loading}
                        >
                          💾 Save
                        </button>
                        <button 
                          onClick={cancelEditing}
                          className="btn btn-secondary btn-small"
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <>
                      <div className="donation-header">
                        <h3>{donation.donor_name}</h3>
                        <span className="donation-date">
                          {formatDate(donation.date)}
                        </span>
                      </div>
                      
                      <div className="donation-details">
                        <div className="detail-item">
                          <span className="detail-label">Type:</span>
                          <span className="detail-value type-badge">
                            {getDonationTypeInfo(donation.donation_type).icon} {getDonationTypeInfo(donation.donation_type).label}
                          </span>
                        </div>
                        
                        <div className="detail-item">
                          <span className="detail-label">Amount:</span>
                          <span className="detail-value quantity">
                            {formatQuantity(donation.quantity, donation.donation_type)}
                          </span>
                        </div>

                        <div className="detail-item">
                          <span className="detail-label">ID:</span>
                          <span className="detail-value">#{donation.id}</span>
                        </div>
                      </div>
                      
                      {/* EDIT/DELETE BUTTONS - Core Requirement */}
                      <div className="donation-actions">
                        <button 
                          onClick={() => startEditing(donation)}
                          className="btn btn-secondary btn-small"
                          disabled={uiState.loading}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(donation)}
                          className="btn btn-danger btn-small"
                          disabled={uiState.loading}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

  {/* Data Information Section moved to footer */}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Donation Management System</p>
        <p>Built with TypeScript, React, and Express • Data stored in SQLite database</p>
        <p style={{ fontWeight: 'bold', marginTop: '1rem' }}>Created by GUNA KANUMURI</p>
      </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;