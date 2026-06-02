import { useBloodStore } from '@/stores/blood';
import { useAuthStore } from '@/stores/auth';

export function useBlood() {
  const requests = useBloodStore((state) => state.requests);
  const schedules = useBloodStore((state) => state.schedules);
  const invitations = useBloodStore((state) => state.invitations);
  const isLoading = useBloodStore((state) => state.isLoading);
  
  const fetchRequests = useBloodStore((state) => state.fetchRequests);
  const respondToInvitation = useBloodStore((state) => state.respondToInvitation);
  const scheduleDonation = useBloodStore((state) => state.scheduleDonation);
  const cancelDonation = useBloodStore((state) => state.cancelDonation);
  const resetMockData = useBloodStore((state) => state.resetMockData);

  const donorUser = useAuthStore((state) => state.user);

  // Filter requests matching the user's blood type (O- matches O- requests)
  // O- is universal donor, but in mock we'll match specific compatible ones
  const compatibleRequests = requests.filter((req) => {
    // If no user, show all
    if (!donorUser) return true;
    
    // Check if donor is O- (universal donor) or match exactly
    if (donorUser.bloodType === 'O-') {
      // O- is universal donor, matches all requests.
      return true;
    }
    
    return req.bloodType === donorUser.bloodType;
  });

  const pendingInvitations = invitations.filter((inv) => inv.status === 'PENDING');

  return {
    requests: compatibleRequests,
    allRequests: requests,
    schedules,
    invitations: pendingInvitations,
    allInvitations: invitations,
    isLoading,
    fetchRequests,
    respondToInvitation,
    scheduleDonation,
    cancelDonation,
    resetMockData,
  };
}
