import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Email } from '@/types';

interface EmailsResponse {
  emails: Email[];
  message: string;
}

export function useEmails(folder: 'inbox' | 'sent' = 'inbox', query?: string) {
  const endpoint = folder === 'sent' ? '/api/emails/sent' : '/api/emails';
  const params = new URLSearchParams({ limit: '20' });
  if (query) params.set('q', query);
  if (folder === 'inbox') params.set('unread', 'false');

  return useQuery({
    queryKey: ['emails', folder, query],
    queryFn: async () => {
      const res = (await apiFetch(`${endpoint}?${params}`)) as EmailsResponse;
      return res.emails;
    },
    retry: false,
  });
}
