import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  bloodType: string;
  isAvailable: boolean;
  lastDonationDate: string | null;
  healthClearanceToken: string | null;
  healthCheckedAt: string | null;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateAvailability: (isAvailable: boolean) => Promise<void>;
  updateHealthClearance: (token: string | null, date: string | null) => void;
  submitPreScreen: (answers: {
    has_recent_tattoo_or_piercing: boolean;
    has_infectious_diseases: boolean;
    is_taking_antibiotics: boolean;
    has_traveled_malaria_zone_recently: boolean;
    is_feeling_unwell: boolean;
  }) => Promise<any>;
  setLoading: (loading: boolean) => void;
}

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (e) {
      console.error('Error writing to SecureStore', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (e) {
      console.error('Error deleting from SecureStore', e);
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
      login: async (email: string, password?: string) => {
        set({ isLoading: true });
        try {
          const params = new URLSearchParams();
          params.append('username', email.toLowerCase());
          params.append('password', password || 'password123');
          
          const loginData = await api.post('/api/auth/login', params);
          // Extract token from unwrapped response
          const token = loginData.access_token;
          await SecureStore.setItemAsync('access_token', token);
          
          // Load profile details
          const profileData = await api.get('/api/donations/profile');
          const meData = await api.get('/api/auth/me');
          
          const user: User = {
            id: profileData.id,
            name: meData.full_name,
            email: meData.email,
            bloodType: profileData.blood_type,
            isAvailable: profileData.is_available,
            lastDonationDate: profileData.last_donation_date || null,
            healthClearanceToken: profileData.health_clearance_token || null,
            healthCheckedAt: profileData.health_checked_at || null,
            location: {
              latitude: profileData.latitude,
              longitude: profileData.longitude,
              address: 'Algiers, Algeria',
            },
          };
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch (error) {
          console.error('Login failed:', error);
          set({ isLoading: false });
          return false;
        }
      },
      logout: async () => {
        set({ isLoading: true });
        try {
          await SecureStore.deleteItemAsync('access_token');
        } catch {}
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
      updateAvailability: async (isAvailable: boolean) => {
        try {
          const res = await api.patch(`/api/donations/profile/availability?is_available=${isAvailable}`);
          set((state) => {
            if (!state.user) return state;
            return {
              user: { ...state.user, isAvailable: res.is_available },
            };
          });
        } catch (error) {
          console.error('Failed to update availability:', error);
        }
      },
      updateHealthClearance: (token: string | null, date: string | null) => {
        set((state) => {
          if (!state.user) return state;
          return {
            user: {
              ...state.user,
              healthClearanceToken: token,
              healthCheckedAt: date,
            },
          };
        });
      },
      submitPreScreen: async (answers: {
        has_recent_tattoo_or_piercing: boolean;
        has_infectious_diseases: boolean;
        is_taking_antibiotics: boolean;
        has_traveled_malaria_zone_recently: boolean;
        is_feeling_unwell: boolean;
      }) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/api/donations/profile/pre-screen', answers);
          set((state) => {
            if (!state.user) return state;
            return {
              user: {
                ...state.user,
                healthClearanceToken: res.health_clearance_token || null,
                healthCheckedAt: res.health_checked_at || null,
                isAvailable: res.is_available,
              },
            };
          });
          set({ isLoading: false });
          return res;
        } catch (error) {
          console.error('Pre-screen submission failed:', error);
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'amal-auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
