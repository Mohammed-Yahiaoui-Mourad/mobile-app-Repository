import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { authService, donorService } from '../services/api-service';
import type { User as ApiUser, DonorProfile } from '../services/api-service';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  role: string;
  created_at: string;
}

export interface MobileAuthUser extends User {
  donor_profile?: DonorProfile;
}

interface AuthState {
  user: MobileAuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    phone_number: string;
    blood_type: string;
    latitude: number;
    longitude: number;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateAvailability: (isAvailable: boolean) => Promise<void>;
  initializeAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
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
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // Call backend login
          const response = await authService.login(email, password);
          
          // Store token
          await authService.setToken(response.access_token);
          
          // Fetch user profile
          const profile = await donorService.getProfile();
          
          // Build user object
          const user: MobileAuthUser = {
            id: profile.user_id,
            email: email,
            full_name: email.split('@')[0],
            phone_number: '',
            role: 'user',
            created_at: new Date().toISOString(),
            donor_profile: profile,
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch (error: any) {
          const errorMessage = error.message || 'Login failed';
          set({ 
            error: errorMessage, 
            isLoading: false,
            isAuthenticated: false 
          });
          return false;
        }
      },

      register: async (data) => {
        try {
          set({ isLoading: true, error: null });
          
          const newUser = await authService.register(data);
          
          // Auto-login after registration
          return await get().login(data.email, data.password);
        } catch (error: any) {
          const errorMessage = error.message || 'Registration failed';
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await authService.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('Logout error:', error);
          // Still clear local state even if logout fails
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateAvailability: async (isAvailable: boolean) => {
        try {
          set({ isLoading: true, error: null });
          const updatedProfile = await donorService.updateAvailability(isAvailable);
          
          set((state) => {
            if (!state.user) return state;
            return {
              user: {
                ...state.user,
                donor_profile: updatedProfile,
              },
              isLoading: false,
            };
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to update availability',
            isLoading: false 
          });
        }
      },

      initializeAuth: async () => {
        try {
          set({ isLoading: true });
          const isAuth = await authService.isAuthenticated();
          
          if (isAuth) {
            const profile = await donorService.getProfile();
            const token = await authService.getToken();
            
            if (token && profile) {
              const user: MobileAuthUser = {
                id: profile.user_id,
                email: 'user@email.com', // Would need to fetch from token decode or /me endpoint
                full_name: 'User',
                phone_number: '',
                role: 'user',
                created_at: new Date().toISOString(),
                donor_profile: profile,
              };
              
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            }
          }
          
          set({ isAuthenticated: false, isLoading: false });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ isAuthenticated: false, isLoading: false });
        }
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
