import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  isLoading: boolean;
  
  // Actions
  fetchRequests: () => Promise<void>;
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

const initialRequests: BloodRequest[] = [
  {
    id: 'req_001',
    hospitalName: 'Mustapha Pacha University Hospital',
    hospitalAddress: 'Place du 1er Mai, Sidi M\'Hamed, Algiers',
    latitude: 36.7562,
    longitude: 3.0564,
    bloodType: 'O-',
    urgency: 'HIGH',
    patientCondition: 'Emergency Trauma Surgery (Car accident)',
    unitsRequired: 3,
    unitsCollected: 1,
    createdAt: new Date().toISOString(),
    distanceKm: 0.8,
  },
  {
    id: 'req_002',
    hospitalName: 'Nafissa Hamoud Hospital (Parnet)',
    hospitalAddress: 'Hussein Dey, Algiers',
    latitude: 36.7389,
    longitude: 3.0894,
    bloodType: 'O-',
    urgency: 'MEDIUM',
    patientCondition: 'Anemia complications during chemotherapy',
    unitsRequired: 2,
    unitsCollected: 0,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    distanceKm: 3.5,
  },
  {
    id: 'req_003',
    hospitalName: 'Bologhine Hospital',
    hospitalAddress: 'Bologhine, Algiers',
    latitude: 36.8012,
    longitude: 3.0392,
    bloodType: 'O+',
    urgency: 'LOW',
    patientCondition: 'Planned orthopedic surgery',
    unitsRequired: 2,
    unitsCollected: 2,
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    distanceKm: 5.7,
  },
];

const initialInvitations: Invitation[] = [
  {
    id: 'inv_001',
    requestId: 'req_001',
    expiresAt: new Date(Date.now() + 180 * 1000).toISOString(), // 180 seconds TTL
    status: 'PENDING',
    request: initialRequests[0],
  },
];

const initialSchedules: DonationSchedule[] = [
  {
    id: 'sched_old_1',
    hospitalName: 'Mustapha Pacha University Hospital',
    hospitalAddress: 'Place du 1er Mai, Sidi M\'Hamed, Algiers',
    date: '2026-03-15',
    timeSlot: '09:30 AM',
    status: 'COMPLETED',
    unitsDonated: 1,
  },
];

export const useBloodStore = create<BloodState>()(
  persist(
    (set, get) => ({
      requests: initialRequests,
      schedules: initialSchedules,
      invitations: initialInvitations,
      isLoading: false,

      fetchRequests: async () => {
        set({ isLoading: true });
        // Simulating network fetch
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({ isLoading: false });
      },

      respondToInvitation: async (invitationId: string, accept: boolean) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        const invitation = get().invitations.find((i) => i.id === invitationId);
        if (!invitation) {
          set({ isLoading: false });
          return false;
        }

        // Update invitation status
        set((state) => ({
          invitations: state.invitations.map((i) =>
            i.id === invitationId
              ? { ...i, status: accept ? 'ACCEPTED' : 'DECLINED' }
              : i
          ),
        }));

        if (accept) {
          // Add to schedules
          const newSchedule: DonationSchedule = {
            id: `sched_${Date.now()}`,
            hospitalName: invitation.request.hospitalName,
            hospitalAddress: invitation.request.hospitalAddress,
            date: new Date().toISOString().split('T')[0],
            timeSlot: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'SCHEDULED',
          };

          set((state) => ({
            schedules: [newSchedule, ...state.schedules],
            // Update request collection units
            requests: state.requests.map((r) =>
              r.id === invitation.requestId
                ? { ...r, unitsCollected: r.unitsCollected + 1 }
                : r
            ),
          }));
        } else {
          // If declined, simulate cascade: remove request from donor's matches list
          set((state) => ({
            requests: state.requests.filter((r) => r.id !== invitation.requestId),
          }));
        }

        set({ isLoading: false });
        return true;
      },

      scheduleDonation: async (hospitalName: string, hospitalAddress: string, date: string, timeSlot: string) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 800));

        const newSchedule: DonationSchedule = {
          id: `sched_${Date.now()}`,
          hospitalName,
          hospitalAddress,
          date,
          timeSlot,
          status: 'SCHEDULED',
        };

        set((state) => ({
          schedules: [newSchedule, ...state.schedules],
          isLoading: false,
        }));

        return true;
      },

      cancelDonation: async (scheduleId: string) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 600));

        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === scheduleId ? { ...s, status: 'CANCELLED' as const } : s
          ),
          isLoading: false,
        }));

        return true;
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
        // Simulating delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const newRequest: BloodRequest = {
          id: `req_${Date.now()}`,
          hospitalName,
          hospitalAddress,
          latitude,
          longitude,
          bloodType,
          urgency: urgencyLevel,
          patientCondition: 'Emergency Case (Broadcasted)',
          unitsRequired: requiredUnits,
          unitsCollected: 0,
          createdAt: new Date().toISOString(),
          distanceKm: 2.1,
        };

        set((state) => ({
          requests: [newRequest, ...state.requests],
          isLoading: false,
        }));

        return true;
      },

      resetMockData: () => {
        set({
          requests: initialRequests,
          schedules: initialSchedules,
          invitations: initialInvitations,
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
