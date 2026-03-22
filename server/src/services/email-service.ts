import { supabaseAdmin } from './supabase';

interface EmailParams {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

/**
 * Send an email using the user's connected OAuth provider.
 * Supports Gmail API and Microsoft Graph API.
 */
export async function sendEmail(
  userId: string,
  params: EmailParams,
): Promise<{ success: boolean; message: string }> {
  // Get user's provider tokens from profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('provider, provider_token, provider_refresh_token')
    .eq('id', userId)
    .single();

  if (!profile?.provider_token) {
    return {
      success: false,
      message:
        'Email sending requires a connected Google or Microsoft account with email permissions. Please reconnect your account in Settings to grant email access.',
    };
  }

  if (profile.provider === 'google') {
    return sendViaGmail(profile.provider_token, params);
  } else if (profile.provider === 'azure') {
    return sendViaMicrosoftGraph(profile.provider_token, params);
  }

  return {
    success: false,
    message: `Email sending is not supported for the "${profile.provider}" provider. Please connect a Google or Microsoft account.`,
  };
}

async function sendViaGmail(
  accessToken: string,
  params: EmailParams,
): Promise<{ success: boolean; message: string }> {
  const headers = [
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    'Content-Type: text/plain; charset=utf-8',
  ];
  if (params.cc) headers.push(`Cc: ${params.cc}`);
  if (params.bcc) headers.push(`Bcc: ${params.bcc}`);

  const rawEmail = headers.join('\r\n') + '\r\n\r\n' + params.body;
  const encoded = Buffer.from(rawEmail)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encoded }),
    },
  );

  if (!res.ok) {
    const error = await res.text();
    return { success: false, message: `Gmail API error: ${error}` };
  }

  return { success: true, message: `Email sent to ${params.to}` };
}

async function sendViaMicrosoftGraph(
  accessToken: string,
  params: EmailParams,
): Promise<{ success: boolean; message: string }> {
  const toRecipients = [
    { emailAddress: { address: params.to } },
  ];
  const ccRecipients = params.cc
    ? [{ emailAddress: { address: params.cc } }]
    : [];
  const bccRecipients = params.bcc
    ? [{ emailAddress: { address: params.bcc } }]
    : [];

  const res = await fetch(
    'https://graph.microsoft.com/v1.0/me/sendMail',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject: params.subject,
          body: { contentType: 'Text', content: params.body },
          toRecipients,
          ccRecipients,
          bccRecipients,
        },
      }),
    },
  );

  if (!res.ok) {
    const error = await res.text();
    return { success: false, message: `Microsoft Graph error: ${error}` };
  }

  return { success: true, message: `Email sent to ${params.to}` };
}
