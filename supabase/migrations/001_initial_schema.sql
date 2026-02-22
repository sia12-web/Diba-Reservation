-- tables: static config
create table restaurant_tables (
  id integer primary key,
  label text not null,
  shape text not null check (shape in ('regular','round','large')),
  capacity_min integer not null,
  capacity_max integer not null,
  is_combo_critical boolean default false,
  is_combinable boolean default true,
  position_x integer, -- for floor map rendering
  position_y integer,
  width integer,
  height integer
);

-- valid combos
create table table_combos (
  id serial primary key,
  table_ids integer[] not null,
  min_capacity integer not null,
  max_capacity integer not null
);

-- reservations
create table reservations (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  email text not null,
  phone text,
  party_size integer not null,
  reservation_date date not null,
  reservation_time time not null,
  table_ids integer[] not null,
  status text default 'pending' check (status in ('pending','confirmed','deposit_required','deposit_paid','seated','completed','cancelled','no_show')),
  created_by text default 'customer' check (created_by in ('customer','admin')),
  stripe_payment_intent_id text,
  deposit_paid boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- dine-ins (walk-ins seated immediately)
create table dine_ins (
  id uuid primary key default gen_random_uuid(),
  table_ids integer[] not null,
  party_size integer not null,
  seated_at timestamptz default now(),
  estimated_release_at timestamptz not null,
  last_checked_at timestamptz,
  status text default 'occupied' check (status in ('occupied','released')),
  created_by_admin boolean default true
);

-- table check-ins (admin 40-min prompts)
create table table_checks (
  id uuid primary key default gen_random_uuid(),
  dine_in_id uuid references dine_ins(id),
  reservation_id uuid references reservations(id),
  check_type text check (check_type in ('dine_in','reservation')),
  prompted_at timestamptz default now(),
  response text check (response in ('still_seated','left',null)),
  responded_at timestamptz
);

-- table locks
create table table_locks (
  table_id integer primary key,
  locked_by_reservation_id text,
  locked_until timestamptz
);

-- indexes
create index on reservations(reservation_date, reservation_time);
create index on reservations(status);
create index on dine_ins(status);
