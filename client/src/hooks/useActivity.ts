import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';
import type { AgentActivity } from '@/types';

interface ActivityResponse {
  activities: (AgentActivity & { tasks?: { title: string } | null })[];
}

export function useActivity() {
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['activity'],
    queryFn: async () => {
      const res = (await apiFetch('/api/activity?limit=100')) as ActivityResponse;
      return res.activities;
    },
  });

  // Subscribe to Supabase Realtime for live activity updates
  useEffect(() => {
    const channel = supabase
      .channel('activity-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_activity' },
        () => {
          // Refetch on new activity since we need the joined task title
          queryClient.invalidateQueries({ queryKey: ['activity'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    activities: data || [],
    loading,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['activity'] }),
  };
}
