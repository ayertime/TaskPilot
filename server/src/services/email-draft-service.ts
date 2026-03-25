import { supabaseAdmin } from './supabase';
import { sendEmail } from './email-service';

const REVIEW_WINDOW_MS = 60 * 60 * 1000; // 1 hour default

export interface DraftParams {
  userId: string;
  taskId?: string;
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export interface EmailDraft {
  id: string;
  user_id: string;
  task_id: string | null;
  to_address: string;
  subject: string;
  body: string;
  cc: string | null;
  bcc: string | null;
  status: 'pending_review' | 'sent' | 'cancelled';
  review_deadline: string;
  sent_at: string | null;
  created_at: string;
}

/**
 * Create a draft email with a review window.
 * After the window expires, the auto-send cron will send it.
 */
export async function createEmailDraft(
  params: DraftParams,
): Promise<{ success: boolean; draft?: EmailDraft; message: string }> {
  const reviewDeadline = new Date(Date.now() + REVIEW_WINDOW_MS).toISOString();

  const { data, error } = await supabaseAdmin
    .from('email_drafts')
    .insert({
      user_id: params.userId,
      task_id: params.taskId || null,
      to_address: params.to,
      subject: params.subject,
      body: params.body,
      cc: params.cc || null,
      bcc: params.bcc || null,
      status: 'pending_review',
      review_deadline: reviewDeadline,
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: `Failed to create draft: ${error.message}` };
  }

  // Log activity so user sees it
  await supabaseAdmin.from('agent_activity').insert({
    user_id: params.userId,
    task_id: params.taskId || null,
    action_type: 'email_draft_created',
    description: `Drafted email to ${params.to}: "${params.subject}" — review within 1 hour or it sends automatically`,
    metadata: {
      draft_id: data.id,
      to: params.to,
      subject: params.subject,
      review_deadline: reviewDeadline,
    },
  });

  return {
    success: true,
    draft: data as EmailDraft,
    message: `Email drafted to ${params.to}. You have 1 hour to review before it sends automatically.`,
  };
}

/**
 * Manually send a pending draft immediately.
 */
export async function sendDraft(
  draftId: string,
  userId: string,
): Promise<{ success: boolean; message: string }> {
  // Fetch the draft
  const { data: draft, error: fetchErr } = await supabaseAdmin
    .from('email_drafts')
    .select('*')
    .eq('id', draftId)
    .eq('user_id', userId)
    .eq('status', 'pending_review')
    .single();

  if (fetchErr || !draft) {
    return { success: false, message: 'Draft not found or already processed' };
  }

  // Send the email
  const result = await sendEmail(userId, {
    to: draft.to_address,
    subject: draft.subject,
    body: draft.body,
    cc: draft.cc || undefined,
    bcc: draft.bcc || undefined,
  });

  if (!result.success) {
    return result;
  }

  // Mark draft as sent
  await supabaseAdmin
    .from('email_drafts')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', draftId);

  // Log activity
  await supabaseAdmin.from('agent_activity').insert({
    user_id: userId,
    task_id: draft.task_id,
    action_type: 'send_email',
    description: `Sent email to ${draft.to_address}: "${draft.subject}" (reviewed by user)`,
    metadata: {
      draft_id: draftId,
      to: draft.to_address,
      subject: draft.subject,
      sent_by: 'user_review',
    },
  });

  // Complete the associated task if there is one
  if (draft.task_id) {
    await supabaseAdmin
      .from('tasks')
      .update({ status: 'done', completed_at: new Date().toISOString(), completed_by: 'user' })
      .eq('id', draft.task_id);
  }

  return { success: true, message: `Email sent to ${draft.to_address}` };
}

/**
 * Cancel a pending draft — email will not be sent.
 */
export async function cancelDraft(
  draftId: string,
  userId: string,
): Promise<{ success: boolean; message: string }> {
  const { error } = await supabaseAdmin
    .from('email_drafts')
    .update({ status: 'cancelled' })
    .eq('id', draftId)
    .eq('user_id', userId)
    .eq('status', 'pending_review');

  if (error) {
    return { success: false, message: 'Draft not found or already processed' };
  }

  return { success: true, message: 'Draft cancelled — email will not be sent' };
}

/**
 * Update a pending draft's content before sending.
 */
export async function updateDraft(
  draftId: string,
  userId: string,
  updates: { to?: string; subject?: string; body?: string; cc?: string; bcc?: string },
): Promise<{ success: boolean; message: string }> {
  const updateData: Record<string, unknown> = {};
  if (updates.to !== undefined) updateData.to_address = updates.to;
  if (updates.subject !== undefined) updateData.subject = updates.subject;
  if (updates.body !== undefined) updateData.body = updates.body;
  if (updates.cc !== undefined) updateData.cc = updates.cc;
  if (updates.bcc !== undefined) updateData.bcc = updates.bcc;

  const { error } = await supabaseAdmin
    .from('email_drafts')
    .update(updateData)
    .eq('id', draftId)
    .eq('user_id', userId)
    .eq('status', 'pending_review');

  if (error) {
    return { success: false, message: 'Draft not found or already processed' };
  }

  return { success: true, message: 'Draft updated' };
}

/**
 * Process expired drafts — auto-send any that passed the review window.
 * Called by the scheduler cron.
 */
export async function processExpiredDrafts(): Promise<void> {
  const now = new Date().toISOString();

  const { data: expiredDrafts, error } = await supabaseAdmin
    .from('email_drafts')
    .select('*')
    .eq('status', 'pending_review')
    .lte('review_deadline', now)
    .limit(10);

  if (error || !expiredDrafts || expiredDrafts.length === 0) return;

  for (const draft of expiredDrafts) {
    try {
      const result = await sendEmail(draft.user_id, {
        to: draft.to_address,
        subject: draft.subject,
        body: draft.body,
        cc: draft.cc || undefined,
        bcc: draft.bcc || undefined,
      });

      if (result.success) {
        await supabaseAdmin
          .from('email_drafts')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', draft.id);

        await supabaseAdmin.from('agent_activity').insert({
          user_id: draft.user_id,
          task_id: draft.task_id,
          action_type: 'send_email',
          description: `Auto-sent email to ${draft.to_address}: "${draft.subject}" (review window expired)`,
          metadata: {
            draft_id: draft.id,
            to: draft.to_address,
            subject: draft.subject,
            sent_by: 'auto_send',
          },
        });

        // Complete the associated task
        if (draft.task_id) {
          await supabaseAdmin
            .from('tasks')
            .update({ status: 'done', completed_at: new Date().toISOString(), completed_by: 'agent' })
            .eq('id', draft.task_id);
        }

        console.log(`[Drafts] Auto-sent draft ${draft.id} to ${draft.to_address}`);
      } else {
        console.error(`[Drafts] Failed to auto-send draft ${draft.id}: ${result.message}`);
      }
    } catch (err) {
      console.error(`[Drafts] Error processing draft ${draft.id}:`, err);
    }
  }
}
