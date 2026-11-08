-- ============================================================================
-- Migration: Enable Row Level Security (RLS) for Vault Tables
-- Fixes: "UNRESTRICTED" warning badge on bill_vault_files & bill_vault_keys in Supabase
-- ============================================================================

BEGIN;

-- 1. Enable Row Level Security (RLS) on vault tables
ALTER TABLE public.bill_vault_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_vault_files FORCE ROW LEVEL SECURITY;

ALTER TABLE public.bill_vault_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_vault_keys FORCE ROW LEVEL SECURITY;

-- 2. Revoke direct table permissions from anon, authenticated, and public
-- Decryption keys must NEVER be accessible via direct client-side Supabase REST/GraphQL queries.
-- Decryption key resolution is strictly mediated by the backend /api/vault/key endpoint.
REVOKE ALL ON public.bill_vault_keys FROM anon, authenticated, public;
REVOKE ALL ON public.bill_vault_files FROM anon, authenticated, public;

-- 3. Define explicit RLS policies

-- 3.1 Bill Vault Files: Accessible only when associated bill is accessible
DROP POLICY IF EXISTS "Vault files accessible via bill access" ON public.bill_vault_files;
CREATE POLICY "Vault files accessible via bill access"
    ON public.bill_vault_files FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.bills b
            WHERE b.id = bill_vault_files.bill_id
              AND (
                b.owner_identity_id IS NULL OR
                b.owner_identity_id::text = current_setting('request.jwt.claim.sub', true) OR
                b.owner_identity_id::text = current_setting('app.current_identity_id', true)
              )
        )
    );

-- 3.2 Bill Vault Keys: Server / service_role mediated only
DROP POLICY IF EXISTS "Strict server-only vault keys" ON public.bill_vault_keys;
CREATE POLICY "Strict server-only vault keys"
    ON public.bill_vault_keys FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMIT;

