-- Deployment script for UnboxdNFT database functions
-- Run this in your Supabase SQL Editor to fix all database issues

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENSURE TABLES EXIST (definitions based on all_supabase_tables.txt)
-- =====================================================

-- Users table (as per user's schema)
CREATE TABLE IF NOT EXISTS public.users (
  id serial not null,
  telegram_id bigint not null,
  username character varying(255) null,
  first_name character varying(255) null,
  last_name character varying(255) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint users_pkey primary key (id),
  constraint users_telegram_id_key unique (telegram_id)
);

-- Balances table (as per user's schema)
CREATE TABLE IF NOT EXISTS public.balances (
  id serial not null,
  user_id integer not null,
  amount numeric(15, 2) not null default 0,
  updated_at timestamp with time zone null default now(),
  constraint balances_pkey primary key (id),
  constraint balances_user_id_key unique (user_id),
  constraint balances_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
);

-- User Stats table (as per user's schema)
CREATE TABLE IF NOT EXISTS public.user_stats (
  id serial not null,
  user_id integer not null,
  nft_count integer not null default 0,
  cases_opened integer not null default 0,
  legendary_count integer not null default 0,
  updated_at timestamp with time zone null default now(),
  constraint user_stats_pkey primary key (id),
  constraint user_stats_user_id_key unique (user_id),
  constraint user_stats_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
);

-- User inventory table
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id serial not null,
  telegram_id bigint not null, -- Should ideally FK to users.telegram_id, ensure this constraint exists if not already
  skin_name character varying(255) not null,
  skin_image character varying(255) not null,
  skin_tier integer not null,
  acquired_date timestamp with time zone null default now(),
  unique_id uuid null default gen_random_uuid (),
  constraint user_inventory_pkey primary key (id),
  constraint user_inventory_unique_id_key unique (unique_id)
  -- Assuming: constraint fk_user foreign KEY (telegram_id) references users (telegram_id)
);

-- Reward claims table (for daily rewards tracking)
CREATE TABLE IF NOT EXISTS public.reward_claims (
  id serial not null,
  telegram_id bigint not null,
  claim_time timestamp with time zone not null default now(),
  amount integer not null,
  next_available_time timestamp with time zone not null,
  constraint reward_claims_pkey primary key (id)
);

-- =====================================================
-- DROP EXISTING FUNCTIONS (for clean reinstall)
-- =====================================================

DROP FUNCTION IF EXISTS add_user_with_balance(BIGINT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_balance(BIGINT);
DROP FUNCTION IF EXISTS update_balance(BIGINT, NUMERIC, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_user_inventory(BIGINT);
DROP FUNCTION IF EXISTS add_skin_to_inventory(BIGINT, TEXT, TEXT, INT);
DROP FUNCTION IF EXISTS remove_skin_from_inventory(BIGINT, UUID);
DROP FUNCTION IF EXISTS get_user_stats(BIGINT);
DROP FUNCTION IF EXISTS check_reward_availability(BIGINT);
DROP FUNCTION IF EXISTS claim_reward(BIGINT, INT);
DROP FUNCTION IF EXISTS add_coins_to_user(BIGINT, NUMERIC);

-- =====================================================
-- CREATE ESSENTIAL FUNCTIONS (Revised for new schema)
-- =====================================================

-- Function: add_user_with_balance
-- Creates a user if not exists, and ensures balance/stats records are created.
CREATE OR REPLACE FUNCTION add_user_with_balance(
    p_telegram_id BIGINT,
    p_username TEXT DEFAULT '',
    p_first_name TEXT DEFAULT '',
    p_last_name TEXT DEFAULT ''
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id INTEGER;
    v_initial_balance NUMERIC(15,2) := 1000.00;
BEGIN
    -- Insert user or update if already exists
    INSERT INTO public.users (telegram_id, username, first_name, last_name)
    VALUES (p_telegram_id, p_username, p_first_name, p_last_name)
    ON CONFLICT (telegram_id) 
    DO UPDATE SET 
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW()
    RETURNING id INTO v_user_id;

    -- Ensure a balance record exists for the user
    INSERT INTO public.balances (user_id, amount)
    VALUES (v_user_id, v_initial_balance)
    ON CONFLICT (user_id) DO NOTHING;

    -- Ensure a user_stats record exists for the user
    INSERT INTO public.user_stats (user_id, nft_count, cases_opened, legendary_count)
    VALUES (v_user_id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN v_user_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in add_user_with_balance: %', SQLERRM;
        RETURN NULL;
END;
$$;

-- Function: get_balance
-- Fetches balance from the 'balances' table.
CREATE OR REPLACE FUNCTION get_balance(
    p_telegram_id BIGINT
) RETURNS NUMERIC(15,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_balance NUMERIC(15,2);
    v_user_id INTEGER;
BEGIN
    SELECT id INTO v_user_id FROM public.users WHERE telegram_id = p_telegram_id;

    IF v_user_id IS NULL THEN
        -- Optionally create user here if not expected to exist, or return 0
        -- For now, assume user should exist from add_user_with_balance call
        RETURN 0.00;
    END IF;

    SELECT amount INTO v_balance
    FROM public.balances
    WHERE user_id = v_user_id;
    
    RETURN COALESCE(v_balance, 0.00);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_balance: %', SQLERRM;
        RETURN 0.00;
END;
$$;

-- Function: add_coins_to_user (Helper for updating balance, similar to update_balance)
-- Updates balance in the 'balances' table.
CREATE OR REPLACE FUNCTION add_coins_to_user(
    p_telegram_id BIGINT,
    p_amount NUMERIC(15,2) -- Changed p_amount_to_add to p_amount
) RETURNS NUMERIC(15,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_balance NUMERIC(15,2);
    v_user_id INTEGER;
BEGIN
    SELECT id INTO v_user_id FROM public.users WHERE telegram_id = p_telegram_id;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User with telegram_id % not found for add_coins_to_user', p_telegram_id;
        RETURN 0.00; -- Or handle as an error
    END IF;

    UPDATE public.balances
    SET amount = amount + p_amount, -- Use p_amount here
        updated_at = NOW()
    WHERE user_id = v_user_id
    RETURNING amount INTO v_new_balance;
    
    IF v_new_balance IS NULL THEN
       -- This case should ideally not happen if user_id was found and balance record exists.
       -- Consider inserting a balance record if it's missing, though add_user_with_balance should handle this.
       RAISE NOTICE 'Balance record not found or not updated for user_id %', v_user_id;
       RETURN COALESCE((SELECT amount FROM public.balances WHERE user_id = v_user_id), 0.00);
    END IF;

    RETURN v_new_balance;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in add_coins_to_user: %', SQLERRM;
        RETURN COALESCE((SELECT b.amount FROM public.balances b JOIN public.users u ON u.id = b.user_id WHERE u.telegram_id = p_telegram_id), 0.00);
END;
$$;


-- Function: update_balance (More generic, can be used for debits too)
-- Updates balance in the 'balances' table.
CREATE OR REPLACE FUNCTION update_balance(
    p_telegram_id BIGINT,
    p_amount_change NUMERIC(15,2), -- Changed to NUMERIC
    p_description TEXT DEFAULT '', -- Keep for potential transaction logging
    p_transaction_type TEXT DEFAULT 'update', -- Keep for potential transaction logging
    p_reference_id TEXT DEFAULT NULL -- Keep for potential transaction logging
) RETURNS NUMERIC(15,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_balance NUMERIC(15,2);
    v_user_id INTEGER;
BEGIN
    SELECT id INTO v_user_id FROM public.users WHERE telegram_id = p_telegram_id;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User with telegram_id % not found for update_balance', p_telegram_id;
        RETURN 0.00; -- Or handle as an error, e.g., by creating the user or raising an exception
    END IF;

    -- Note: Add transaction logging here if a 'transactions' table is used
    -- For now, just update the balance in the 'balances' table
    UPDATE public.balances
    SET amount = amount + p_amount_change, -- p_amount_change can be negative for debits
        updated_at = NOW()
    WHERE user_id = v_user_id
    RETURNING amount INTO v_new_balance;
    
    -- This check is important: if the user_id was valid but no row was updated (e.g., no balance record),
    -- v_new_balance would be NULL. We should ensure a balance record exists.
    -- add_user_with_balance should have created it, but as a safeguard:
    IF v_new_balance IS NULL THEN
       RAISE NOTICE 'Balance record not found or not updated for user_id % in update_balance. Attempting to fetch current or default.', v_user_id;
       -- Attempt to return current balance if record exists, otherwise 0.
       SELECT amount INTO v_new_balance FROM public.balances WHERE user_id = v_user_id;
       RETURN COALESCE(v_new_balance, 0.00);
    END IF;
    
    RETURN v_new_balance;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in update_balance: %', SQLERRM;
        -- Attempt to return current balance on error if possible, otherwise default to 0
        BEGIN
            SELECT amount INTO v_new_balance FROM public.balances b JOIN public.users u ON u.id = b.user_id WHERE u.telegram_id = p_telegram_id;
            RETURN COALESCE(v_new_balance, 0.00);
        EXCEPTION
            WHEN OTHERS THEN
                RETURN 0.00; -- Final fallback
        END;
END;
$$;


-- Function: get_user_inventory (Temporary JSONB return for debugging)
CREATE OR REPLACE FUNCTION get_user_inventory(
    p_telegram_id BIGINT
) RETURNS JSONB -- Changed from TABLE to JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_item_count INTEGER;
    v_inventory_json JSONB;
BEGIN
    RAISE NOTICE '[get_user_inventory_jsonb] Called with p_telegram_id: %', p_telegram_id;

    SELECT count(*) INTO v_item_count FROM public.user_inventory ui WHERE ui.telegram_id = p_telegram_id;
    RAISE NOTICE '[get_user_inventory_jsonb] Count for p_telegram_id % in user_inventory table is: %', p_telegram_id, v_item_count;

    IF v_item_count > 0 THEN
        RAISE NOTICE '[get_user_inventory_jsonb] Found % items. Proceeding to aggregate to JSONB for p_telegram_id %.', v_item_count, p_telegram_id;
        SELECT jsonb_agg(t) INTO v_inventory_json FROM (
            SELECT 
                ui.skin_name,
                ui.skin_image,
                ui.skin_tier,
                ui.acquired_date,
                ui.unique_id
            FROM 
                public.user_inventory ui
            WHERE 
                ui.telegram_id = p_telegram_id
            ORDER BY 
                ui.acquired_date DESC
        ) t;
    ELSE
        RAISE NOTICE '[get_user_inventory_jsonb] No items found for p_telegram_id %. Will return empty JSON array.', p_telegram_id;
        v_inventory_json := '[]'::JSONB;
    END IF;

    RAISE NOTICE '[get_user_inventory_jsonb] Returning: %', v_inventory_json;
    RETURN v_inventory_json;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[get_user_inventory_jsonb] ERROR: %', SQLERRM;
        RETURN jsonb_build_object('error', SQLERRM); 
END;
$$;

-- Function: add_skin_to_inventory
-- Adds skin and updates nft_count in 'user_stats'.
CREATE OR REPLACE FUNCTION add_skin_to_inventory(
    p_telegram_id BIGINT,
    p_skin_name TEXT,
    p_skin_image TEXT,
    p_skin_tier INT
) RETURNS JSONB -- Changed to JSONB to return unique_id
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id INTEGER;
    v_unique_id UUID;
    v_is_legendary BOOLEAN := (p_skin_tier >= 4); -- Assuming tier 4+ is legendary
BEGIN
    SELECT id INTO v_user_id FROM public.users WHERE telegram_id = p_telegram_id;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User with telegram_id % not found for add_skin_to_inventory', p_telegram_id;
        RETURN jsonb_build_object('success', false, 'message', 'User not found');
    END IF;

    -- Insert new skin with a unique ID
    INSERT INTO public.user_inventory (
        telegram_id, 
        skin_name, 
        skin_image, 
        skin_tier, 
        acquired_date,
        unique_id
    ) VALUES (
        p_telegram_id, -- Storing telegram_id directly in user_inventory
        p_skin_name,
        p_skin_image,
        p_skin_tier,
        NOW(),
        gen_random_uuid()
    ) RETURNING user_inventory.unique_id INTO v_unique_id;
    
    -- Update user's NFT count in user_stats
    -- Ensure user_stats record exists (add_user_with_balance should handle this, but as a safeguard)
    INSERT INTO public.user_stats (user_id, nft_count, cases_opened, legendary_count)
    VALUES (v_user_id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE public.user_stats 
    SET nft_count = nft_count + 1,
        legendary_count = CASE WHEN v_is_legendary THEN legendary_count + 1 ELSE legendary_count END,
        updated_at = NOW()
    WHERE user_id = v_user_id;
    
    -- Update cases_opened count in user_stats (assuming opening a case adds a skin)
    UPDATE public.user_stats
    SET cases_opened = cases_opened + 1,
        updated_at = NOW()
    WHERE user_id = v_user_id;

    RETURN jsonb_build_object('success', true, 'unique_id', v_unique_id, 'skin_name', p_skin_name, 'skin_tier', p_skin_tier);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in add_skin_to_inventory: %', SQLERRM;
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Function: remove_skin_from_inventory
-- Removes skin and updates nft_count in 'user_stats'.
CREATE OR REPLACE FUNCTION remove_skin_from_inventory(
    p_telegram_id BIGINT,
    p_unique_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INT;
    v_user_id INTEGER;
    v_skin_tier INT;
BEGIN
    SELECT id INTO v_user_id FROM public.users WHERE telegram_id = p_telegram_id;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User with telegram_id % not found for remove_skin_from_inventory', p_telegram_id;
        RETURN FALSE;
    END IF;

    -- Get skin tier before deleting for legendary count adjustment
    SELECT skin_tier INTO v_skin_tier 
    FROM public.user_inventory 
    WHERE user_inventory.telegram_id = p_telegram_id AND user_inventory.unique_id = p_unique_id;

    -- Delete specific skin using unique ID
    DELETE FROM public.user_inventory
    WHERE user_inventory.telegram_id = p_telegram_id -- Assuming telegram_id is in user_inventory
      AND user_inventory.unique_id = p_unique_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count > 0 THEN
        -- Update user's NFT count in user_stats
        UPDATE public.user_stats 
        SET nft_count = GREATEST(nft_count - 1, 0),
            legendary_count = CASE WHEN v_skin_tier >= 4 THEN GREATEST(legendary_count - 1, 0) ELSE legendary_count END,
            updated_at = NOW()
        WHERE user_id = v_user_id;
    END IF;
    
    RETURN deleted_count > 0;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in remove_skin_from_inventory: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- Function: get_user_stats
-- Fetches stats from 'user_stats' and nft_count from 'user_inventory'.
CREATE OR REPLACE FUNCTION get_user_stats(
    p_telegram_id BIGINT
) RETURNS TABLE (
    nft_count INTEGER,
    cases_opened INTEGER,
    legendary_count INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    SELECT id INTO v_user_id FROM public.users WHERE telegram_id = p_telegram_id;

    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT 0, 0, 0; -- Return empty stats if user not found
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        COALESCE(us.nft_count, 0) AS nft_count, -- nft_count from user_stats
        COALESCE(us.cases_opened, 0) AS cases_opened,
        COALESCE(us.legendary_count, 0) AS legendary_count
    FROM 
        public.user_stats us
    WHERE 
        us.user_id = v_user_id;
    
    -- If user_stats has no record for user_id, the above will return no rows.
    -- We can ensure a row is returned with defaults if needed.
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0,0,0;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_user_stats: %', SQLERRM;
        RETURN QUERY SELECT 0, 0, 0; -- Return empty stats on error
        RETURN;
END;
$$;

-- Function: check_reward_availability (Seems mostly compatible)
CREATE OR REPLACE FUNCTION check_reward_availability(
    p_telegram_id BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
    last_claim_record RECORD;
BEGIN
    -- Get the latest claim for this user
    SELECT * INTO last_claim_record
    FROM public.reward_claims
    WHERE telegram_id = p_telegram_id
    ORDER BY claim_time DESC
    LIMIT 1;
    
    IF last_claim_record IS NULL THEN
        result = jsonb_build_object(
            'is_available', true,
            'next_available', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
            'last_claimed', NULL
        );
    ELSE
        result = jsonb_build_object(
            'is_available', NOW() >= last_claim_record.next_available_time,
            'next_available', to_char(last_claim_record.next_available_time, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
            'last_claimed', to_char(last_claim_record.claim_time, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        );
    END IF;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in check_reward_availability: %', SQLERRM;
        RETURN jsonb_build_object(
            'is_available', false,
            'error', 'Failed to check reward availability',
            'detail', SQLERRM
        );
END;
$$;

-- Function: claim_reward
-- Uses the revised add_coins_to_user (which maps to update_balance on the 'balances' table)
CREATE OR REPLACE FUNCTION claim_reward(
    p_telegram_id BIGINT,
    p_amount INT DEFAULT 50 -- Changed p_amount_to_claim back to p_amount to match JS call
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
    is_available BOOLEAN;
    next_available TIMESTAMP WITH TIME ZONE;
    current_balance_numeric NUMERIC(15,2); -- To match add_coins_to_user return type
BEGIN
    SELECT (check_reward_availability(p_telegram_id)->>'is_available')::BOOLEAN INTO is_available;
    
    IF NOT is_available THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Reward is not yet available',
            'balance', NULL
        );
    END IF;
    
    next_available := NOW() + INTERVAL '12 hours';
    
    INSERT INTO public.reward_claims (
        telegram_id, 
        claim_time, 
        amount, 
        next_available_time
    ) VALUES (
        p_telegram_id,
        NOW(),
        p_amount,
        next_available
    );
    
    -- Call add_coins_to_user, which handles the balance update
    SELECT add_coins_to_user(p_telegram_id, p_amount::NUMERIC) INTO current_balance_numeric;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Reward claimed successfully',
        'amount', p_amount,
        'next_available', to_char(next_available, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'balance', current_balance_numeric 
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in claim_reward: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Failed to claim reward',
            'error', SQLERRM
        );
END;
$$;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE (ensure these align with user's schema)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON public.users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_balances_user_id ON public.balances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_telegram_id ON public.user_inventory(telegram_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_unique_id ON public.user_inventory(unique_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_telegram_id ON public.reward_claims(telegram_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_next_available ON public.reward_claims(next_available_time);

-- =====================================================
-- GRANT PERMISSIONS (for Supabase)
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

DO $$
BEGIN
    RAISE NOTICE 'Database setup script completed successfully!';
    RAISE NOTICE 'All functions have been revised and should align with the provided table schema.';
END $$; 