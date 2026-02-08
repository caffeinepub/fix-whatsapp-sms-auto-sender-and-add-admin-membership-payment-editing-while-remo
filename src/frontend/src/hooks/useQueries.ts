import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import {
  UserProfile,
  UserRole,
  MemberProfile,
  Payment,
  Expense,
  ClassBooking,
  AttendanceRecord,
  WorkoutPlan,
  DietPlan,
  MembershipPlan,
  BookingStatus,
  MembershipStatus,
  ReportSummary,
  RegisteredMemberInfo,
  ManualCreateMemberRequest,
  ManualCreateMemberResponse,
  SerializeMemberProfile,
  Notification,
} from '../backend';
import { Principal } from '@dfinity/principal';

// Helper function to convert SerializeMemberProfile to MemberProfile
function deserializeMemberProfile(serialized: SerializeMemberProfile): MemberProfile {
  return {
    id: BigInt(serialized.id),
    principal: Principal.fromText(serialized.principal),
    name: serialized.name,
    email: serialized.email,
    phone: serialized.phone,
    membershipStatus: serialized.membershipStatus,
    startDate: BigInt(serialized.startDate),
    endDate: BigInt(serialized.endDate),
    workoutPlan: serialized.workoutPlan,
    dietPlan: serialized.dietPlan,
    membershipPlan: serialized.membershipPlan,
    profilePic: serialized.profilePic,
  };
}

// Helper function to serialize MemberProfile for storage
function serializeMemberProfileForStorage(profile: MemberProfile): any {
  return {
    id: profile.id.toString(),
    principal: profile.principal.toString(),
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    membershipStatus: profile.membershipStatus,
    startDate: profile.startDate.toString(),
    endDate: profile.endDate.toString(),
    membershipPlan: profile.membershipPlan,
    workoutPlan: profile.workoutPlan,
    dietPlan: profile.dietPlan,
    profilePic: profile.profilePic,
  };
}

// Helper to check if user is email/password authenticated member
function isEmailPasswordMember(): boolean {
  const memberAuth = sessionStorage.getItem('memberAuth');
  if (!memberAuth) return false;
  try {
    const authData = JSON.parse(memberAuth);
    return authData.authenticated === true;
  } catch {
    return false;
  }
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['userRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserRole() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserRole(target);
    },
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRole'] });
    },
  });
}

// Member Login Query
export function useMemberLogin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend returns SerializeMemberProfile with BigInt values as Text
      const serializedProfile = await actor.memberLogin(email, password);
      // Convert back to MemberProfile with proper BigInt types
      const memberProfile = deserializeMemberProfile(serializedProfile);
      return memberProfile;
    },
    onSuccess: (memberProfile) => {
      // Store the member profile in multiple cache keys for redundancy
      queryClient.setQueryData(['authenticatedMember'], memberProfile);
      queryClient.setQueryData(['memberProfile'], memberProfile);
      queryClient.setQueryData(['memberProfileById', memberProfile.id.toString()], memberProfile);
      
      // Store authentication state in sessionStorage for persistence across reloads
      sessionStorage.setItem('memberAuth', JSON.stringify({
        email: memberProfile.email,
        memberId: memberProfile.id.toString(),
        authenticated: true,
      }));
      
      // Store the full profile in sessionStorage as backup (with BigInt converted to strings)
      sessionStorage.setItem('memberProfileCache', JSON.stringify(serializeMemberProfileForStorage(memberProfile)));
    },
  });
}

// Member Queries
export function useGetAllMembers() {
  const { actor, isFetching } = useActor();

  return useQuery<MemberProfile[]>({
    queryKey: ['members'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMembers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateMemberWithManualCredentials() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ManualCreateMemberRequest) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addMemberWithManualCredentials(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useAddMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (member: MemberProfile) => {
      if (!actor) throw new Error('Actor not available');
      // First create the minimal member to get the unique ID
      const memberId = await actor.addMember(member.name);
      // Then update with the full profile using the generated ID
      const fullMember: MemberProfile = {
        ...member,
        id: memberId,
      };
      await actor.updateMember(memberId, fullMember);
      return memberId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdateMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, member }: { id: bigint; member: MemberProfile }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMember(id, member);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['memberProfile'] });
      queryClient.invalidateQueries({ queryKey: ['authenticatedMember'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMember(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

// Membership Plan Queries
export function useGetAllMembershipPlans() {
  const { actor, isFetching } = useActor();

  return useQuery<MembershipPlan[]>({
    queryKey: ['membershipPlans'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMembershipPlans();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMembershipPlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: MembershipPlan) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addMembershipPlan(plan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipPlans'] });
    },
  });
}

export function useUpdateMembershipPlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: MembershipPlan) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMembershipPlan(plan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipPlans'] });
    },
  });
}

export function useDeleteMembershipPlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMembershipPlan(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipPlans'] });
    },
  });
}

