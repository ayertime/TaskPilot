const STORAGE_KEY = 'taskpilot_notifications_enabled';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendBrowserNotification(
  title: string,
  options?: NotificationOptions,
): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (localStorage.getItem(STORAGE_KEY) === '0') return;
  if (document.hasFocus()) return;

  new Notification(title, {
    icon: '/favicon.svg',
    ...options,
  });
}

export function isNotificationsEnabled(): boolean {
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;
  return localStorage.getItem(STORAGE_KEY) !== '0';
}

export function setNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
}
