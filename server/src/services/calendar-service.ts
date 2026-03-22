import { supabaseAdmin } from './supabase';

interface CalendarEventParams {
  title: string;
  start_time: string;
  end_time: string;
  description?: string;
  location?: string;
  attendees?: string[];
}

/**
 * Create a calendar event using the user's connected OAuth provider.
 * Supports Google Calendar API and Microsoft Outlook Calendar.
 */
export async function createCalendarEvent(
  userId: string,
  params: CalendarEventParams,
): Promise<{ success: boolean; message: string; event_id?: string }> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('provider, provider_token, provider_refresh_token')
    .eq('id', userId)
    .single();

  if (!profile?.provider_token) {
    return {
      success: false,
      message:
        'Calendar access requires a connected Google or Microsoft account with calendar permissions. Please reconnect your account in Settings.',
    };
  }

  if (profile.provider === 'google') {
    return createGoogleCalendarEvent(profile.provider_token, params);
  } else if (profile.provider === 'azure') {
    return createOutlookCalendarEvent(profile.provider_token, params);
  }

  return {
    success: false,
    message: `Calendar is not supported for the "${profile.provider}" provider. Please connect a Google or Microsoft account.`,
  };
}

async function createGoogleCalendarEvent(
  accessToken: string,
  params: CalendarEventParams,
): Promise<{ success: boolean; message: string; event_id?: string }> {
  const event: Record<string, unknown> = {
    summary: params.title,
    start: { dateTime: params.start_time },
    end: { dateTime: params.end_time },
  };
  if (params.description) event.description = params.description;
  if (params.location) event.location = params.location;
  if (params.attendees) {
    event.attendees = params.attendees.map((email) => ({ email }));
  }

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    },
  );

  if (!res.ok) {
    const error = await res.text();
    return { success: false, message: `Google Calendar error: ${error}` };
  }

  const data = (await res.json()) as { id: string };
  return {
    success: true,
    message: `Calendar event "${params.title}" created for ${params.start_time}`,
    event_id: data.id,
  };
}

async function createOutlookCalendarEvent(
  accessToken: string,
  params: CalendarEventParams,
): Promise<{ success: boolean; message: string; event_id?: string }> {
  const event: Record<string, unknown> = {
    subject: params.title,
    start: { dateTime: params.start_time, timeZone: 'UTC' },
    end: { dateTime: params.end_time, timeZone: 'UTC' },
  };
  if (params.description) {
    event.body = { contentType: 'Text', content: params.description };
  }
  if (params.location) {
    event.location = { displayName: params.location };
  }
  if (params.attendees) {
    event.attendees = params.attendees.map((email) => ({
      emailAddress: { address: email },
      type: 'required',
    }));
  }

  const res = await fetch(
    'https://graph.microsoft.com/v1.0/me/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    },
  );

  if (!res.ok) {
    const error = await res.text();
    return { success: false, message: `Outlook Calendar error: ${error}` };
  }

  const data = (await res.json()) as { id: string };
  return {
    success: true,
    message: `Calendar event "${params.title}" created for ${params.start_time}`,
    event_id: data.id,
  };
}
