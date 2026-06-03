import { useAuthStore } from '@/stores/auth';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const updateAvailability = useAuthStore((state) => state.updateAvailability);
  const updateHealthClearance = useAuthStore((state) => state.updateHealthClearance);
  const submitPreScreen = useAuthStore((state) => state.submitPreScreen);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateAvailability,
    updateHealthClearance,
    submitPreScreen,
  };
}
