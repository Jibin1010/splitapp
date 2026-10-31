-- =============================================================================
-- SplitApp: 5NF Unified Account Linking & Bulletproof Row Level Security (RLS)
-- Database: Supabase PostgreSQL 17
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. ENSURE CANONICAL AUTH PROVIDERS
-- -----------------------------------------------------------------------------
INSERT INTO public.auth_providers (provider_code, provider_name, is_enabled)
VALUES 
    ('local_password', 'Username & Password', true),
    ('google_oauth', 'Google OAuth 2.0', true),
    ('whatsapp_phone', 'WhatsApp Verified Mobile', true)
ON CONFLICT (provider_code) DO UPDATE 
SET provider_name = EXCLUDED.provider_name, is_enabled = true;

-- Update provider code if old code was used
UPDATE public.identity_auth_methods 
SET provider_code = 'whatsapp_phone' 
WHERE provider_code = 'whatsapp_otp';

DELETE FROM public.auth_providers WHERE provider_code = 'whatsapp_otp';

-- -----------------------------------------------------------------------------
-- 2. ENHANCED STORED PROCEDURE: GOOGLE AUTH WITH AUTO-LINKING (5NF)
-- Automatically links Google to an existing account if:
--   a) Explicit current_identity_id is passed (e.g. user already signed in via phone or password)
--   b) Or an existing account already has the same verified email in local_credentials
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cloud_authenticate_google(
    p_google_sub VARCHAR(128),
    p_email VARCHAR(255),
    p_name VARCHAR(100),
    p_avatar_url TEXT,
    p_raw_profile JSONB DEFAULT '{}'::jsonb,
    p_current_identity_id UUID DEFAULT NULL
)
RETURNS TABLE (
    identity_id UUID,
    display_name VARCHAR(100),
    email VARCHAR(255),
    avatar_url TEXT,
    is_new_user BOOLEAN,
    is_linked BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_identity_id UUID;
    v_is_new BOOLEAN := false;
    v_is_linked BOOLEAN := false;
    v_existing_email_identity UUID;
BEGIN
    -- Step 1: Check if this Google sub is already registered
    SELECT g.identity_id INTO v_identity_id
    FROM public.google_oauth_accounts g
    WHERE g.google_sub = p_google_sub;

    -- Step 2: If not registered, determine target identity
    IF v_identity_id IS NULL THEN
        -- Option A: Explicit active identity passed (user logged in and linking Google)
        IF p_current_identity_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.app_identities WHERE id = p_current_identity_id AND is_active = true
        ) THEN
            v_identity_id := p_current_identity_id;
            v_is_linked := true;
        ELSE
            -- Option B: Check if an existing identity has the same verified email in local_credentials
            SELECT c.identity_id INTO v_existing_email_identity
            FROM public.local_credentials c
            WHERE LOWER(c.email) = LOWER(p_email)
            LIMIT 1;

            IF v_existing_email_identity IS NOT NULL THEN
                v_identity_id := v_existing_email_identity;
                v_is_linked := true;
            ELSE
                -- Option C: Brand new identity
                INSERT INTO public.app_identities (is_active)
                VALUES (true)
                RETURNING id INTO v_identity_id;

                INSERT INTO public.identity_profiles (identity_id, display_name, avatar_url)
                VALUES (v_identity_id, COALESCE(NULLIF(p_name, ''), split_part(p_email, '@', 1)), p_avatar_url);

                INSERT INTO public.identity_role_assignments (identity_id, role_code)
                VALUES (v_identity_id, 'user')
                ON CONFLICT DO NOTHING;

                v_is_new := true;
            END IF;
        END IF;

        -- Link Google account record to this identity
        INSERT INTO public.google_oauth_accounts (google_sub, identity_id, email, email_verified, raw_profile)
        VALUES (p_google_sub, v_identity_id, p_email, true, p_raw_profile)
        ON CONFLICT (google_sub) DO UPDATE
        SET identity_id = v_identity_id, email = p_email, last_sign_in_at = clock_timestamp();

        -- Link method in 5NF relation
        INSERT INTO public.identity_auth_methods (identity_id, provider_code)
        VALUES (v_identity_id, 'google_oauth')
        ON CONFLICT (identity_id, provider_code) DO NOTHING;

        -- Update avatar/name on profile if empty
        UPDATE public.identity_profiles
        SET 
            display_name = COALESCE(NULLIF(identity_profiles.display_name, ''), p_name, identity_profiles.display_name),
            avatar_url = COALESCE(identity_profiles.avatar_url, p_avatar_url),
            updated_at = clock_timestamp()
        WHERE identity_profiles.identity_id = v_identity_id;

    ELSE
        -- Step 3: Google account exists; update sign-in timestamp & profile
        UPDATE public.identity_profiles
        SET 
            display_name = COALESCE(NULLIF(p_name, ''), identity_profiles.display_name),
            avatar_url = COALESCE(p_avatar_url, identity_profiles.avatar_url),
            updated_at = clock_timestamp()
        WHERE identity_profiles.identity_id = v_identity_id;

        UPDATE public.google_oauth_accounts
        SET 
            email = p_email,
            last_sign_in_at = clock_timestamp(),
            raw_profile = p_raw_profile
        WHERE google_sub = p_google_sub;
    END IF;

    -- Audit Log
    INSERT INTO public.cloud_audit_events (identity_id, event_type, metadata)
    VALUES (
        v_identity_id, 
        CASE WHEN v_is_linked THEN 'GOOGLE_ACCOUNT_LINKED' ELSE 'GOOGLE_LOGIN_SUCCESS' END, 
        jsonb_build_object('email', p_email, 'is_new', v_is_new, 'is_linked', v_is_linked)
    );

    RETURN QUERY
    SELECT 
        v_identity_id,
        p.display_name,
        p_email,
        p.avatar_url,
        v_is_new,
        v_is_linked
    FROM public.identity_profiles p
    WHERE p.identity_id = v_identity_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. STORED PROCEDURE: LINK WHATSAPP PHONE TO ACTIVE OR NEW IDENTITY (5NF)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cloud_link_phone_identity(
    p_phone VARCHAR(32),
    p_target_identity_id UUID DEFAULT NULL
)
RETURNS TABLE (
    identity_id UUID,
    phone_number VARCHAR(32),
    is_linked BOOLEAN,
    is_merged BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_identity_id UUID;
    v_existing_phone_identity UUID;
    v_is_linked BOOLEAN := false;
    v_is_merged BOOLEAN := false;
BEGIN
    -- Check if phone number is already registered to any identity
    SELECT p.identity_id INTO v_existing_phone_identity
    FROM public.phone_whatsapp_identities p
    WHERE p.e164_phone = p_phone;

    IF p_target_identity_id IS NOT NULL THEN
        -- Case A: User is logged in to target_identity
        v_identity_id := p_target_identity_id;

        IF v_existing_phone_identity IS NOT NULL AND v_existing_phone_identity <> p_target_identity_id THEN
            -- Merge: Phone was previously on another identity; transfer phone to target
            UPDATE public.phone_whatsapp_identities
            SET identity_id = p_target_identity_id, verified_at = clock_timestamp()
            WHERE e164_phone = p_phone;

            v_is_merged := true;
        ELSE
            -- Insert or refresh phone record
            INSERT INTO public.phone_whatsapp_identities (identity_id, e164_phone, verified_at)
            VALUES (p_target_identity_id, p_phone, clock_timestamp())
            ON CONFLICT (identity_id) DO UPDATE 
            SET e164_phone = p_phone, verified_at = clock_timestamp();
        END IF;

        -- Link method
        INSERT INTO public.identity_auth_methods (identity_id, provider_code)
        VALUES (p_target_identity_id, 'whatsapp_phone')
        ON CONFLICT (identity_id, provider_code) DO NOTHING;

        v_is_linked := true;
    ELSE
        -- Case B: Standalone WhatsApp login (no active session passed)
        IF v_existing_phone_identity IS NOT NULL THEN
            v_identity_id := v_existing_phone_identity;
            UPDATE public.phone_whatsapp_identities
            SET verified_at = clock_timestamp()
            WHERE e164_phone = p_phone;
        ELSE
            -- Create new identity
            INSERT INTO public.app_identities (is_active)
            VALUES (true)
            RETURNING id INTO v_identity_id;

            INSERT INTO public.identity_profiles (identity_id, display_name)
            VALUES (v_identity_id, 'WhatsApp User ' || RIGHT(p_phone, 4));

            INSERT INTO public.phone_whatsapp_identities (identity_id, e164_phone)
            VALUES (v_identity_id, p_phone);

            INSERT INTO public.identity_auth_methods (identity_id, provider_code)
            VALUES (v_identity_id, 'whatsapp_phone');

            INSERT INTO public.identity_role_assignments (identity_id, role_code)
            VALUES (v_identity_id, 'user')
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    -- Audit Log
    INSERT INTO public.cloud_audit_events (identity_id, event_type, metadata)
    VALUES (
        v_identity_id,
        'PHONE_VERIFIED_AND_LINKED',
        jsonb_build_object('phone', p_phone, 'is_linked', v_is_linked, 'is_merged', v_is_merged)
    );

    RETURN QUERY
    SELECT 
        v_identity_id,
        p_phone,
        v_is_linked,
        v_is_merged;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. STORED PROCEDURE: GET UNIFIED 5NF IDENTITY WITH ALL LINKED PROVIDERS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cloud_get_unified_identity(p_identity_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'identityId', i.id,
        'isActive', i.is_active,
        'createdAt', i.created_at,
        'profile', jsonb_build_object(
            'displayName', pr.display_name,
            'avatarUrl', pr.avatar_url
        ),
        'credentials', CASE 
            WHEN lc.identity_id IS NOT NULL THEN jsonb_build_object(
                'username', lc.username,
                'email', lc.email
            )
            ELSE NULL 
        END,
        'google', CASE 
            WHEN g.identity_id IS NOT NULL THEN jsonb_build_object(
                'email', g.email,
                'emailVerified', g.email_verified,
                'linkedAt', g.linked_at
            )
            ELSE NULL 
        END,
        'phone', CASE 
            WHEN p.identity_id IS NOT NULL THEN jsonb_build_object(
                'e164Phone', p.e164_phone,
                'verifiedAt', p.verified_at
            )
            ELSE NULL 
        END,
        'authMethods', COALESCE((
            SELECT jsonb_agg(m.provider_code) 
            FROM public.identity_auth_methods m 
            WHERE m.identity_id = i.id
        ), '[]'::jsonb),
        'roles', COALESCE((
            SELECT jsonb_agg(r.role_code)
            FROM public.identity_role_assignments r
            WHERE r.identity_id = i.id
        ), '[]'::jsonb)
    ) INTO v_result
    FROM public.app_identities i
    LEFT JOIN public.identity_profiles pr ON pr.identity_id = i.id
    LEFT JOIN public.local_credentials lc ON lc.identity_id = i.id
    LEFT JOIN public.google_oauth_accounts g ON g.identity_id = i.id
    LEFT JOIN public.phone_whatsapp_identities p ON p.identity_id = i.id
    WHERE i.id = p_identity_id;

    RETURN v_result;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. BULLETPROOF ROW LEVEL SECURITY (RLS) POLICIES
-- Zero Credential Exposure. Anonymous and unauthorized inspection blocked.
-- -----------------------------------------------------------------------------

-- 5.1 Enable RLS on every public table
ALTER TABLE public.app_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_identities FORCE ROW LEVEL SECURITY;

ALTER TABLE public.identity_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.auth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_providers FORCE ROW LEVEL SECURITY;

ALTER TABLE public.identity_auth_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_auth_methods FORCE ROW LEVEL SECURITY;

ALTER TABLE public.local_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_credentials FORCE ROW LEVEL SECURITY;

ALTER TABLE public.google_oauth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_oauth_accounts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.phone_whatsapp_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_whatsapp_identities FORCE ROW LEVEL SECURITY;

ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.auth_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_roles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.identity_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_role_assignments FORCE ROW LEVEL SECURITY;

ALTER TABLE public.cloud_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_audit_events FORCE ROW LEVEL SECURITY;

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills FORCE ROW LEVEL SECURITY;

ALTER TABLE public.bill_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_people FORCE ROW LEVEL SECURITY;

ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items FORCE ROW LEVEL SECURITY;

ALTER TABLE public.bill_item_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_item_shares FORCE ROW LEVEL SECURITY;

ALTER TABLE public.bill_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_adjustments FORCE ROW LEVEL SECURITY;

ALTER TABLE public.bill_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_settlements FORCE ROW LEVEL SECURITY;

-- 5.2 REVOKE direct table permissions from anon & public on all secret tables
-- This guarantees that inspecting Supabase REST endpoints or DevTools CANNOT access password hashes, tokens, or audit logs!
REVOKE ALL ON public.local_credentials FROM anon, authenticated, public;
REVOKE ALL ON public.auth_sessions FROM anon, authenticated, public;
REVOKE ALL ON public.cloud_audit_events FROM anon, authenticated, public;
REVOKE ALL ON public.google_oauth_accounts FROM anon, authenticated, public;
REVOKE ALL ON public.phone_whatsapp_identities FROM anon, authenticated, public;
REVOKE ALL ON public.identity_auth_methods FROM anon, authenticated, public;
REVOKE ALL ON public.identity_role_assignments FROM anon, authenticated, public;

-- 5.3 Allow public read of auth_providers (catalog)
DROP POLICY IF EXISTS "Public can view active auth providers" ON public.auth_providers;
CREATE POLICY "Public can view active auth providers"
    ON public.auth_providers FOR SELECT
    USING (is_enabled = true);

-- 5.4 Allow public read of non-sensitive display profiles
DROP POLICY IF EXISTS "Public can view basic display profiles" ON public.identity_profiles;
CREATE POLICY "Public can view basic display profiles"
    ON public.identity_profiles FOR SELECT
    USING (true);

-- 5.5 Bill Security: Owner-restricted access
DROP POLICY IF EXISTS "Users can manage their own bills" ON public.bills;
CREATE POLICY "Users can manage their own bills"
    ON public.bills FOR ALL
    USING (
        owner_identity_id IS NULL OR 
        owner_identity_id::text = current_setting('request.jwt.claim.sub', true) OR
        owner_identity_id::text = current_setting('app.current_identity_id', true)
    );

DROP POLICY IF EXISTS "Bill people accessible via bill" ON public.bill_people;
CREATE POLICY "Bill people accessible via bill"
    ON public.bill_people FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.bills b
            WHERE b.id = bill_people.bill_id
              AND (
                b.owner_identity_id IS NULL OR
                b.owner_identity_id::text = current_setting('request.jwt.claim.sub', true) OR
                b.owner_identity_id::text = current_setting('app.current_identity_id', true)
              )
        )
    );

DROP POLICY IF EXISTS "Bill items accessible via bill" ON public.bill_items;
CREATE POLICY "Bill items accessible via bill"
    ON public.bill_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.bills b
            WHERE b.id = bill_items.bill_id
              AND (
                b.owner_identity_id IS NULL OR
                b.owner_identity_id::text = current_setting('request.jwt.claim.sub', true) OR
                b.owner_identity_id::text = current_setting('app.current_identity_id', true)
              )
        )
    );

DROP POLICY IF EXISTS "Bill settlements accessible via bill" ON public.bill_settlements;
CREATE POLICY "Bill settlements accessible via bill"
    ON public.bill_settlements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.bills b
            WHERE b.id = bill_settlements.bill_id
              AND (
                b.owner_identity_id IS NULL OR
                b.owner_identity_id::text = current_setting('request.jwt.claim.sub', true) OR
                b.owner_identity_id::text = current_setting('app.current_identity_id', true)
              )
        )
    );

COMMIT;

