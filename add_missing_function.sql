-- Add missing add_coins_to_user function
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION add_coins_to_user(
    p_telegram_id BIGINT,
    p_amount INT
) RETURNS INT
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
    
    -- If no user found, return 0
    IF v_new_balance IS NULL THEN
        RAISE NOTICE 'User with telegram_id % not found', p_telegram_id;
        RETURN 0;
    END IF;
    
    RETURN v_new_balance;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in add_coins_to_user: %', SQLERRM;
        RETURN 0;
END;
$$; 