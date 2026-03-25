import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';

async function saveProviderTokens(session: { provider_token?: string | null; provider_refresh_token?: string | null; user: { app_metadata: { provider?: string } } }) {
  if (!session.provider_token) return;
  try {
    await apiFetch('/api/profile/oauth-tokens', {
      method: 'POST',
      body: JSON.stringify({
        provider: session.user.app_metadata.provider || 'google',
        provider_token: session.provider_token,
        provider_refresh_token: session.provider_refresh_token || null,
      }),
    });
  } catch {
    // Non-blocking
  }
}

export function AuthCallback() {
  const navigate = useNavigate();
  const navigated = useRef(false);
  const tokensSaved = useRef(false);

  useEffect(() => {
    // onAuthStateChange is the ONLY reliable way to get provider_token
    // from OAuth redirects — getSession() does NOT include it
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Save tokens if we haven't yet (provider_token is only here, not in getSession)
          if (!tokensSaved.current && session.provider_token) {
            tokensSaved.current = true;
            await saveProviderTokens(session);
          }
          if (!navigated.current) {
            navigated.current = true;
            navigate('/dashboard', { replace: true });
          }
        }
      }
    );

    // Fallback: if onAuthStateChange doesn't fire within 3s
    // (e.g., session already existed from a page reload)
    const fallbackTimer = setTimeout(async () => {
      if (navigated.current) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigated.current = true;
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
