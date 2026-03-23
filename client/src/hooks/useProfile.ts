import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Profile } from '@/types';

export function useProfile() {
  const queryClient = useQueryClient();

  const { data: profile = null, isLoading: loading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiFetch('/api/profile') as Promise<Profile>,
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      display_name?: string;
      custom_avatar_url?: string | null;
      theme?: 'light' | 'dark' | 'system';
      accent_color?: string;
      timezone?: string;
      has_seen_tutorial?: boolean;
      sync_enabled?: boolean;
      sync_interval?: string;
    }) =>
      apiFetch('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }) as Promise<Profile>,
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile'], updated);
    },
  });

  return {
    profile,
    loading,
    updateProfile: (data: Parameters<typeof updateMutation.mutateAsync>[0]) =>
      updateMutation.mutateAsync(data),
    refetch: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  };
}
