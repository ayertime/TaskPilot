import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { REMEMBER_ME_KEY, setRememberMe as persistRememberMe } from '@/lib/supabase';

export function LoginPage() {
  const { user, signInWithGoogle, signInWithMicrosoft, signInWithYahoo, signInWithEmail, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem(REMEMBER_ME_KEY) !== 'false',
  );

  function handleRememberMe(checked: boolean) {
    setRememberMe(checked);
    persistRememberMe(checked);
  }

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      setError('Check your email for a confirmation link!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'microsoft' | 'yahoo') => {
    setError('');
    try {
      if (provider === 'google') await signInWithGoogle();
      if (provider === 'microsoft') await signInWithMicrosoft();
      if (provider === 'yahoo') await signInWithYahoo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary)/0.04,transparent_70%)] pointer-events-none" />

      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="relative w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <img src="/favicon.svg" alt="" className="w-10 h-10" />
            <h1 className="text-3xl font-bold text-foreground">TaskPilot</h1>
          </div>
          <p className="text-muted-foreground">
            Your AI co-pilot for getting things done
          </p>
        </div>

        <Card className="shadow-xl shadow-black/[0.04] dark:shadow-black/[0.15]">
          <CardHeader className="text-center">
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            {/* OAuth Buttons — set visible to true when provider is ready */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-11 justify-start px-4"
                onClick={() => handleOAuth('google')}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="ml-3">Continue with Google</span>
              </Button>

              {/* Microsoft — change false to true when ready */}
              {false && (
              <Button
                variant="outline"
                className="w-full h-11 justify-start px-4 relative opacity-60 cursor-not-allowed"
                disabled
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#F25022" d="M1 1h10v10H1z"/>
                  <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                  <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                  <path fill="#FFB900" d="M13 13h10v10H13z"/>
                </svg>
                <span className="ml-3">Continue with Microsoft</span>
                <span className="absolute right-3 text-[10px] font-medium text-muted-foreground">Coming Soon</span>
              </Button>
              )}

              {/* Yahoo — change false to true when ready */}
              {false && (
              <Button
                variant="outline"
                className="w-full h-11 justify-start px-4 relative opacity-60 cursor-not-allowed"
                disabled
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <text x="3" y="19" fill="#720e9e" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="20">Y!</text>
                </svg>
                <span className="ml-3">Continue with Yahoo</span>
                <span className="absolute right-3 text-[10px] font-medium text-muted-foreground">Coming Soon</span>
              </Button>
              )}

              {/* Slack — change false to true when ready */}
              {false && (
              <Button
                variant="outline"
                className="w-full h-11 justify-start px-4 relative opacity-60 cursor-not-allowed"
                disabled
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 127 127">
                  <path fill="#E01E5A" d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2S.8 87.3.8 80s5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2s13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2s-13.2-5.9-13.2-13.2V80z"/>
                  <path fill="#36C5F0" d="M47 27c-7.3 0-13.2-5.9-13.2-13.2S39.7.6 47 .6s13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2s-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9s5.9-13.2 13.2-13.2H47z"/>
                  <path fill="#2EB67D" d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2s13.2 5.9 13.2 13.2-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2s-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6s13.2 5.9 13.2 13.2v33.1z"/>
                  <path fill="#ECB22E" d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2s-5.9 13.2-13.2 13.2-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2s5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2s-5.9 13.2-13.2 13.2H80.1z"/>
                </svg>
                <span className="ml-3">Continue with Slack</span>
                <span className="absolute right-3 text-[10px] font-medium text-muted-foreground">Coming Soon</span>
              </Button>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => handleRememberMe(checked === true)}
              />
              <Label htmlFor="remember-me" className="text-sm font-normal text-muted-foreground cursor-pointer">
                Remember me on this device
              </Label>
            </div>

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                or
              </span>
            </div>

            {/* Email/Password Tabs */}
            <Tabs defaultValue="login">
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleEmailLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {error && (
              <p className={`mt-4 text-sm text-center ${error.includes('Check your email') ? 'text-green-600' : 'text-destructive'}`}>
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
