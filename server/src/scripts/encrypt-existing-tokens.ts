/**
 * One-time migration: encrypt existing plaintext OAuth tokens in the database.
 * Run with: npx tsx src/scripts/encrypt-existing-tokens.ts
 *
 * Safe to run multiple times — skips tokens that are already encrypted.
 */
import 'dotenv/config';
import { supabaseAdmin } from '../services/supabase';
import { encrypt, isEncrypted } from '../services/crypto';

async function main() {
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, provider_token, provider_refresh_token')
    .not('provider_token', 'is', null);

  if (error) {
    console.error('Failed to fetch profiles:', error.message);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log('No profiles with OAuth tokens found. Nothing to do.');
    return;
  }

  let migrated = 0;
  let skipped = 0;

  for (const profile of profiles) {
    const updates: Record<string, string> = {};

    if (profile.provider_token && !isEncrypted(profile.provider_token)) {
      updates.provider_token = encrypt(profile.provider_token);
    }
    if (profile.provider_refresh_token && !isEncrypted(profile.provider_refresh_token)) {
      updates.provider_refresh_token = encrypt(profile.provider_refresh_token);
    }

    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);

    if (updateError) {
      console.error(`Failed to encrypt tokens for user ${profile.id}:`, updateError.message);
    } else {
      migrated++;
    }
  }

  console.log(`Done. Encrypted: ${migrated}, Already encrypted: ${skipped}`);
}

main();
