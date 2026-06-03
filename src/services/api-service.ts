/**
 * API Service Layer for AMAL Mobile Application
 * Provides domain-specific methods for all API endpoints
 */

import { mobileApiClient } from './api-client';

// ==================== Types ====================

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface DonorProfile {
  id: string;
  user_id: string;
  blood_type: string;
  latitude: number;
  longitude: number;
  is_available: boolean;
  last_donation_date: string | null;
}

export interface BloodRequest {
  id: string;
  patient_name: string;
  department: string;
  blood_type: string;
  units_needed: number;
  donors_confirmed: number;
  procedure: string;
  status: 'pending' | 'active' | 'partially_fulfilled' | 'fulfilled' | 'cancelled';
  required_by: string;
  created_at: string;
  attending_physician: string;
  requested_by: string;
  room: string;
  contact_phone: string;
  notes: string;
}

export interface DonationSchedule {
  id: string;
  donor_id: string;
  request_id: string | null;
  scheduled_date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export interface PreScreenQuestionnaire {
  id: string;
  donor_id: string;
  health_status: string;
  medications: string;
  recent_travel: boolean;
  vaccination_status: string;
  clearance_date: string | null;
  is_cleared: boolean;
}

export interface Invitation {
  id: string;
  donor_id: string;
  request_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  expires_at: string;
}

// ==================== Authentication Service ====================

export const authService = {
  /**
   * Register a new donor
   */
  async register(data: {
    email: string;
    password: string;
    full_name: string;
    phone_number: string;
    blood_type: string;
    latitude: number;
    longitude: number;
  }): Promise<User> {
    const payload = {
      ...data,
      is_donor: true,
    };
    console.log('[authService] Registering with payload:', payload);
    try {
      const result = await mobileApiClient.post<User>('/api/auth/register', payload);
      console.log('[authService] Registration response:', result);
      return result;
    } catch (error: any) {
      console.error('[authService] Registration error:', error.message);
      console.error('[authService] Error details:', error.details);
      throw error;
    }
  },

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    console.log('[authService] Logging in with email:', email);
    try {
      const result = await mobileApiClient.post<LoginResponse>('/api/auth/login', formData);
      console.log('[authService] Login response received');
      return result;
    } catch (error: any) {
      console.error('[authService] Login error:', error.message);
      console.error('[authService] Error details:', error.details);
      throw error;
    }
  },

  /**
   * Get current authenticated user profile
   */
  async me(): Promise<User> {
    return mobileApiClient.get<User>('/api/auth/me');
  },

  /**
   * Store authentication token
   */
  async setToken(token: string): Promise<void> {
    await mobileApiClient.setToken(token);
  },

  /**
   * Get stored token
   */
  async getToken(): Promise<string | null> {
    return mobileApiClient.getToken();
  },

  /**
   * Clear authentication token (logout)
   */
  async logout(): Promise<void> {
    await mobileApiClient.clearToken();
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return mobileApiClient.isAuthenticated();
  },
};

// ==================== Donor Service ====================

export const donorService = {
  /**
   * Get current user's donor profile
   */
  async getProfile(): Promise<DonorProfile> {
    return mobileApiClient.get<DonorProfile>('/api/donations/profile');
  },

  /**
   * Update donor availability status
   */
  async updateAvailability(isAvailable: boolean): Promise<DonorProfile> {
    return mobileApiClient.patch<DonorProfile>('/api/donations/profile/availability', {
      is_available: isAvailable,
    });
  },

  /**
   * Get donor's scheduled appointments
   */
  async getMyAppointments(): Promise<DonationSchedule[]> {
    return mobileApiClient.get<DonationSchedule[]>('/api/donations/my-appointments');
  },

  /**
   * Schedule a new donation appointment
   */
  async scheduleAppointment(data: {
    scheduled_date: string;
    request_id?: string;
    notes?: string;
  }): Promise<DonationSchedule> {
    return mobileApiClient.post<DonationSchedule>('/api/donations/schedule', data);
  },

  /**
   * Get available blood requests nearby
   */
  async getAvailableRequests(): Promise<BloodRequest[]> {
    return mobileApiClient.get<BloodRequest[]>('/api/donations/available-requests');
  },

  /**
   * Respond to an invitation
   */
  async respondToInvitation(invitationId: string, accepted: boolean): Promise<any> {
    return mobileApiClient.post(`/api/donations/invitations/${invitationId}/respond`, {
      accepted,
    });
  },

  /**
   * Get pending invitations
   */
  async getPendingInvitations(): Promise<Invitation[]> {
    return mobileApiClient.get<Invitation[]>('/api/donations/invitations/pending');
  },

  /**
   * Complete pre-screening questionnaire
   */
  async submitPreScreening(data: {
    health_status: string;
    medications: string;
    recent_travel: boolean;
    vaccination_status: string;
  }): Promise<PreScreenQuestionnaire> {
    return mobileApiClient.post<PreScreenQuestionnaire>('/api/donations/pre-screening', data);
  },

  /**
   * Get pre-screening status
   */
  async getPreScreeningStatus(): Promise<PreScreenQuestionnaire | null> {
    return mobileApiClient.get<PreScreenQuestionnaire | null>('/api/donations/pre-screening/status');
  },
};

// ==================== Blood Requests Service ====================

export const requestService = {
  /**
   * Get all active blood requests (public)
   */
  async getActiveRequests(): Promise<BloodRequest[]> {
    return mobileApiClient.get<BloodRequest[]>('/api/requests/active');
  },

  /**
   * Get a specific blood request details
   */
  async getRequestDetails(id: string): Promise<BloodRequest> {
    return mobileApiClient.get<BloodRequest>(`/api/requests/${id}`);
  },

  /**
   * Search blood requests by blood type
   */
  async searchByBloodType(bloodType: string): Promise<BloodRequest[]> {
    return mobileApiClient.get<BloodRequest[]>(`/api/requests/search?blood_type=${bloodType}`);
  },

  /**
   * Get requests within a geographic radius
   */
  async getNearbyRequests(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<BloodRequest[]> {
    const endpoint = `/api/requests/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radiusKm}`;
    return mobileApiClient.get<BloodRequest[]>(endpoint);
  },
};

// ==================== Notifications Service ====================

export const notificationService = {
  /**
   * Get user notifications
   */
  async getNotifications(): Promise<any[]> {
    return mobileApiClient.get<any[]>('/api/notifications');
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await mobileApiClient.patch(`/api/notifications/${notificationId}`, { read: true });
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await mobileApiClient.delete(`/api/notifications/${notificationId}`);
  },
};

// ==================== Location Service ====================

export const locationService = {
  /**
   * Update donor location
   */
  async updateLocation(latitude: number, longitude: number): Promise<any> {
    return mobileApiClient.patch('/api/donations/location', {
      latitude,
      longitude,
    });
  },
};
