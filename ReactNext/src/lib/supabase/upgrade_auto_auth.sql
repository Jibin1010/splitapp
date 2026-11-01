-- =============================================================================
-- Upgrade cloud_register_local: Seamless Auto-Creation & Linking for Connected Users
-- =============================================================================

CREATE OR REPLACE FUNCTION public.cloud_register_local(
    p_username VARCHAR(64),
    p_email VARCHAR(255),
    p_display_name VARCHAR(100),
    p_password_hash VARCHAR(255),
    p_password_salt VARCHAR(64),
    p_target_identity_id UUID DEFAULT NULL
)
RETURNS TABLE (
    identity_id UUID,
    username VARCHAR(64),
    email VARCHAR(255),
    display_name VARCHAR(100),
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
    v_existing_cred_identity UUID;
BEGIN
    -- Check if credentials already exist for this email or username
    SELECT lc.identity_id INTO v_existing_cred_identity
    FROM public.local_credentials lc
    WHERE LOWER(lc.email) = LOWER(p_email) OR LOWER(lc.username) = LOWER(p_username)
    LIMIT 1;

    IF v_existing_cred_identity IS NOT NULL THEN
        -- If already linked to target identity, update credentials
        IF p_target_identity_id IS NOT NULL AND v_existing_cred_identity = p_target_identity_id THEN
            UPDATE public.local_credentials lc
            SET password_hash = p_password_hash,
                password_salt = p_password_salt,
                failed_login_attempts = 0,
                locked_until = NULL,
                updated_at = clock_timestamp()
            WHERE lc.identity_id = p_target_identity_id;
            v_identity_id := p_target_identity_id;
            v_is_linked := true;
        ELSE
            -- Return existing identity
            v_identity_id := v_existing_cred_identity;
        END IF;
    ELSIF p_target_identity_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.app_identities WHERE id = p_target_identity_id AND is_active = true
    ) THEN
        -- User is already connected (e.g. Google or WhatsApp), link local credentials to active identity
        v_identity_id := p_target_identity_id;
        v_is_linked := true;

        INSERT INTO public.local_credentials (identity_id, username, email, password_hash, password_salt)
        VALUES (v_identity_id, p_username, p_email, p_password_hash, p_password_salt)
        ON CONFLICT (identity_id) DO UPDATE
        SET username = EXCLUDED.username,
            email = EXCLUDED.email,
            password_hash = EXCLUDED.password_hash,
            password_salt = EXCLUDED.password_salt,
            updated_at = clock_timestamp();

        INSERT INTO public.identity_auth_methods (identity_id, provider_code)
        VALUES (v_identity_id, 'local_password')
        ON CONFLICT (identity_id, provider_code) DO NOTHING;

        -- Update display name if empty
        UPDATE public.identity_profiles ip
        SET display_name = COALESCE(NULLIF(ip.display_name, ''), p_display_name, ip.display_name),
            updated_at = clock_timestamp()
        WHERE ip.identity_id = v_identity_id;
    ELSE
        -- Brand new identity
        INSERT INTO public.app_identities (is_active)
        VALUES (true)
        RETURNING id INTO v_identity_id;

        INSERT INTO public.identity_profiles (identity_id, display_name)
        VALUES (v_identity_id, COALESCE(NULLIF(p_display_name, ''), p_username));

        INSERT INTO public.identity_auth_methods (identity_id, provider_code)
        VALUES (v_identity_id, 'local_password');

        INSERT INTO public.local_credentials (identity_id, username, email, password_hash, password_salt)
        VALUES (v_identity_id, p_username, p_email, p_password_hash, p_password_salt);

        INSERT INTO public.identity_role_assignments (identity_id, role_code)
        VALUES (v_identity_id, 'user')
        ON CONFLICT DO NOTHING;

        v_is_new := true;
    END IF;

    -- Audit log
    INSERT INTO public.cloud_audit_events (identity_id, event_type, metadata)
    VALUES (
        v_identity_id,
        CASE WHEN v_is_linked THEN 'LOCAL_CREDENTIALS_LINKED' ELSE 'LOCAL_REGISTER_SUCCESS' END,
        jsonb_build_object('username', p_username, 'email', p_email, 'is_new', v_is_new, 'is_linked', v_is_linked)
    );

    RETURN QUERY
    SELECT 
        v_identity_id,
        p_username,
        p_email,
        p.display_name,
        v_is_new,
        v_is_linked
    FROM public.identity_profiles p
    WHERE p.identity_id = v_identity_id;
END;
$$;

