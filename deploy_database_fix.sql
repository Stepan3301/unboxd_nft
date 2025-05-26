-- Deployment script for UnboxdNFT database functions
-- Run this in your Supabase SQL Editor to fix all database issues

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CREATE TABLES (if they don't exist)
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    balance INT DEFAULT 1000,
    nft_count INT DEFAULT 0,
    cases_opened INT DEFAULT 0,
    legendary_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User inventory table
CREATE TABLE IF NOT EXISTS user_inventory (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    skin_name TEXT NOT NULL,
    skin_image TEXT NOT NULL,
    skin_tier INT NOT NULL,
    acquired_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unique_id UUID DEFAULT gen_random_uuid(),
    CONSTRAINT user_inventory_unique_id_key UNIQUE (unique_id)
);

-- Reward claims table (for daily rewards tracking)
CREATE TABLE IF NOT EXISTS reward_claims (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    claim_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount INT NOT NULL,
    next_available_time TIMESTAMP WITH TIME ZONE NOT NULL
);

-- =====================================================
-- DROP EXISTING FUNCTIONS (for clean reinstall)
-- =====================================================

DROP FUNCTION IF EXISTS add_user_with_balance(BIGINT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_balance(BIGINT);
DROP FUNCTION IF EXISTS update_balance(BIGINT, INT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_user_inventory(BIGINT);
DROP FUNCTION IF EXISTS add_skin_to_inventory(BIGINT, TEXT, TEXT, INT);
DROP FUNCTION IF EXISTS remove_skin_from_inventory(BIGINT, UUID);
DROP FUNCTION IF EXISTS get_user_stats(BIGINT);
DROP FUNCTION IF EXISTS check_reward_availability(BIGINT);
DROP FUNCTION IF EXISTS claim_reward(BIGINT, INT);

-- =====================================================
-- CREATE ESSENTIAL FUNCTIONS
-- =====================================================

-- Function: add_user_with_balance
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
BEGIN
    -- Insert user or update if already exists
    INSERT INTO users (telegram_id, username, first_name, last_name, balance)
    VALUES (p_telegram_id, p_username, p_first_name, p_last_name, 1000)
    ON CONFLICT (telegram_id) 
    DO UPDATE SET 
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    RETURN v_user_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in add_user_with_balance: %', SQLERRM;
        RETURN NULL;
END;
$$;

-- Function: get_balance
CREATE OR REPLACE FUNCTION get_balance(
    p_telegram_id BIGINT
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    SELECT balance INTO v_balance
    FROM users
    WHERE telegram_id = p_telegram_id;
    
    RETURN COALESCE(v_balance, 0);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_balance: %', SQLERRM;
        RETURN 0;
END;
$$;

-- Function: update_balance
CREATE OR REPLACE FUNCTION update_balance(
    p_telegram_id BIGINT,
    p_amount INT,
    p_description TEXT DEFAULT '',
    p_transaction_type TEXT DEFAULT 'update',
    p_reference_id TEXT DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    -- Update balance
    UPDATE users
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE telegram_id = p_telegram_id
    RETURNING balance INTO v_new_balance;
    
    RETURN COALESCE(v_new_balance, 0);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in update_balance: %', SQLERRM;
        RETURN 0;
END;
$$;

-- Function: get_user_inventory
CREATE OR REPLACE FUNCTION get_user_inventory(
    p_telegram_id BIGINT
) RETURNS TABLE (
    skin_name TEXT,
    skin_image TEXT,
    skin_tier INT,
    acquired_date TIMESTAMP WITH TIME ZONE,
    unique_id UUID
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.skin_name,
        ui.skin_image,
        ui.skin_tier,
        ui.acquired_date,
        ui.unique_id
    FROM 
        user_inventory ui
    WHERE 
        ui.telegram_id = p_telegram_id
    ORDER BY 
        ui.acquired_date DESC;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_user_inventory: %', SQLERRM;
        RETURN;
END;
$$;

-- Function: add_skin_to_inventory
CREATE OR REPLACE FUNCTION add_skin_to_inventory(
    p_telegram_id BIGINT,
    p_skin_name TEXT,
    p_skin_image TEXT,
    p_skin_tier INT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert new skin with a unique ID
    INSERT INTO user_inventory (
        telegram_id, 
        skin_name, 
        skin_image, 
        skin_tier, 
        acquired_date,
        unique_id
    ) VALUES (
        p_telegram_id,
        p_skin_name,
        p_skin_image,
        p_skin_tier,
        NOW(),
        gen_random_uuid()
    );
    
    -- Update user's NFT count
    UPDATE users 
    SET nft_count = nft_count + 1,
        updated_at = NOW()
    WHERE telegram_id = p_telegram_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in add_skin_to_inventory: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- Function: remove_skin_from_inventory
CREATE OR REPLACE FUNCTION remove_skin_from_inventory(
    p_telegram_id BIGINT,
    p_unique_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INT;
BEGIN
    -- Delete specific skin using unique ID
    DELETE FROM user_inventory
    WHERE telegram_id = p_telegram_id
      AND unique_id = p_unique_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count > 0 THEN
        -- Update user's NFT count
        UPDATE users 
        SET nft_count = GREATEST(nft_count - 1, 0),
            updated_at = NOW()
        WHERE telegram_id = p_telegram_id;
    END IF;
    
    RETURN deleted_count > 0;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in remove_skin_from_inventory: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- Function: get_user_stats
CREATE OR REPLACE FUNCTION get_user_stats(
    p_telegram_id BIGINT
) RETURNS TABLE (
    nft_count INTEGER,
    cases_opened INTEGER,
    legendary_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT COUNT(*) FROM user_inventory WHERE telegram_id = p_telegram_id), 0)::INTEGER AS nft_count,
        COALESCE(u.cases_opened, 0) AS cases_opened,
        COALESCE(u.legendary_count, 0) AS legendary_count
    FROM 
        users u
    WHERE 
        u.telegram_id = p_telegram_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_user_stats: %', SQLERRM;
        RETURN;
END;
$$;

-- Function: check_reward_availability
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
    FROM reward_claims
    WHERE telegram_id = p_telegram_id
    ORDER BY claim_time DESC
    LIMIT 1;
    
    IF last_claim_record IS NULL THEN
        -- First time user - reward is available immediately
        result = jsonb_build_object(
            'is_available', true,
            'next_available', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
            'last_claimed', NULL
        );
    ELSE
        -- Check if enough time has passed since last claim
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
            'error', 'Failed to check reward availability'
        );
END;
$$;

-- Function: claim_reward
CREATE OR REPLACE FUNCTION claim_reward(
    p_telegram_id BIGINT,
    p_amount INT DEFAULT 50
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
    is_available BOOLEAN;
    next_available TIMESTAMP WITH TIME ZONE;
    current_balance INT;
BEGIN
    -- Check if reward is available
    SELECT (check_reward_availability(p_telegram_id)->>'is_available')::BOOLEAN INTO is_available;
    
    IF NOT is_available THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Reward is not yet available',
            'balance', NULL
        );
    END IF;
    
    -- Calculate next available time (12 hours from now)
    next_available := NOW() + INTERVAL '12 hours';
    
    -- Record the claim
    INSERT INTO reward_claims (
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
    
    -- Update user balance
    SELECT update_balance(p_telegram_id, p_amount, 'Daily reward claimed', 'reward') INTO current_balance;
    
    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Reward claimed successfully',
        'amount', p_amount,
        'next_available', to_char(next_available, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'balance', current_balance
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
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_telegram_id ON user_inventory(telegram_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_unique_id ON user_inventory(unique_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_telegram_id ON reward_claims(telegram_id);

-- =====================================================
-- GRANT PERMISSIONS (for Supabase)
-- =====================================================

-- Grant necessary permissions to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Test the functions to ensure they work
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'All functions have been created and are ready to use.';
END $$; 