import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';
import { applyTheme, applyAccentColor } from '@/lib/theme';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, XCircle, Mail, CalendarDays, RefreshCw, PlayCircle, Bell } from 'lucide-react';
import { isNotificationsEnabled, setNotificationsEnabled, requestNotificationPermission } from '@/lib/notifications';
import { toast } from 'sonner';

export function ProfileSettings() {
  const { profile, loading, updateProfile } = useProfile();
  const { signInWithGoogle } = useAuth();
  const { onShowTutorial } = useOutletContext<{ onShowTutorial?: () => void }>();
  const [displayName, setDisplayName] = useState('');
  const [theme, setTheme] = useState('system');
  const [accentColor, setAccentColor] = useState('#6366f1');
  const [timezone, setTimezone] = useState('');
  const [saving, setSaving] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<{ connected: boolean; provider: string | null }>({
    connected: false,
    provider: null,
  });
  const [oauthLoading, setOauthLoading] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState('5h');
  const [notificationsOn, setNotificationsOn] = useState(() => isNotificationsEnabled());

  // Check OAuth connection status
  useEffect(() => {
    apiFetch('/api/profile/oauth-status')
      .then((data) => setOauthStatus(data))
      .catch(() => {})
      .finally(() => setOauthLoading(false));
  }, []);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || profile.full_name || '');
      setTheme(profile.theme);
      setAccentColor(profile.accent_color || '#6366f1');
      setTimezone(profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      setSyncEnabled(profile.sync_enabled ?? false);
      setSyncInterval(profile.sync_interval || '5h');
      applyTheme(profile.theme);
    }
  }, [profile]);

  function handleThemeChange(newTheme: string) {
    setTheme(newTheme);
    applyTheme(newTheme);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName,
        theme: theme as 'light' | 'dark' | 'system',
        accent_color: accentColor,
        timezone,
        sync_enabled: syncEnabled,
        sync_interval: syncInterval,
      });
      applyAccentColor(accentColor);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile?.email || ''} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={(v) => { if (v) handleThemeChange(v); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent Color</Label>
            <div className="flex items-center gap-3">
              <Input
                id="accentColor"
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-32"
                placeholder="#6366f1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Locale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={(v) => { if (v) setTimezone(v); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Intl.supportedValuesOf('timeZone').map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Used for scheduling task auto-execution and the header clock.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Connect your Google account to let TaskPilot read your inbox, send emails, and create calendar events on your behalf.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <div>
                <p className="text-sm font-medium">Google</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Gmail (Send & Read)
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> Calendar
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {oauthLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : oauthStatus.connected && oauthStatus.provider === 'google' ? (
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <>
                  <Badge variant="outline" className="text-muted-foreground gap-1">
                    <XCircle className="h-3 w-3" />
                    Not connected
                  </Badge>
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await signInWithGoogle();
                      } catch {
                        toast.error('Failed to connect Google');
                      }
                    }}
                  >
                    Connect
                  </Button>
                </>
              )}
            </div>
          </div>

          {oauthStatus.connected && oauthStatus.provider === 'google' && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                TaskPilot can read your inbox, send emails, and create calendar events using your Google account.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                  } catch {
                    toast.error('Failed to reconnect');
                  }
                }}
              >
                Reconnect
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Smart Sync</CardTitle>
          <CardDescription>
            Automatically check your Gmail and Google Calendar for actionable items and create tasks on your board.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Auto-sync emails & calendar
              </Label>
              <p className="text-xs text-muted-foreground">
                TaskPilot will periodically check for new emails that need a response and upcoming calendar events.
              </p>
            </div>
            <Switch
              checked={syncEnabled}
              onCheckedChange={(checked: boolean) => setSyncEnabled(checked)}
              disabled={!oauthStatus.connected}
            />
          </div>

          {syncEnabled && (
            <div className="space-y-2 pl-6 border-l-2 border-primary/20">
              <Label>Sync every</Label>
              <Select value={syncInterval} onValueChange={(v) => { if (v) setSyncInterval(v); }}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 hour</SelectItem>
                  <SelectItem value="3h">3 hours</SelectItem>
                  <SelectItem value="5h">5 hours</SelectItem>
                  <SelectItem value="12h">12 hours</SelectItem>
                  <SelectItem value="24h">Once a day</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                More frequent syncing uses more AI credits.
              </p>
            </div>
          )}

          {!oauthStatus.connected && (
            <p className="text-xs text-amber-500">
              Connect your Google account above to enable Smart Sync.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Get notified when the AI agent completes tasks in the background.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Browser notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                {!('Notification' in window)
                  ? 'Your browser does not support notifications.'
                  : Notification.permission === 'denied'
                    ? 'Notifications are blocked by your browser. Update your browser settings to enable them.'
                    : 'Show a notification when the agent completes a task while you\'re on another tab.'}
              </p>
            </div>
            <Switch
              checked={notificationsOn}
              disabled={!('Notification' in window) || Notification.permission === 'denied'}
              onCheckedChange={async (checked: boolean) => {
                if (checked && Notification.permission === 'default') {
                  const granted = await requestNotificationPermission();
                  if (!granted) return;
                }
                setNotificationsEnabled(checked);
                setNotificationsOn(checked);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Help</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium flex items-center gap-2">
                <PlayCircle className="h-4 w-4" />
                Product Tour
              </p>
              <p className="text-xs text-muted-foreground">
                Watch the intro tutorial to learn about TaskPilot's features.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onShowTutorial}>
              Watch Again
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
