import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

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
  login: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateAvailability: (isAvailable: boolean) => void;
  updateHealthClearance: (token: string | null, date: string | null) => void;
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
      login: async (email: string) => {
        set({ isLoading: true });
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Mock donor profile matching backend schemas
        const mockUser: User = {
          id: 'donor_123',
          name: 'Sarah Connor',
          email: email.toLowerCase(),
          bloodType: 'O-',
          isAvailable: true,
          lastDonationDate: '2026-03-15',
          healthClearanceToken: null,
          healthCheckedAt: null,
          location: {
            latitude: 36.7538,
            longitude: 3.0588, // Algiers coordinates
            address: 'Didouche Mourad St, Algiers',
          },
        };

        set({
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      },
      logout: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
      updateAvailability: (isAvailable: boolean) => {
        set((state) => {
          if (!state.user) return state;
          return {
            user: { ...state.user, isAvailable },
          };
        });
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
    }),
    {
      name: 'amal-auth-storage',
      storage: createJSONStorage(() => secureStorage),
      // Prevent automatic hydration from blocking if not ready, or handle explicitly
    }
  )
);
