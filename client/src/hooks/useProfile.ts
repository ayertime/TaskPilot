import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import type { Profile } from '@/types';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiFetch('/api/profile');
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (data: {
      display_name?: string;
      custom_avatar_url?: string | null;
      theme?: 'light' | 'dark' | 'system';
      accent_color?: string;
      timezone?: string;
    }) => {
      const updated = await apiFetch('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      setProfile(updated);
      return updated;
    },
    []
  );

  return { profile, loading, updateProfile, refetch: fetchProfile };
}
