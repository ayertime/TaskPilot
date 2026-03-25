-- Email Drafts table for draft-first email sending
-- Agent creates drafts instead of sending directly; user gets a review window
-- After the review window expires, the system auto-sends the draft

create table email_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  to_address text not null,
  subject text not null,
  body text not null,
  cc text,
  bcc text,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'sent', 'cancelled')),
  review_deadline timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Index for the auto-send cron: find expired pending drafts quickly
create index idx_email_drafts_pending on email_drafts (review_deadline)
  where status = 'pending_review';

-- Index for user lookup
create index idx_email_drafts_user on email_drafts (user_id, created_at desc);

-- Row Level Security
alter table email_drafts enable row level security;

create policy "Users can view own drafts"
  on email_drafts for select
  using (auth.uid() = user_id);

create policy "Users can update own drafts"
  on email_drafts for update
  using (auth.uid() = user_id);

create policy "Users can delete own drafts"
  on email_drafts for delete
  using (auth.uid() = user_id);
