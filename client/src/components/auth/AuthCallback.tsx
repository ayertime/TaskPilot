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
  const handled = useRef(false);

  useEffect(() => {
    // Listen for the SIGNED_IN event — this is the most reliable way
    // to capture the provider_token from OAuth redirects
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (handled.current) return;
        if (event === 'SIGNED_IN' && session) {
          handled.current = true;
          await saveProviderTokens(session);
          navigate('/dashboard', { replace: true });
        }
      }
    );

    // Fallback: if session already exists (e.g., page reload)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (handled.current) return;
      if (session) {
        handled.current = true;
        await saveProviderTokens(session);
        navigate('/dashboard', { replace: true });
      } else {
        // Give the auth state change listener a moment, then redirect
        setTimeout(() => {
          if (!handled.current) {
            navigate('/login', { replace: true });
          }
        }, 3000);
      }
    });

    return () => subscription.unsubscribe();
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
