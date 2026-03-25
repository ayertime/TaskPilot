import type { Email } from '@/types';

const NOISE_LABELS = [
  'CATEGORY_PROMOTIONS',
  'CATEGORY_SOCIAL',
  'CATEGORY_FORUMS',
  'CATEGORY_UPDATES',
  'SPAM',
  'TRASH',
];

export function isRelevantEmail(email: Email): boolean {
  if (email.labels.some((l) => NOISE_LABELS.includes(l))) return false;
  return email.isUnread || !!email.hasReplied;
}

export function getEmailSender(from: string): string {
  const match = from.match(/^(.+?)\s*</);
  return match ? match[1].replace(/"/g, '').trim() : from.split('@')[0];
}
