import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '../lib/secure-storage';
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
  isAvailable?: boolean;
  healthClearanceToken?: string | null;
  healthCheckedAt?: string | null;
  name?: string;
  bloodType?: string;
}

interface AuthState {
  user: MobileAuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAvailabilityLoading: boolean;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isAvailabilityLoading: false,
      error: null,
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          console.log('[Login] Attempting login for:', email);
          
          // Call backend login
          const response = await authService.login(email, password);
          
          console.log('[Login] Login successful, storing token');
          
          // Store token
          await authService.setToken(response.access_token);

          // Fetch current user and donor profile
          const [userProfile, donorProfile] = await Promise.all([
            authService.me(),
            donorService.getProfile(),
          ]);

          console.log('[Login] Got donor profile:', donorProfile);

          // Build authenticated user object from backend profile
          const user: MobileAuthUser = {
            ...userProfile,
            donor_profile: donorProfile,
            isAvailable: donorProfile.is_available,
            name: userProfile.full_name,
            bloodType: donorProfile.blood_type,
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch (error: any) {
          console.error('[Login] Error:', error);
          console.error('[Login] Error details:', error.details);
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
          
          console.log('[Register] Sending registration data:', {
            email: data.email,
            full_name: data.full_name,
            phone_number: data.phone_number,
            blood_type: data.blood_type,
            location: { lat: data.latitude, lon: data.longitude },
          });
          
          const newUser = await authService.register(data);
          
          console.log('[Register] Registration successful, attempting auto-login');
          
          // Auto-login after registration
          return await get().login(data.email, data.password);
        } catch (error: any) {
          console.error('[Register] Error:', error);
          console.error('[Register] Error details:', error.details);
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
          set({ isAvailabilityLoading: true, error: null });
          const updatedProfile = await donorService.updateAvailability(isAvailable);
          
          set((state) => {
            if (!state.user) return state;
            return {
              user: {
                ...state.user,
                donor_profile: updatedProfile,
                isAvailable: updatedProfile.is_available,
              },
              isAvailabilityLoading: false,
            };
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to update availability',
            isAvailabilityLoading: false,
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
              const userProfile = await authService.me();
              const user: MobileAuthUser = {
                ...userProfile,
                donor_profile: profile,
                isAvailable: profile.is_available,
                name: userProfile.full_name,
                bloodType: profile.is_available ? profile.blood_type : profile.blood_type,
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
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.error = null;
        }
      },
    }
  )
);
