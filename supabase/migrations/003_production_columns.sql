-- Add production columns to reservations
alter table reservations add column if not exists requires_reallocation boolean default false;
alter table reservations add column if not exists reminder_sent_at timestamptz;
alter table reservations add column if not exists seated_at timestamptz;
alter table reservations add column if not exists review_sent_at timestamptz;