// Workout and Diet Plan Queries (Admin can manage these for members)
export function useUpdateMemberWorkoutPlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, plan }: { memberId: bigint; plan: WorkoutPlan }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMemberWorkoutPlan(memberId, plan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['memberProfile'] });
      queryClient.invalidateQueries({ queryKey: ['authenticatedMember'] });
    },
  });
}

export function useUpdateMemberDietPlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, plan }: { memberId: bigint; plan: DietPlan }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMemberDietPlan(memberId, plan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['memberProfile'] });
      queryClient.invalidateQueries({ queryKey: ['authenticatedMember'] });
    },
  });
}

// Payment Queries
export function useGetAllPayments() {
  const { actor, isFetching } = useActor();

  return useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPayments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMemberPayments() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<Payment[]>({
    queryKey: ['memberPayments'],
    queryFn: async () => {
      if (!actor) return [];
      
      // For email/password members, filter from cached member profile
      if (isEmailPasswordMember()) {
        const memberProfile = queryClient.getQueryData<MemberProfile>(['authenticatedMember']);
        if (!memberProfile) return [];
        
        // Get all payments and filter by member principal
        const allPayments = await actor.getAllPayments();
        return allPayments.filter(p => p.memberId.toString() === memberProfile.principal.toString());
      }
      
      // For Internet Identity users, use the backend method
      return actor.getMemberPayments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: Payment) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addPayment(payment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['memberPayments'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['memberNotifications'] });
    },
  });
}

// Expense Queries
export function useGetAllExpenses() {
  const { actor, isFetching } = useActor();

  return useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllExpenses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Expense) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addExpense(expense);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

// Class Booking Queries
export function useGetMemberClassBookings() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<ClassBooking[]>({
    queryKey: ['memberClassBookings'],
    queryFn: async () => {
      if (!actor) return [];
      
      // For email/password members, return empty array (they can't book classes via backend)
      if (isEmailPasswordMember()) {
        return [];
      }
      
      // For Internet Identity users, use the backend method
      return actor.getMemberClassBookings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddClassBooking() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: ClassBooking) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addClassBooking(booking);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberClassBookings'] });
    },
  });
}

export function useUpdateClassBooking() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, booking }: { id: string; booking: ClassBooking }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateClassBooking(id, booking);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberClassBookings'] });
    },
  });
}

// Attendance Queries
export function useGetMemberAttendance() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<AttendanceRecord[]>({
    queryKey: ['memberAttendance'],
    queryFn: async () => {
      if (!actor) return [];
      
      // For email/password members, return empty array (they can't access attendance via backend)
      if (isEmailPasswordMember()) {
        return [];
      }
      
      // For Internet Identity users, use the backend method
      return actor.getMemberAttendance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCheckIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.checkIn();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberAttendance'] });
    },
  });
}

export function useCheckOut() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.checkOut();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberAttendance'] });
    },
  });
}

