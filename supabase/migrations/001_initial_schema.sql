-- ════════════════════════════════════════════════════════════
-- MyExpert · Initial Schema · Migration 001
-- ════════════════════════════════════════════════════════════

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles (extends auth.users) ────────────────────────────
CREATE TABLE public.profiles (
  id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role            TEXT NOT NULL CHECK (role IN ('customer','worker','admin')),
  full_name       TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  state_lga       TEXT,
  avatar_url      TEXT,
  is_online       BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  suspended_until TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Worker profiles ───────────────────────────────────────────
CREATE TABLE public.worker_profiles (
  id                    UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  primary_skill         TEXT NOT NULL,
  years_experience      INTEGER DEFAULT 0,
  is_verified           BOOLEAN DEFAULT FALSE,
  verification_status   TEXT DEFAULT 'pending'
                          CHECK (verification_status IN ('pending','in_progress','approved','rejected')),
  trust_score           INTEGER DEFAULT 0,
  current_lat           DOUBLE PRECISION,
  current_lng           DOUBLE PRECISION,
  last_location_update  TIMESTAMPTZ,
  rating                DECIMAL(3,2) DEFAULT 0.00,
  total_reviews         INTEGER DEFAULT 0,
  total_jobs            INTEGER DEFAULT 0,
  available_balance     DECIMAL(12,2) DEFAULT 0,
  escrow_balance        DECIMAL(12,2) DEFAULT 0,
  bank_name             TEXT,
  bank_account_number   TEXT,
  bank_account_name     TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── Verification steps ────────────────────────────────────────
CREATE TABLE public.verification_steps (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  worker_id   UUID REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 8),
  step_name   TEXT NOT NULL,
  status      TEXT DEFAULT 'pending'
                CHECK (status IN ('pending','submitted','under_review','passed','failed')),
  data        JSONB DEFAULT '{}',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, step_number)
);

