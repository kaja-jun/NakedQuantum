-- NakedQuantum delta sync table (matches app.js handleSync)
-- Run in Supabase SQL editor. Table name MUST be nq_sync (not sync_discourses).

CREATE TABLE IF NOT EXISTS public.nq_sync (
  id text NOT NULL,
  user_id text NOT NULL,
  store text NOT NULL,
  updated_at bigint NOT NULL DEFAULT 0,
  deleted_at bigint,
  data_enc text,
  PRIMARY KEY (id, user_id, store)
);

CREATE INDEX IF NOT EXISTS nq_sync_user_updated_idx
  ON public.nq_sync (user_id, updated_at);

ALTER TABLE public.nq_sync ENABLE ROW LEVEL SECURITY;

-- Personal-vault model: anon key in PWA; tighten later if you add Supabase Auth.
DROP POLICY IF EXISTS nq_sync_anon_all ON public.nq_sync;
CREATE POLICY nq_sync_anon_all ON public.nq_sync
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);
