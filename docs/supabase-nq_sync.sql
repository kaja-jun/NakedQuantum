-- NakedQuantum delta sync table (matches app.js handleSync)
-- Run in Supabase SQL editor. Table name MUST be nq_sync (not sync_discourses).
--
-- Cloud `id` is namespaced: store::localId (e.g. cosm_discourses::d_1734...)
-- so discourse id d_x and guardian_summaries id d_x never collide on upsert.

CREATE TABLE IF NOT EXISTS public.nq_sync (
  id text NOT NULL,
  user_id text NOT NULL,
  store text NOT NULL,
  updated_at bigint NOT NULL DEFAULT 0,
  deleted_at bigint,
  data_enc text,
  PRIMARY KEY (id, user_id, store)
);

-- If you created an older table with PRIMARY KEY (id) only, migrate:
-- ALTER TABLE public.nq_sync ADD COLUMN IF NOT EXISTS store text;
-- UPDATE public.nq_sync SET store = split_part(id, '::', 1) WHERE store IS NULL AND id LIKE '%::%';
-- Then dedupe and re-key before changing PK (or truncate and re-sync from device).

CREATE INDEX IF NOT EXISTS nq_sync_user_updated_idx
  ON public.nq_sync (user_id, updated_at);

ALTER TABLE public.nq_sync ENABLE ROW LEVEL SECURITY;

-- Personal-vault model: anon key in PWA; tighten later if you add Supabase Auth.
DROP POLICY IF EXISTS nq_sync_anon_all ON public.nq_sync;
CREATE POLICY nq_sync_anon_all ON public.nq_sync
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);