// Member Profile Queries - uses cached data for email/password authenticated members
export function useGetMemberProfile() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<MemberProfile | null>({
    queryKey: ['memberProfile'],
    queryFn: async () => {
      // First check if we have a cached authenticated member profile (from email/password login)
      const cachedMember = queryClient.getQueryData<MemberProfile>(['authenticatedMember']);
      if (cachedMember) {
        return cachedMember;
      }
      
      // Check sessionStorage for persisted profile data
      const storedProfileCache = sessionStorage.getItem('memberProfileCache');
      if (storedProfileCache) {
        try {
          const profileData = JSON.parse(storedProfileCache);
          // Reconstruct the MemberProfile object with proper types
          const reconstructedProfile: MemberProfile = {
            id: BigInt(profileData.id),
            principal: Principal.fromText(profileData.principal),
            name: profileData.name,
            email: profileData.email,
            phone: profileData.phone,
            membershipStatus: profileData.membershipStatus,
            startDate: BigInt(profileData.startDate),
            endDate: BigInt(profileData.endDate),
            membershipPlan: profileData.membershipPlan,
            workoutPlan: profileData.workoutPlan,
            dietPlan: profileData.dietPlan,
            profilePic: profileData.profilePic,
          };
          // Cache it in React Query for future use
          queryClient.setQueryData(['authenticatedMember'], reconstructedProfile);
          return reconstructedProfile;
        } catch (error) {
          console.error('Failed to parse cached member profile:', error);
          sessionStorage.removeItem('memberProfileCache');
        }
      }
      
      // Otherwise try to fetch from backend (for Internet Identity authenticated users)
      if (!actor) return null;
      return actor.getMemberProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

// Member Notifications Query - uses cached profile for email/password members
export function useGetMemberNotifications() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<Notification[]>({
    queryKey: ['memberNotifications'],
    queryFn: async () => {
      if (!actor) return [];
      
      // For email/password members, generate notifications client-side from cached profile
      if (isEmailPasswordMember()) {
        const memberProfile = queryClient.getQueryData<MemberProfile>(['authenticatedMember']);
        if (!memberProfile) return [];
        
        // Generate notifications client-side (similar to backend logic)
        const notifications: Notification[] = [];
        const now = Date.now() * 1000000; // Convert to nanoseconds
        const weekNanos = 7 * 24 * 60 * 60 * 1000000000;
        
        const endDate = Number(memberProfile.endDate);
        
        // Membership expiring soon
        if (endDate > now && endDate < (now + weekNanos)) {
          notifications.push({
            title: 'Membership Expiring Soon',
            message: `Your membership will expire soon: ${new Date(Number(memberProfile.endDate) / 1000000).toLocaleDateString()}`,
            icon: '⚠️',
            color: '#FFD700',
            priority: BigInt(2),
            actions: [['Renew Now', '/renew']],
            timestamp: BigInt(now),
          });
        }
        
        // Membership expired
        if (now > endDate) {
          notifications.push({
            title: 'Membership Expired',
            message: `Your membership expired: ${new Date(Number(memberProfile.endDate) / 1000000).toLocaleDateString()}`,
            icon: '⌛️',
            color: '#FF6347',
            priority: BigInt(1),
            actions: [['Renew Now', '/renew']],
            timestamp: BigInt(now),
          });
        }
        
        // Payment due notification (simplified - assumes no payments made)
        const memberPlanCost = Number(memberProfile.membershipPlan.price);
        if (memberPlanCost > 0) {
          notifications.push({
            title: 'Payment Due',
            message: `You have an outstanding payment of ₹${memberPlanCost}`,
            icon: '💰',
            color: '#FF6347',
            priority: BigInt(0),
            actions: [['Pay Now', '/pay']],
            timestamp: BigInt(now),
          });
        }
        
        return notifications;
      }
      
      // For Internet Identity users, use the backend method
      return actor.getMemberNotifications();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 60000, // Refetch every minute to keep notifications up to date
  });
}

// QR Code Queries
export function useGenerateQrCode() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (memberId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateQrCode(memberId);
    },
  });
}

export function useGetMyQrCode() {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['myQrCode'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyQrCode();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useValidateQrCode() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (qr: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.validateQrCode(qr);
    },
  });
}

// Reports Query
export function useGetReports() {
  const { actor, isFetching } = useActor();

  return useQuery<ReportSummary>({
    queryKey: ['reports'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getReports();
    },
    enabled: !!actor && !isFetching,
  });
}

// Registered Members Query
export function useGetRegisteredMembers() {
  const { actor, isFetching } = useActor();

  return useQuery<RegisteredMemberInfo[]>({
    queryKey: ['registeredMembers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRegisteredMembers();
    },
    enabled: !!actor && !isFetching,
  });
}

// Communication Logs Query
export function useGetCommunicationLogsByEmail() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCommunicationLogsByEmail(email);
    },
  });
}
