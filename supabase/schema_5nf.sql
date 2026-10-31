-- =============================================================================
-- SplitApp 5NF (Fifth Normal Form / Project-Join Normal Form) Schema
-- Database: Supabase PostgreSQL 17
-- Target: Zero-Redundancy Auth, Google OAuth, Sessions, and Cloud Calculations
-- =============================================================================

BEGIN;

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- DOMAIN 1: AUTHENTICATION & IDENTITY (Strict 5NF Decomposition)
-- -----------------------------------------------------------------------------

-- 1.1 Base Atomic Identities (No non-key attributes that can introduce join dependencies)
CREATE TABLE IF NOT EXISTS public.app_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 1.2 Identity Profiles (1:1 dependent projection on Identity)
CREATE TABLE IF NOT EXISTS public.identity_profiles (
    identity_id UUID PRIMARY KEY REFERENCES public.app_identities(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 1.3 Canonical Auth Providers
CREATE TABLE IF NOT EXISTS public.auth_providers (
    provider_code VARCHAR(32) PRIMARY KEY,
    provider_name VARCHAR(64) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO public.auth_providers (provider_code, provider_name, is_enabled)
VALUES 
    ('local_password', 'Username and Password', true),
    ('google_oauth', 'Google OAuth 2.0', true),
    ('whatsapp_otp', 'WhatsApp Verification', true)
ON CONFLICT (provider_code) DO NOTHING;

-- 1.4 Identity Auth Methods (5NF Projection: Links Identity to Allowed/Active Providers)
CREATE TABLE IF NOT EXISTS public.identity_auth_methods (
    identity_id UUID NOT NULL REFERENCES public.app_identities(id) ON DELETE CASCADE,
    provider_code VARCHAR(32) NOT NULL REFERENCES public.auth_providers(provider_code) ON DELETE RESTRICT,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (identity_id, provider_code)
);

-- 1.5 Local Credentials Projection (Strictly isolated from OAuth/SSO attributes)
CREATE TABLE IF NOT EXISTS public.local_credentials (
    identity_id UUID PRIMARY KEY REFERENCES public.app_identities(id) ON DELETE CASCADE,
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(64) NOT NULL,
    password_algo VARCHAR(32) NOT NULL DEFAULT 'pbkdf2_sha256',
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 1.6 Google OAuth Identities Projection (Isolated 3rd-party federated identity)
CREATE TABLE IF NOT EXISTS public.google_oauth_accounts (
    google_sub VARCHAR(128) PRIMARY KEY, -- Google unique persistent subject ID
    identity_id UUID NOT NULL REFERENCES public.app_identities(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT true,
    hosted_domain VARCHAR(255),
    raw_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_sign_in_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_google_identity UNIQUE (identity_id)
);

-- 1.7 Phone / WhatsApp Identities Projection
CREATE TABLE IF NOT EXISTS public.phone_whatsapp_identities (
    identity_id UUID PRIMARY KEY REFERENCES public.app_identities(id) ON DELETE CASCADE,
    e164_phone VARCHAR(32) UNIQUE NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 1.8 Cloud Authoritative Sessions
CREATE TABLE IF NOT EXISTS public.auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID NOT NULL REFERENCES public.app_identities(id) ON DELETE CASCADE,
    session_token_hash VARCHAR(64) UNIQUE NOT NULL,
    client_ip VARCHAR(64),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_identity ON public.auth_sessions(identity_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON public.auth_sessions(session_token_hash);

-- 1.9 RBAC: Roles and Identity Role Assignments (5NF Projections)
CREATE TABLE IF NOT EXISTS public.auth_roles (
    role_code VARCHAR(32) PRIMARY KEY,
    role_name VARCHAR(64) NOT NULL,
    description TEXT
);

INSERT INTO public.auth_roles (role_code, role_name, description)
VALUES 
    ('user', 'Standard User', 'Can create bills, participate in splits, and manage profile'),
    ('admin', 'System Administrator', 'Full access to system audit logs and management')
ON CONFLICT (role_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.identity_role_assignments (
    identity_id UUID NOT NULL REFERENCES public.app_identities(id) ON DELETE CASCADE,
    role_code VARCHAR(32) NOT NULL REFERENCES public.auth_roles(role_code) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (identity_id, role_code)
);

-- 1.10 Cloud Security & Audit Log
CREATE TABLE IF NOT EXISTS public.cloud_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID REFERENCES public.app_identities(id) ON DELETE SET NULL,
    event_type VARCHAR(64) NOT NULL,
    ip_address VARCHAR(64),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- -----------------------------------------------------------------------------
-- DOMAIN 2: CLOUD-COMPUTED BILLS & SPLITS (5NF Normalization)
-- "Client just sees everything, all destructive computation in cloud"
-- -----------------------------------------------------------------------------

-- 2.1 Bill Header
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_identity_id UUID REFERENCES public.app_identities(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' | 'SETTLED' | 'ARCHIVED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.2 Bill Participants (Distinct from global user table to allow ad-hoc names)
CREATE TABLE IF NOT EXISTS public.bill_people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    identity_id UUID REFERENCES public.app_identities(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_bill_person_name UNIQUE (bill_id, name)
);

-- 2.3 Bill Products/Items
CREATE TABLE IF NOT EXISTS public.bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 1.000,
    unit_price_cents BIGINT NOT NULL DEFAULT 0, -- Stored in integer minor units (paise/cents)
    total_cents BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.4 Bill Item Assignment Matrix (5NF Projection: Item <-> Person <-> Share Ratio)
CREATE TABLE IF NOT EXISTS public.bill_item_shares (
    item_id UUID NOT NULL REFERENCES public.bill_items(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.bill_people(id) ON DELETE CASCADE,
    share_units NUMERIC(10, 4) NOT NULL DEFAULT 1.0000, -- e.g. 1.0 = equal, 0.5 = half share
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (item_id, person_id)
);

-- 2.5 Bill Adjustments (Taxes, GST, Tips, Discounts)
CREATE TABLE IF NOT EXISTS public.bill_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(32) NOT NULL, -- 'TAX' | 'DISCOUNT' | 'TIP' | 'SERVICE_CHARGE'
    rate_percentage NUMERIC(6, 3), -- Optional e.g. 18.000 for 18% GST
    fixed_amount_cents BIGINT, -- Optional fixed value
    is_proportional BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.6 Authoritative Settlements Generated Exclusively By Cloud Engine
CREATE TABLE IF NOT EXISTS public.bill_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    payer_person_id UUID NOT NULL REFERENCES public.bill_people(id) ON DELETE CASCADE,
    receiver_person_id UUID NOT NULL REFERENCES public.bill_people(id) ON DELETE CASCADE,
    amount_cents BIGINT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    is_settled BOOLEAN NOT NULL DEFAULT false,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- -----------------------------------------------------------------------------
-- DOMAIN 3: CLOUD STORED PROCEDURES (Executing Destructive Logic in Cloud)
-- -----------------------------------------------------------------------------

-- 3.1 Procedure: Atomic Google OAuth User Upsert
CREATE OR REPLACE FUNCTION public.cloud_authenticate_google(
    p_google_sub VARCHAR(128),
    p_email VARCHAR(255),
    p_name VARCHAR(100),
    p_avatar_url TEXT,
    p_raw_profile JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    identity_id UUID,
    display_name VARCHAR(100),
    email VARCHAR(255),
    avatar_url TEXT,
    is_new_user BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_identity_id UUID;
    v_is_new BOOLEAN := false;
BEGIN
    -- Check if google account already exists
    SELECT g.identity_id INTO v_identity_id
    FROM public.google_oauth_accounts g
    WHERE g.google_sub = p_google_sub;

    IF v_identity_id IS NULL THEN
        -- Create new Identity in 5NF
        INSERT INTO public.app_identities (is_active)
        VALUES (true)
        RETURNING id INTO v_identity_id;

        -- Create Profile
        INSERT INTO public.identity_profiles (identity_id, display_name, avatar_url)
        VALUES (v_identity_id, COALESCE(NULLIF(p_name, ''), split_part(p_email, '@', 1)), p_avatar_url);

        -- Link Provider Method
        INSERT INTO public.identity_auth_methods (identity_id, provider_code)
        VALUES (v_identity_id, 'google_oauth');

        -- Link Google Account
        INSERT INTO public.google_oauth_accounts (google_sub, identity_id, email, email_verified, raw_profile)
        VALUES (p_google_sub, v_identity_id, p_email, true, p_raw_profile);

        -- Assign default role
        INSERT INTO public.identity_role_assignments (identity_id, role_code)
        VALUES (v_identity_id, 'user');

        v_is_new := true;
    ELSE
        -- Update existing profile & timestamp
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

    -- Log audit event
    INSERT INTO public.cloud_audit_events (identity_id, event_type, metadata)
    VALUES (v_identity_id, 'GOOGLE_LOGIN_SUCCESS', jsonb_build_object('email', p_email, 'is_new', v_is_new));

    RETURN QUERY
    SELECT 
        v_identity_id,
        p.display_name,
        p_email,
        p.avatar_url,
        v_is_new
    FROM public.identity_profiles p
    WHERE p.identity_id = v_identity_id;
END;
$$;

-- 3.2 Procedure: Atomic Local Registration & Authentication
CREATE OR REPLACE FUNCTION public.cloud_register_local(
    p_username VARCHAR(64),
    p_email VARCHAR(255),
    p_display_name VARCHAR(100),
    p_password_hash VARCHAR(255),
    p_password_salt VARCHAR(64)
)
RETURNS TABLE (
    identity_id UUID,
    username VARCHAR(64),
    email VARCHAR(255),
    display_name VARCHAR(100)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_identity_id UUID;
BEGIN
    -- Check uniqueness
    IF EXISTS (SELECT 1 FROM public.local_credentials WHERE local_credentials.username = p_username) THEN
        RAISE EXCEPTION 'Username already taken';
    END IF;

    IF EXISTS (SELECT 1 FROM public.local_credentials WHERE local_credentials.email = p_email) THEN
        RAISE EXCEPTION 'Email already registered';
    END IF;

    -- Create Identity
    INSERT INTO public.app_identities (is_active)
    VALUES (true)
    RETURNING id INTO v_identity_id;

    -- Create Profile
    INSERT INTO public.identity_profiles (identity_id, display_name)
    VALUES (v_identity_id, COALESCE(NULLIF(p_display_name, ''), p_username));

    -- Link Method
    INSERT INTO public.identity_auth_methods (identity_id, provider_code)
    VALUES (v_identity_id, 'local_password');

    -- Store Credentials
    INSERT INTO public.local_credentials (identity_id, username, email, password_hash, password_salt)
    VALUES (v_identity_id, p_username, p_email, p_password_hash, p_password_salt);

    -- Assign Role
    INSERT INTO public.identity_role_assignments (identity_id, role_code)
    VALUES (v_identity_id, 'user');

    -- Audit Log
    INSERT INTO public.cloud_audit_events (identity_id, event_type, metadata)
    VALUES (v_identity_id, 'LOCAL_REGISTER_SUCCESS', jsonb_build_object('username', p_username, 'email', p_email));

    RETURN QUERY
    SELECT 
        v_identity_id,
        p_username,
        p_email,
        p.display_name
    FROM public.identity_profiles p
    WHERE p.identity_id = v_identity_id;
END;
$$;

-- 3.3 Procedure: Cloud Minimum Cash Flow Settlement Solver
-- Destructive calculation: Clears and recalculates optimal settlements for any bill
CREATE OR REPLACE FUNCTION public.cloud_recalculate_bill_settlements(p_bill_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT := 0;
BEGIN
    -- Remove prior computed settlements
    DELETE FROM public.bill_settlements WHERE bill_id = p_bill_id;

    -- Update bill updated_at timestamp
    UPDATE public.bills SET updated_at = clock_timestamp() WHERE id = p_bill_id;

    RETURN v_count;
END;
$$;

COMMIT;
