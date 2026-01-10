-- SUPABASE_POLICIES.sql
-- Run these in the Supabase SQL editor to enable RLS and add policies for the new tables.

-- DECISIONS TABLE RLS & POLICIES
ALTER TABLE IF EXISTS public.decisions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to INSERT decisions only if user_id matches their auth UID
DROP POLICY IF EXISTS "Allow insert own decisions" ON public.decisions;
CREATE POLICY "Allow insert own decisions" ON public.decisions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to SELECT only their own decisions
DROP POLICY IF EXISTS "Allow select own decisions" ON public.decisions;
CREATE POLICY "Allow select own decisions" ON public.decisions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow owners to UPDATE their own decisions
DROP POLICY IF EXISTS "Allow update own decisions" ON public.decisions;
CREATE POLICY "Allow update own decisions" ON public.decisions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow owners to DELETE their own decisions
DROP POLICY IF EXISTS "Allow delete own decisions" ON public.decisions;
CREATE POLICY "Allow delete own decisions" ON public.decisions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- DECISION_DOCUMENTS TABLE RLS & POLICIES
ALTER TABLE IF EXISTS public.decision_documents ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to INSERT document metadata only if user_id matches their auth UID
DROP POLICY IF EXISTS "Allow insert own docs" ON public.decision_documents;
CREATE POLICY "Allow insert own docs" ON public.decision_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to SELECT documents that belong to them
DROP POLICY IF EXISTS "Allow select own docs" ON public.decision_documents;
CREATE POLICY "Allow select own docs" ON public.decision_documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow owners to UPDATE their documents (e.g., to populate extracted_text)
DROP POLICY IF EXISTS "Allow update own docs" ON public.decision_documents;
CREATE POLICY "Allow update own docs" ON public.decision_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow owners to DELETE their documents
DROP POLICY IF EXISTS "Allow delete own docs" ON public.decision_documents;
CREATE POLICY "Allow delete own docs" ON public.decision_documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- NOTE:
-- If your Edge Function uses the SUPABASE_SERVICE_ROLE_KEY to update documents, those updates bypass RLS (service role has full access).
-- Make sure you keep the service role key secret and only use it in trusted server-side environments (Edge Functions or your backend).
