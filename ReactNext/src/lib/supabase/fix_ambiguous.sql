-- =============================================================================
-- Fix Ambiguous Column References in 5NF Stored Procedures
-- Using #variable_conflict use_column & explicit table qualifications
-- =============================================================================

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
#variable_conflict use_column
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
        SET identity_id = EXCLUDED.identity_id, 
            email = EXCLUDED.email, 
            last_sign_in_at = clock_timestamp();

        -- Link method in 5NF relation
        INSERT INTO public.identity_auth_methods (identity_id, provider_code)
        VALUES (v_identity_id, 'google_oauth')
        ON CONFLICT (identity_id, provider_code) DO NOTHING;

        -- Update avatar/name on profile if empty
        UPDATE public.identity_profiles ip
        SET 
            display_name = COALESCE(NULLIF(ip.display_name, ''), p_name, ip.display_name),
            avatar_url = COALESCE(ip.avatar_url, p_avatar_url),
            updated_at = clock_timestamp()
        WHERE ip.identity_id = v_identity_id;

    ELSE
        -- Step 3: Google account exists; update sign-in timestamp & profile
        UPDATE public.identity_profiles ip
        SET 
            display_name = COALESCE(NULLIF(p_name, ''), ip.display_name),
            avatar_url = COALESCE(p_avatar_url, ip.avatar_url),
            updated_at = clock_timestamp()
        WHERE ip.identity_id = v_identity_id;

        UPDATE public.google_oauth_accounts goa
        SET 
            email = p_email,
            last_sign_in_at = clock_timestamp(),
            raw_profile = p_raw_profile
        WHERE goa.google_sub = p_google_sub;
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
#variable_conflict use_column
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
            UPDATE public.phone_whatsapp_identities pwi
            SET identity_id = p_target_identity_id, verified_at = clock_timestamp()
            WHERE pwi.e164_phone = p_phone;

            v_is_merged := true;
        ELSE
            -- Insert or refresh phone record
            INSERT INTO public.phone_whatsapp_identities (identity_id, e164_phone, verified_at)
            VALUES (p_target_identity_id, p_phone, clock_timestamp())
            ON CONFLICT (identity_id) DO UPDATE 
            SET e164_phone = EXCLUDED.e164_phone, verified_at = clock_timestamp();
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
            UPDATE public.phone_whatsapp_identities pwi
            SET verified_at = clock_timestamp()
            WHERE pwi.e164_phone = p_phone;
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

