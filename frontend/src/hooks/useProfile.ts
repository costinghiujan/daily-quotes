import { useState, useEffect, useCallback } from 'react';
import { userService, UserProfile } from '../api/userService';

interface UseProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing a user's profile
 * @param userId - The ID of the user to fetch, or undefined for current user
 */
export const useProfile = (userId?: number): UseProfileReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (userId) {
        const response = await userService.getUserProfile(userId);
        setProfile(response.profile);
      } else {
        const response = await userService.getMyProfile();
        setProfile(response.profile);
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('[useProfile] Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const refresh = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refresh,
  };
};
