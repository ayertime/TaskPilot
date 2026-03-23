import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { CalendarEvent } from '@/types';

interface CalendarResponse {
  events: CalendarEvent[];
  message: string;
}

export function useCalendarEvents() {
  return useQuery({
    queryKey: ['calendar-events'],
    queryFn: async () => {
      const res = (await apiFetch('/api/calendar?limit=20')) as CalendarResponse;
      return res.events;
    },
    retry: false,
  });
}
