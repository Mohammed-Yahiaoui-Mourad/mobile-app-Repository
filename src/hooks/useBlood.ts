import { useBloodStore } from '@/stores/blood';
import { useAuthStore } from '@/stores/auth';

export function useBlood() {
  const requests = useBloodStore((state) => state.requests);
  const mySchedules = useBloodStore((state) => state.mySchedules);
  const myInvitations = useBloodStore((state) => state.myInvitations);
  const isLoading = useBloodStore((state) => state.isLoading);
  const error = useBloodStore((state) => state.error);
  
  const fetchActiveRequests = useBloodStore((state) => state.fetchActiveRequests);
  const fetchNearbyRequests = useBloodStore((state) => state.fetchNearbyRequests);
  const fetchMySchedules = useBloodStore((state) => state.fetchMySchedules);
  const fetchMyInvitations = useBloodStore((state) => state.fetchMyInvitations);
  const respondToInvitation = useBloodStore((state) => state.respondToInvitation);
  const scheduleAppointment = useBloodStore((state) => state.scheduleAppointment);
  const cancelAppointment = useBloodStore((state) => state.cancelAppointment);
  const searchByBloodType = useBloodStore((state) => state.searchByBloodType);

  const donorUser = useAuthStore((state) => state.user);

  // Filter requests matching the user's blood type
  // O- is universal donor, but in our system we check exact matches or O- compatibility
  const compatibleRequests = requests.filter((req) => {
    // If no user, show all
    if (!donorUser?.donor_profile) return true;
    
    const donorBloodType = donorUser.donor_profile.blood_type;
    
    // Check blood type compatibility
    if (donorBloodType === 'O-') {
      // O- is universal donor, matches all requests
      return true;
    }
    
    return req.blood_type === donorBloodType;
  });

  const pendingInvitations = myInvitations.filter((inv) => inv.status === 'pending');

  return {
    requests: compatibleRequests,
    allRequests: requests,
    mySchedules,
    myInvitations: pendingInvitations,
    allInvitations: myInvitations,
    isLoading,
    error,
    fetchActiveRequests,
    fetchNearbyRequests,
    fetchMySchedules,
    fetchMyInvitations,
    respondToInvitation,
    scheduleAppointment,
    cancelAppointment,
    searchByBloodType,
  };
}
