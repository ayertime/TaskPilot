import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { EmailDraft } from '@/types';

interface DraftsResponse {
  drafts: EmailDraft[];
}

export function useDrafts() {
  return useQuery({
    queryKey: ['drafts'],
    queryFn: async () => {
      const res = (await apiFetch('/api/drafts')) as DraftsResponse;
      return res.drafts;
    },
    refetchInterval: 30_000, // Poll every 30s to update countdowns
  });
}

export function useSendDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (draftId: string) =>
      apiFetch(`/api/drafts/${draftId}/send`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drafts'] });
      qc.invalidateQueries({ queryKey: ['emails'] });
    },
  });
}

export function useCancelDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (draftId: string) =>
      apiFetch(`/api/drafts/${draftId}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drafts'] });
    },
  });
}

export function useUpdateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string; to?: string; subject?: string; body?: string }) =>
      apiFetch(`/api/drafts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drafts'] });
    },
  });
}
