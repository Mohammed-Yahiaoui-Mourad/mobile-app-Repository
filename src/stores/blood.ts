import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestService, donorService } from '../services/api-service';
import type { BloodRequest as ApiBloodRequest, DonationSchedule as ApiDonationSchedule, Invitation as ApiInvitation } from '../services/api-service';

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

export interface Invitation {
  id: string;
  donor_id: string;
  request_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  expires_at: string;
}

interface BloodState {
  requests: BloodRequest[];
  mySchedules: DonationSchedule[];
  myInvitations: Invitation[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchActiveRequests: () => Promise<void>;
  fetchNearbyRequests: (latitude: number, longitude: number, radiusKm?: number) => Promise<void>;
  fetchMySchedules: () => Promise<void>;
  fetchMyInvitations: () => Promise<void>;
  respondToInvitation: (invitationId: string, accepted: boolean) => Promise<boolean>;
  scheduleAppointment: (data: { scheduled_date: string; request_id?: string; notes?: string }) => Promise<boolean>;
  cancelAppointment: (scheduleId: string) => Promise<boolean>;
  searchByBloodType: (bloodType: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useBloodStore = create<BloodState>()(
  persist(
    (set, get) => ({
      requests: [],
      mySchedules: [],
      myInvitations: [],
      isLoading: false,
      error: null,
      setError: (error) => set({ error }),

      fetchActiveRequests: async () => {
        try {
          set({ isLoading: true, error: null });
          const requests = await requestService.getActiveRequests();
          set({ requests, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch requests',
            isLoading: false 
          });
        }
      },

      fetchNearbyRequests: async (latitude: number, longitude: number, radiusKm = 50) => {
        try {
          set({ isLoading: true, error: null });
          const requests = await requestService.getNearbyRequests(latitude, longitude, radiusKm);
          set({ requests, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch nearby requests',
            isLoading: false 
          });
        }
      },

      fetchMySchedules: async () => {
        try {
          set({ isLoading: true, error: null });
          const schedules = await donorService.getMyAppointments();
          set({ mySchedules: schedules, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch schedules',
            isLoading: false 
          });
        }
      },

      fetchMyInvitations: async () => {
        try {
          set({ isLoading: true, error: null });
          const invitations = await donorService.getPendingInvitations();
          set({ myInvitations: invitations, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch invitations',
            isLoading: false 
          });
        }
      },

      respondToInvitation: async (invitationId: string, accepted: boolean) => {
        try {
          set({ isLoading: true, error: null });
          await donorService.respondToInvitation(invitationId, accepted);
          
          // Update local invitations
          set((state) => ({
            myInvitations: state.myInvitations.map((i) =>
              i.id === invitationId
                ? { ...i, status: accepted ? 'accepted' : 'rejected' }
                : i
            ),
            isLoading: false,
          }));
          return true;
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to respond to invitation',
            isLoading: false 
          });
          return false;
        }
      },

      scheduleAppointment: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const schedule = await donorService.scheduleAppointment(data);
          
          // Add to local schedules
          set((state) => ({
            mySchedules: [schedule, ...state.mySchedules],
            isLoading: false,
          }));
          return true;
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to schedule appointment',
            isLoading: false 
          });
          return false;
        }
      },

      cancelAppointment: async (scheduleId: string) => {
        try {
          set({ isLoading: true, error: null });
          // Assuming backend has a cancel endpoint
          set((state) => ({
            mySchedules: state.mySchedules.map((s) =>
              s.id === scheduleId ? { ...s, status: 'cancelled' } : s
            ),
            isLoading: false,
          }));
          return true;
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to cancel appointment',
            isLoading: false 
          });
          return false;
        }
      },

      searchByBloodType: async (bloodType: string) => {
        try {
          set({ isLoading: true, error: null });
          const requests = await requestService.searchByBloodType(bloodType);
          set({ requests, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Search failed',
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'amal-blood-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
