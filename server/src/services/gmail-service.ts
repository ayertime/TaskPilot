import { getValidToken } from './oauth-token-service';

interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  isUnread: boolean;
  labels: string[];
}

interface ReadEmailsParams {
  query?: string;
  maxResults?: number;
  unreadOnly?: boolean;
}

/**
 * Read emails from the user's Gmail inbox.
 * Uses Gmail API with the gmail.readonly scope.
 */
export async function readEmails(
  userId: string,
  params: ReadEmailsParams = {},
): Promise<{ success: boolean; emails?: EmailMessage[]; message: string }> {
  const token = await getValidToken(userId);

  if (!token) {
    return {
      success: false,
      message:
        'Reading emails requires a connected Google account. Please connect your account in Settings.',
    };
  }

  if (token.provider !== 'google') {
    return {
      success: false,
      message: 'Email reading is currently only supported for Google accounts.',
    };
  }

  try {
    const maxResults = Math.min(params.maxResults || 10, 20);
    let q = params.query || '';
    if (params.unreadOnly) {
      q = q ? `is:unread ${q}` : 'is:unread';
    }

    // List messages
    const listUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
    listUrl.searchParams.set('maxResults', String(maxResults));
    if (q) listUrl.searchParams.set('q', q);

    const listRes = await fetch(listUrl.toString(), {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    });

    if (!listRes.ok) {
      const error = await listRes.text();
      return { success: false, message: `Gmail API error: ${error}` };
    }

    const listData = (await listRes.json()) as {
      messages?: { id: string; threadId: string }[];
    };

    if (!listData.messages || listData.messages.length === 0) {
      return { success: true, emails: [], message: 'No emails found matching your criteria.' };
    }

    // Fetch each message's details (batch up to maxResults)
    const emails: EmailMessage[] = [];
    for (const msg of listData.messages.slice(0, maxResults)) {
      const detail = await fetchMessageDetail(token.accessToken, msg.id);
      if (detail) emails.push(detail);
    }

    return {
      success: true,
      emails,
      message: `Found ${emails.length} email(s).`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to read emails: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

async function fetchMessageDetail(
  accessToken: string,
  messageId: string,
): Promise<EmailMessage | null> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as {
    id: string;
    threadId: string;
    snippet: string;
    labelIds?: string[];
    payload: {
      headers: { name: string; value: string }[];
      body?: { data?: string };
      parts?: { mimeType: string; body?: { data?: string } }[];
    };
  };

  const getHeader = (name: string) =>
    data.payload.headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  // Extract plain text body
  let body = '';
  if (data.payload.body?.data) {
    body = decodeBase64Url(data.payload.body.data);
  } else if (data.payload.parts) {
    const textPart = data.payload.parts.find((p) => p.mimeType === 'text/plain');
    if (textPart?.body?.data) {
      body = decodeBase64Url(textPart.body.data);
    }
  }

  // Truncate body to avoid token bloat
  if (body.length > 1500) {
    body = body.slice(0, 1500) + '... [truncated]';
  }

  return {
    id: data.id,
    threadId: data.threadId,
    from: getHeader('From'),
    to: getHeader('To'),
    subject: getHeader('Subject'),
    snippet: data.snippet,
    body,
    date: getHeader('Date'),
    isUnread: data.labelIds?.includes('UNREAD') || false,
    labels: data.labelIds || [],
  };
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}
