import { supabaseAdmin } from './supabase';
import { encrypt, decrypt, isEncrypted } from './crypto';

/**
 * Decrypt a token value that may be plaintext (pre-migration) or encrypted.
 */
function decryptToken(value: string): string {
  return isEncrypted(value) ? decrypt(value) : value;
}

/**
 * Get a valid OAuth access token for a user, refreshing if expired.
 * Returns the token and provider, or null if not connected.
 */
export async function getValidToken(
  userId: string,
): Promise<{ provider: string; accessToken: string } | null> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('provider, provider_token, provider_refresh_token')
    .eq('id', userId)
    .single();

  if (!profile?.provider_token) return null;

  const accessToken = decryptToken(profile.provider_token);

  // Try the existing token first with a lightweight API call
  const isValid = await testToken(profile.provider, accessToken);

  if (isValid) {
    return { provider: profile.provider, accessToken };
  }

  // Token expired — try to refresh
  if (!profile.provider_refresh_token) {
    console.log('[OAuth] Token expired and no refresh token available for user:', userId);
    return null;
  }

  console.log('[OAuth] Token expired, refreshing for user:', userId);
  const refreshTokenValue = decryptToken(profile.provider_refresh_token);
  const newToken = await refreshToken(profile.provider, refreshTokenValue);

  if (!newToken) {
    console.log('[OAuth] Token refresh failed for user:', userId);
    return null;
  }

  // Save the new access token (and new refresh token if provided) — encrypted
  const updateData: Record<string, string> = {
    provider_token: encrypt(newToken.accessToken),
  };
  if (newToken.refreshToken) {
    updateData.provider_refresh_token = encrypt(newToken.refreshToken);
  }

  await supabaseAdmin
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  console.log('[OAuth] Token refreshed successfully for user:', userId);
  return { provider: profile.provider, accessToken: newToken.accessToken };
}

async function testToken(provider: string, token: string): Promise<boolean> {
  try {
    if (provider === 'google') {
      const res = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(token)}`,
        { signal: AbortSignal.timeout(5000) },
      );
      return res.ok;
    } else if (provider === 'azure') {
      const res = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    }
    return false;
  } catch {
    return false;
  }
}

async function refreshToken(
  provider: string,
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken?: string } | null> {
  try {
    if (provider === 'google') {
      return refreshGoogleToken(refreshToken);
    } else if (provider === 'azure') {
      return refreshMicrosoftToken(refreshToken);
    }
    return null;
  } catch (err) {
    console.error('[OAuth] Refresh error:', err);
    return null;
  }
}

async function refreshGoogleToken(
  refresh: string,
): Promise<{ accessToken: string; refreshToken?: string } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[OAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set');
    return null;
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('[OAuth] Google refresh failed:', error);
    return null;
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

async function refreshMicrosoftToken(
  refresh: string,
): Promise<{ accessToken: string; refreshToken?: string } | null> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[OAuth] MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET not set');
    return null;
  }

  const res = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refresh,
        grant_type: 'refresh_token',
        scope: 'Mail.Send Calendars.ReadWrite offline_access',
      }),
    },
  );

  if (!res.ok) {
    const error = await res.text();
    console.error('[OAuth] Microsoft refresh failed:', error);
    return null;
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}
