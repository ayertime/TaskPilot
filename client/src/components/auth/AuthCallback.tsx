import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function saveProviderTokens(session: { access_token: string; provider_token?: string | null; provider_refresh_token?: string | null; user: { app_metadata: { provider?: string; providers?: string[] } } }) {
  if (!session.provider_token) return;
  try {
    await fetch(`${API_URL}/api/profile/oauth-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        provider: session.user.app_metadata.providers?.includes('google') ? 'google' :
          session.user.app_metadata.providers?.includes('azure') ? 'azure' :
          session.user.app_metadata.provider || 'google',
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
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthCallback] Event:', event, 'provider_token:', !!session?.provider_token, 'user:', session?.user?.email);
        if (event === 'PASSWORD_RECOVERY') {
          setRecoveryMode(true);
          return;
        }
        if (session) {
          if (!tokensSaved.current && session.provider_token) {
            tokensSaved.current = true;
            console.log('[AuthCallback] Saving provider tokens...');
            await saveProviderTokens(session);
            console.log('[AuthCallback] Tokens saved');
          }
          if (!navigated.current) {
            navigated.current = true;
            navigate('/dashboard', { replace: true });
          }
        }
      }
    );

    const fallbackTimer = setTimeout(async () => {
      if (navigated.current || recoveryMode) return;
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
  }, [navigate, recoveryMode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setResetLoading(false);
    }
  };

  if (recoveryMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle>Reset Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={resetLoading}>
                {resetLoading ? 'Updating...' : 'Update Password'}
              </Button>
              {resetError && (
                <p className="text-sm text-center text-destructive">{resetError}</p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
