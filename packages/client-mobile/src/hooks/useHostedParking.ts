import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@park-angel/shared/lib/supabase';
import { SupabaseHostedParkingService } from '@park-angel/shared/services/hosted-parking';
import type {
  HostProfile,
  HostedListing,
  HostEarnings,
  HostAnalytics,
  HostPayout,
  HostGuestConversation,
  HostGuestMessage,
  HostOnboardingData,
  CreateHostedListingData,
  UpdateHostedListingData,
} from '@park-angel/shared/types';

const hostedParkingService = new SupabaseHostedParkingService(supabase);

export function useHostProfile(hostId?: string) {
  return useQuery({
    queryKey: ['hostProfile', hostId],
    queryFn: () => hostId ? hostedParkingService.getHostProfile(hostId) : null,
    enabled: !!hostId,
  });
}

export function useCreateHostProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: HostOnboardingData) => hostedParkingService.createHostProfile(data),
    onSuccess: (newProfile) => {
      queryClient.setQueryData(['hostProfile', newProfile.id], newProfile);
      queryClient.invalidateQueries({ queryKey: ['hostProfile'] });
    },
  });
}

export function useUpdateHostProfile(hostId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<HostProfile>) => 
      hostedParkingService.updateHostProfile(hostId, data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['hostProfile', hostId], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['hostProfile'] });
    },
  });
}

export function useHostListings(hostId?: string) {
  return useQuery({
    queryKey: ['hostListings', hostId],
    queryFn: () => hostId ? hostedParkingService.getHostListings(hostId) : [],
    enabled: !!hostId,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateHostedListingData) => hostedParkingService.createListing(data),
    onSuccess: (newListing) => {
      queryClient.invalidateQueries({ queryKey: ['hostListings'] });
      queryClient.setQueryData(['listing', newListing.id], newListing);
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateHostedListingData) => hostedParkingService.updateListing(data),
    onSuccess: (updatedListing) => {
      queryClient.invalidateQueries({ queryKey: ['hostListings'] });
      queryClient.setQueryData(['listing', updatedListing.id], updatedListing);
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (listingId: string) => hostedParkingService.deleteListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostListings'] });
    },
  });
}

export function useToggleListingStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ listingId, isActive }: { listingId: string; isActive: boolean }) =>
      hostedParkingService.toggleListingStatus(listingId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostListings'] });
    },
  });
}

export function useHostEarnings(hostId?: string) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);
  return useQuery({
    queryKey: ['hostEarnings', hostId, startDate, endDate],
    queryFn: () => hostId ? hostedParkingService.getHostEarnings(hostId, startDate, endDate) : null,
    enabled: !!hostId,
  });
}

export function useHostAnalytics(hostId?: string, startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['hostAnalytics', hostId, startDate, endDate],
    queryFn: () => 
      hostId && startDate && endDate 
        ? hostedParkingService.getHostAnalytics(hostId, startDate, endDate)
        : null,
    enabled: !!(hostId && startDate && endDate),
  });
}

export function useHostPayouts(hostId?: string, limit?: number) {
  return useQuery({
    queryKey: ['hostPayouts', hostId, limit],
    queryFn: () => hostId ? hostedParkingService.getHostPayouts(hostId, limit) : [],
    enabled: !!hostId,
  });
}

export function useHostConversations(hostId?: string) {
  return useQuery({
    queryKey: ['hostConversations', hostId],
    queryFn: () => hostId ? hostedParkingService.getHostConversations(hostId) : [],
    enabled: !!hostId,
  });
}

export function useConversationMessages(conversationId?: string) {
  return useQuery({
    queryKey: ['conversationMessages', conversationId],
    queryFn: () => 
      conversationId ? hostedParkingService.getConversationMessages(conversationId) : [],
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      conversationId, 
      senderId, 
      content, 
      type 
    }: { 
      conversationId: string; 
      senderId: string; 
      content: string; 
      type?: string; 
    }) => hostedParkingService.sendMessage(conversationId, senderId, content, type),
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ 
        queryKey: ['conversationMessages', newMessage.conversationId] 
      });
      queryClient.invalidateQueries({ queryKey: ['hostConversations'] });
    },
  });
}

export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      hostedParkingService.markMessagesAsRead(conversationId, userId),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['conversationMessages', conversationId] 
      });
      queryClient.invalidateQueries({ queryKey: ['hostConversations'] });
    },
  });
}

// Custom hook for comprehensive host data
export function useHostData(hostId?: string) {
  const profileQuery = useHostProfile(hostId);
  const listingsQuery = useHostListings(hostId);
  const earningsQuery = useHostEarnings(hostId);
  const payoutsQuery = useHostPayouts(hostId);
  const conversationsQuery = useHostConversations(hostId);
  
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
  const endDate = new Date();
  
  const analyticsQuery = useHostAnalytics(hostId, startDate, endDate);

  return {
    profile: profileQuery.data,
    listings: listingsQuery.data || [],
    earnings: earningsQuery.data,
    analytics: analyticsQuery.data,
    payouts: payoutsQuery.data || [],
    conversations: conversationsQuery.data || [],
    isLoading: 
      profileQuery.isLoading || 
      listingsQuery.isLoading || 
      earningsQuery.isLoading || 
      analyticsQuery.isLoading,
    error: 
      profileQuery.error || 
      listingsQuery.error || 
      earningsQuery.error || 
      analyticsQuery.error,
    refetch: () => {
      profileQuery.refetch();
      listingsQuery.refetch();
      earningsQuery.refetch();
      analyticsQuery.refetch();
      payoutsQuery.refetch();
      conversationsQuery.refetch();
    },
  };
}

// Hook for host onboarding flow
export function useHostOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  
  const createProfileMutation = useCreateHostProfile();

  const completeOnboarding = async (data: HostOnboardingData) => {
    try {
      const profile = await createProfileMutation.mutateAsync(data);
      setIsComplete(true);
      return profile;
    } catch (error) {
      throw error;
    }
  };

  return {
    currentStep,
    setCurrentStep,
    isComplete,
    completeOnboarding,
    isLoading: createProfileMutation.isPending,
    error: createProfileMutation.error,
  };
}