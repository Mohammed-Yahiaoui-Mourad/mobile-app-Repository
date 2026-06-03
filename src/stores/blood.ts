import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';

export interface BloodRequest {
  id: string;
  hospitalName: string;
  hospitalAddress: string;
  latitude: number;
  longitude: number;
  bloodType: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  patientCondition: string;
  unitsRequired: number;
  unitsCollected: number;
  createdAt: string;
  distanceKm: number;
}

export interface DonationSchedule {
  id: string;
  hospitalName: string;
  hospitalAddress: string;
  date: string;
  timeSlot: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  unitsDonated?: number;
}

export interface Invitation {
  id: string;
  requestId: string;
  expiresAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  request: BloodRequest;
}

interface BloodState {
  requests: BloodRequest[];
  schedules: DonationSchedule[];
  invitations: Invitation[];
  myRequests: BloodRequest[];
  isLoading: boolean;
  
  // Actions
  fetchRequests: () => Promise<void>;
  fetchMyRequests: () => Promise<void>;
  respondToInvitation: (invitationId: string, accept: boolean) => Promise<boolean>;
  scheduleDonation: (hospitalName: string, hospitalAddress: string, date: string, timeSlot: string) => Promise<boolean>;
  cancelDonation: (scheduleId: string) => Promise<boolean>;
  createBloodRequest: (
    recipientName: string,
    bloodType: string,
    requiredUnits: number,
    hospitalName: string,
    hospitalAddress: string,
    latitude: number,
    longitude: number,
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  ) => Promise<boolean>;
  resetMockData: () => void;
}

const initialRequests: BloodRequest[] = [];
const initialInvitations: Invitation[] = [];
const initialSchedules: DonationSchedule[] = [];
const initialMyRequests: BloodRequest[] = [];

export const useBloodStore = create<BloodState>()(
  persist(
    (set, get) => ({
      requests: initialRequests,
      schedules: initialSchedules,
      invitations: initialInvitations,
      myRequests: initialMyRequests,
      isLoading: false,

      fetchRequests: async () => {
        set({ isLoading: true });
        try {
          const invitations = await api.get('/api/donations/invitations');
          const schedules = await api.get('/api/donations/my-appointments');
          
          // Construct unique list of requests from active invitations
          const requests = invitations.map((inv: any) => inv.request);
          
          set({
            invitations,
            schedules,
            requests,
            isLoading: false,
          });

          // Also pull requests created by this user
          await get().fetchMyRequests();

          // Establish a real-time SSE stream connection
          const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';
          if (typeof EventSource !== 'undefined' && !(globalThis as any).bloodSseConnected) {
            try {
              const es = new EventSource(`${BACKEND_URL}/api/requests/stream`);
              es.onmessage = (event) => {
                try {
                  const payload = JSON.parse(event.data);
                  if (payload.event === 'request_created') {
                    get().fetchRequests();
                  }
                } catch (e) {}
              };
              (globalThis as any).bloodSseConnected = true;
            } catch (e) {
              console.warn('SSE EventSource initialization failed:', e);
            }
          }
        } catch (error) {
          console.error('Failed to fetch requests and schedules:', error);
          set({ isLoading: false });
        }
      },

      fetchMyRequests: async () => {
        try {
          const rawMyRequests = await api.get('/api/requests/my-requests');
          const mapped: BloodRequest[] = Array.isArray(rawMyRequests)
            ? rawMyRequests.map((req: any) => ({
                id: req.id,
                hospitalName: req.hospital_name,
                hospitalAddress: req.hospital_name,
                latitude: req.hospital_latitude,
                longitude: req.hospital_longitude,
                bloodType: req.blood_type,
                urgency: req.urgency_level.toUpperCase() as any,
                patientCondition: `Emergency Case (Broadcasted)`,
                unitsRequired: req.required_units,
                unitsCollected: 0,
                createdAt: req.created_at,
                distanceKm: 0,
              }))
            : [];
          set({ myRequests: mapped });
        } catch (error) {
          console.error('Failed to fetch my requests:', error);
        }
      },

      respondToInvitation: async (invitationId: string, accept: boolean) => {
        set({ isLoading: true });
        try {
          await api.post(`/api/donations/invitations/${invitationId}/respond`, { accepted: accept });
          
          const invitations = await api.get('/api/donations/invitations');
          const schedules = await api.get('/api/donations/my-appointments');
          const requests = invitations.map((inv: any) => inv.request);
          
          set({
            invitations,
            schedules,
            requests,
            isLoading: false,
          });
          return true;
        } catch (error) {
          console.error('Failed to respond to invitation:', error);
          set({ isLoading: false });
          return false;
        }
      },

      scheduleDonation: async (hospitalName: string, hospitalAddress: string, date: string, timeSlot: string) => {
        set({ isLoading: true });
        try {
          const parsedTime = new Date(`${date} ${timeSlot}`).toISOString();
          await api.post('/api/donations/schedule', {
            request_id: null,
            scheduled_time: parsedTime,
          });
          
          const schedules = await api.get('/api/donations/my-appointments');
          set({ schedules, isLoading: false });
          return true;
        } catch (error) {
          console.error('Failed to schedule donation:', error);
          set({ isLoading: false });
          return false;
        }
      },

      cancelDonation: async (scheduleId: string) => {
        set({ isLoading: true });
        try {
          await api.patch(`/api/donations/appointments/${scheduleId}/cancel`);
          const schedules = await api.get('/api/donations/my-appointments');
          set({ schedules, isLoading: false });
          return true;
        } catch (error) {
          console.error('Failed to cancel donation:', error);
          set({ isLoading: false });
          return false;
        }
      },

      createBloodRequest: async (
        recipientName: string,
        bloodType: string,
        requiredUnits: number,
        hospitalName: string,
        hospitalAddress: string,
        latitude: number,
        longitude: number,
        urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH'
      ) => {
        set({ isLoading: true });
        try {
          const neededBy = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          await api.post('/api/requests/create', {
            recipient_name: recipientName,
            blood_type: bloodType,
            required_units: requiredUnits,
            hospital_name: hospitalName,
            hospital_latitude: latitude,
            hospital_longitude: longitude,
            urgency_level: urgencyLevel.toLowerCase(),
            needed_by: neededBy,
          });
          
          await get().fetchRequests();
          return true;
        } catch (error) {
          console.error('Failed to create blood request:', error);
          set({ isLoading: false });
          return false;
        }
      },

      resetMockData: () => {
        set({
          requests: [],
          schedules: [],
          invitations: [],
          myRequests: [],
          isLoading: false,
        });
      },
    }),
    {
      name: 'amal-blood-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