-- ── Worker services / rates ───────────────────────────────────
CREATE TABLE public.worker_services (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  worker_id    UUID REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  price_type   TEXT CHECK (price_type IN ('call-out','starting','flat')),
  price_amount DECIMAL(12,2) NOT NULL,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Worker references ─────────────────────────────────────────
CREATE TABLE public.worker_references (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  worker_id         UUID REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  phone             TEXT NOT NULL,
  status            TEXT DEFAULT 'pending'
                      CHECK (status IN ('pending','sent','replied','no_reply')),
  response_positive BOOLEAN,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Categories ────────────────────────────────────────────────
CREATE TABLE public.categories (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  icon          TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0
);

-- ── Promos ────────────────────────────────────────────────────
CREATE TABLE public.promos (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code           TEXT NOT NULL UNIQUE,
  description    TEXT,
  discount_type  TEXT CHECK (discount_type IN ('fixed','percentage')),
  discount_value DECIMAL(12,2) NOT NULL,
  max_uses       INTEGER,
  used_count     INTEGER DEFAULT 0,
  valid_from     TIMESTAMPTZ DEFAULT NOW(),
  valid_until    TIMESTAMPTZ,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Jobs ──────────────────────────────────────────────────────
CREATE TABLE public.jobs (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id      UUID REFERENCES public.profiles(id),
  worker_id        UUID REFERENCES public.worker_profiles(id),
  category_id      UUID REFERENCES public.categories(id),
  title            TEXT NOT NULL,
  description      TEXT,
  status           TEXT DEFAULT 'open'
                     CHECK (status IN ('open','bidding','booked','accepted',
                                       'en_route','arrived','in_progress',
                                       'done','confirmed','disputed','cancelled')),
  urgency          TEXT DEFAULT 'normal' CHECK (urgency IN ('normal','urgent')),
  scheduled_for    TIMESTAMPTZ,
  location_address TEXT,
  location_lat     DOUBLE PRECISION,
  location_lng     DOUBLE PRECISION,
  customer_quote   DECIMAL(12,2),
  final_price      DECIMAL(12,2),
  service_fee      DECIMAL(12,2),
  promo_code       TEXT,
  promo_discount   DECIMAL(12,2) DEFAULT 0,
  escrow_amount    DECIMAL(12,2),
  escrow_status    TEXT DEFAULT 'none'
                     CHECK (escrow_status IN ('none','held','released','refunded','disputed','split')),
  payment_method   TEXT CHECK (payment_method IN ('card','bank_transfer','mock')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Job status log ────────────────────────────────────────────
CREATE TABLE public.job_status_log (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id     UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Job photos ────────────────────────────────────────────────
CREATE TABLE public.job_photos (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id      UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id),
  url         TEXT NOT NULL,
  photo_type  TEXT CHECK (photo_type IN ('job_post','before','after','evidence')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Bids ──────────────────────────────────────────────────────
CREATE TABLE public.bids (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id     UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id  UUID REFERENCES public.worker_profiles(id),
  amount     DECIMAL(12,2) NOT NULL,
  message    TEXT,
  status     TEXT DEFAULT 'pending'
               CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Reviews ───────────────────────────────────────────────────
CREATE TABLE public.reviews (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id      UUID REFERENCES public.jobs(id) UNIQUE,
  reviewer_id UUID REFERENCES public.profiles(id),
  worker_id   UUID REFERENCES public.worker_profiles(id),
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  tags        TEXT[] DEFAULT '{}',
  comment     TEXT,
  is_public   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Escrow ledger ─────────────────────────────────────────────
CREATE TABLE public.escrow_ledger (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id         UUID REFERENCES public.jobs(id),
  customer_id    UUID REFERENCES public.profiles(id),
  worker_id      UUID REFERENCES public.worker_profiles(id),
  gross_amount   DECIMAL(12,2) NOT NULL,
  service_fee    DECIMAL(12,2) NOT NULL,
  net_amount     DECIMAL(12,2) NOT NULL,
  promo_discount DECIMAL(12,2) DEFAULT 0,
  status         TEXT DEFAULT 'held'
                   CHECK (status IN ('held','released','refunded','disputed','split')),
  held_at        TIMESTAMPTZ DEFAULT NOW(),
  released_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Payouts ───────────────────────────────────────────────────
CREATE TABLE public.payouts (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  worker_id      UUID REFERENCES public.worker_profiles(id),
  amount         DECIMAL(12,2) NOT NULL,
  fee            DECIMAL(12,2) DEFAULT 0,
  net_amount     DECIMAL(12,2) NOT NULL,
  bank_name      TEXT,
  account_number TEXT,
  account_name   TEXT,
  status         TEXT DEFAULT 'pending'
                   CHECK (status IN ('pending','processing','paid','failed')),
  reference      TEXT UNIQUE,
  notes          TEXT,
  processed_by   UUID REFERENCES public.profiles(id),
  processed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Messages ──────────────────────────────────────────────────
CREATE TABLE public.messages (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id     UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_id  UUID REFERENCES public.profiles(id),
  content    TEXT,
  photo_url  TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Disputes ──────────────────────────────────────────────────
CREATE TABLE public.disputes (
  id                       UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id                   UUID REFERENCES public.jobs(id) UNIQUE,
  opened_by                UUID REFERENCES public.profiles(id),
  status                   TEXT DEFAULT 'open'
                             CHECK (status IN ('open','under_review','resolved')),
  customer_claim           TEXT,
  worker_response          TEXT,
  outcome                  TEXT
                             CHECK (outcome IN ('refund_full','split_50_50',
                                                'release_to_worker','custom_split','pending')),
  outcome_amount_customer  DECIMAL(12,2),
  outcome_amount_worker    DECIMAL(12,2),
  penalty                  TEXT CHECK (penalty IN ('none','warn','suspend_7d','ban')),
  penalised_user           UUID REFERENCES public.profiles(id),
  admin_notes              TEXT,
  resolved_by              UUID REFERENCES public.profiles(id),
  resolved_at              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notifications ─────────────────────────────────────────────
CREATE TABLE public.notifications (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT,
  type       TEXT,
  data       JSONB DEFAULT '{}',
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_services   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_status_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_photos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_ledger     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;

-- ── Profiles policies ─────────────────────────────────────────
CREATE POLICY "own_profile_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "own_profile_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "own_profile_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "workers_public_select" ON public.profiles
  FOR SELECT USING (role = 'worker' AND is_active = TRUE);

-- ── Worker profiles policies ──────────────────────────────────
CREATE POLICY "verified_workers_public" ON public.worker_profiles
  FOR SELECT USING (is_verified = TRUE);

CREATE POLICY "own_worker_profile_select" ON public.worker_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "own_worker_profile_insert" ON public.worker_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "own_worker_profile_update" ON public.worker_profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── Verification steps ────────────────────────────────────────
CREATE POLICY "own_verification_steps" ON public.verification_steps
  FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "insert_own_verification" ON public.verification_steps
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "update_own_verification" ON public.verification_steps
  FOR UPDATE USING (auth.uid() = worker_id);

-- ── Worker services ───────────────────────────────────────────
CREATE POLICY "own_worker_services_select" ON public.worker_services
  FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "public_worker_services" ON public.worker_services
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "own_worker_services_write" ON public.worker_services
  FOR ALL USING (auth.uid() = worker_id);

-- ── Categories — public read ──────────────────────────────────
CREATE POLICY "categories_public" ON public.categories
  FOR SELECT USING (TRUE);

-- ── Promos — public read ──────────────────────────────────────
CREATE POLICY "promos_public_read" ON public.promos
  FOR SELECT USING (is_active = TRUE);

-- ── Jobs ──────────────────────────────────────────────────────
CREATE POLICY "customer_own_jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "worker_assigned_jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "open_jobs_visible_to_workers" ON public.jobs
  FOR SELECT USING (status IN ('open','bidding'));

CREATE POLICY "customers_create_jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "job_participants_update" ON public.jobs
  FOR UPDATE USING (auth.uid() = customer_id OR auth.uid() = worker_id);

-- ── Messages ──────────────────────────────────────────────────
CREATE POLICY "job_participants_messages_read" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE id = messages.job_id
        AND (customer_id = auth.uid() OR worker_id = auth.uid())
    )
  );

CREATE POLICY "job_participants_messages_write" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE id = messages.job_id
        AND (customer_id = auth.uid() OR worker_id = auth.uid())
    )
  );

-- ── Notifications ─────────────────────────────────────────────
CREATE POLICY "own_notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_notifications_update" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ── Bids ──────────────────────────────────────────────────────
CREATE POLICY "worker_own_bids" ON public.bids
  FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "customer_sees_job_bids" ON public.bids
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.jobs WHERE id = bids.job_id AND customer_id = auth.uid())
  );

CREATE POLICY "workers_create_bids" ON public.bids
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

-- ── Reviews ───────────────────────────────────────────────────
CREATE POLICY "public_reviews" ON public.reviews
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "own_reviews_write" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- ── Disputes ──────────────────────────────────────────────────
CREATE POLICY "dispute_participants_read" ON public.disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE id = disputes.job_id
        AND (customer_id = auth.uid() OR worker_id = auth.uid())
    )
  );

CREATE POLICY "dispute_participants_create" ON public.disputes
  FOR INSERT WITH CHECK (auth.uid() = opened_by);

-- ── Escrow ledger ─────────────────────────────────────────────
CREATE POLICY "own_escrow_read" ON public.escrow_ledger
  FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = worker_id);

-- ── Payouts ───────────────────────────────────────────────────
CREATE POLICY "own_payouts_read" ON public.payouts
  FOR SELECT USING (auth.uid() = worker_id);

-- ════════════════════════════════════════════════════════════
-- Seed Data
-- ════════════════════════════════════════════════════════════

INSERT INTO public.categories (name, icon, display_order) VALUES
  ('Plumber',           '🔧', 1),
  ('Electrician',       '⚡', 2),
  ('Tailor',            '🧵', 3),
  ('AC Repair',         '❄️', 4),
  ('Cleaner',           '🧹', 5),
  ('Mechanic',          '🔩', 6),
  ('Hairstylist',       '💇', 7),
  ('Generator',         '⚙️', 8),
  ('Carpenter',         '🪚', 9),
  ('Painter',           '🖌️', 10),
  ('Mover',             '📦', 11),
  ('Tutor',             '📚', 12),
  ('Laundry',           '👕', 13),
  ('Security',          '🛡️', 14)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.promos (code, description, discount_type, discount_value, max_uses) VALUES
  ('WELCOME2K', 'Welcome offer — ₦2,000 off your first booking', 'fixed', 2000, 10000)
ON CONFLICT (code) DO NOTHING;

-- ── Updated-at trigger function ───────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER worker_profiles_updated_at
  BEFORE UPDATE ON public.worker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
