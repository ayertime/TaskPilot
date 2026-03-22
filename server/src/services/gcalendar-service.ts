import { getValidToken } from './oauth-token-service';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  attendees?: string[];
  status: string;
  htmlLink?: string;
}

interface ReadCalendarParams {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  query?: string;
}

/**
 * Read events from the user's Google Calendar.
 * Uses Google Calendar API with the calendar.events scope.
 */
export async function readCalendarEvents(
  userId: string,
  params: ReadCalendarParams = {},
): Promise<{ success: boolean; events?: CalendarEvent[]; message: string }> {
  const token = await getValidToken(userId);

  if (!token) {
    return {
      success: false,
      message:
        'Reading calendar requires a connected Google account. Please connect your account in Settings.',
    };
  }

  if (token.provider !== 'google') {
    return {
      success: false,
      message: 'Calendar reading is currently only supported for Google accounts.',
    };
  }

  try {
    const maxResults = Math.min(params.maxResults || 15, 50);

    // Default: today through next 7 days
    const now = new Date();
    const timeMin = params.timeMin || now.toISOString();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const timeMax = params.timeMax || weekFromNow.toISOString();

    const url = new URL(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    );
    url.searchParams.set('timeMin', timeMin);
    url.searchParams.set('timeMax', timeMax);
    url.searchParams.set('maxResults', String(maxResults));
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    if (params.query) url.searchParams.set('q', params.query);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    });

    if (!res.ok) {
      const error = await res.text();
      return { success: false, message: `Google Calendar API error: ${error}` };
    }

    const data = (await res.json()) as {
      items?: Array<{
        id: string;
        summary?: string;
        start: { dateTime?: string; date?: string };
        end: { dateTime?: string; date?: string };
        description?: string;
        location?: string;
        attendees?: Array<{ email: string }>;
        status: string;
        htmlLink?: string;
      }>;
    };

    const events: CalendarEvent[] = (data.items || []).map((item) => ({
      id: item.id,
      title: item.summary || '(No title)',
      start: item.start.dateTime || item.start.date || '',
      end: item.end.dateTime || item.end.date || '',
      description: item.description
        ? item.description.length > 500
          ? item.description.slice(0, 500) + '... [truncated]'
          : item.description
        : undefined,
      location: item.location,
      attendees: item.attendees?.map((a) => a.email),
      status: item.status,
      htmlLink: item.htmlLink,
    }));

    return {
      success: true,
      events,
      message: `Found ${events.length} event(s) between ${timeMin.split('T')[0]} and ${timeMax.split('T')[0]}.`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to read calendar: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}
