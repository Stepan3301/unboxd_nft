-- Database setup script for UnboxdNFT app
-- This script creates the necessary database functions for adding items to inventory

-- First, let's drop ALL versions of these functions that might exist
-- We need to be more aggressive with dropping overloaded functions

-- Drop all possible versions of add_coins_to_user function
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT format('DROP FUNCTION IF EXISTS %s.%s(%s);',
                      n.nspname,
                      p.proname,
                      pg_get_function_identity_arguments(p.oid))
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'add_coins_to_user' AND n.nspname = 'public'
    ) LOOP
        EXECUTE r.format;
    END LOOP;
END $$;

-- Drop all possible versions of add_skin_to_inventory function
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT format('DROP FUNCTION IF EXISTS %s.%s(%s);',
                      n.nspname,
                      p.proname,
                      pg_get_function_identity_arguments(p.oid))
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'add_skin_to_inventory' AND n.nspname = 'public'
    ) LOOP
        EXECUTE r.format;
    END LOOP;
END $$;

-- Drop all possible versions of remove_skin_from_inventory function
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT format('DROP FUNCTION IF EXISTS %s.%s(%s);',
                      n.nspname,
                      p.proname,
                      pg_get_function_identity_arguments(p.oid))
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'remove_skin_from_inventory' AND n.nspname = 'public'
    ) LOOP
        EXECUTE r.format;
    END LOOP;
END $$;

-- Now create the functions with clean slate

-- Function to add skin to user inventory
CREATE FUNCTION public.add_skin_to_inventory(
  p_telegram_id BIGINT,
  p_skin_name TEXT,
  p_skin_image TEXT,
  p_skin_tier INTEGER,
  p_skin_price INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_unique_id uuid := gen_random_uuid();
BEGIN
  -- 1) Check that user exists
  IF NOT EXISTS (
    SELECT 1 FROM public.users
     WHERE telegram_id = p_telegram_id
  ) THEN
    RAISE EXCEPTION 'User not found for telegram_id %', p_telegram_id;
  END IF;

  -- 2) Insert record into user_inventory
  INSERT INTO public.user_inventory (
    telegram_id,
    skin_name,
    skin_image,
    skin_tier,
    skin_price,
    unique_id
  ) VALUES (
    p_telegram_id,
    p_skin_name,
    p_skin_image,
    p_skin_tier,
    p_skin_price,
    v_unique_id
  );

  -- 3) Return the new UUID
  RETURN v_unique_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the real error so Supabase returns `error`
    RAISE;
END;
$$;

-- Function to remove skin from user inventory
CREATE FUNCTION public.remove_skin_from_inventory(
  p_telegram_id BIGINT,
  p_unique_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the skin with the specified unique_id for this user
  DELETE FROM public.user_inventory 
  WHERE telegram_id = p_telegram_id 
    AND unique_id = p_unique_id;
  
  -- Return true if a row was deleted, false otherwise
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Function to add coins to user
CREATE FUNCTION public.add_coins_to_user(
  p_telegram_id BIGINT,
  p_amount INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update user balance and return new balance
  UPDATE public.users 
  SET balance = balance + p_amount
  WHERE telegram_id = p_telegram_id
  RETURNING balance INTO v_new_balance;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found for telegram_id %', p_telegram_id;
  END IF;
  
  RETURN v_new_balance;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.add_skin_to_inventory(BIGINT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_skin_from_inventory(BIGINT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_coins_to_user(BIGINT, INTEGER) TO authenticated;

-- Grant execute permissions to anon users (for cases where users aren't authenticated)
GRANT EXECUTE ON FUNCTION public.add_skin_to_inventory(BIGINT, TEXT, TEXT, INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.remove_skin_from_inventory(BIGINT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.add_coins_to_user(BIGINT, INTEGER) TO anon;

-- Comments for documentation
COMMENT ON FUNCTION public.add_skin_to_inventory IS 'Adds a skin to user inventory and returns the unique ID';
COMMENT ON FUNCTION public.remove_skin_from_inventory IS 'Removes a skin from user inventory by unique ID';
COMMENT ON FUNCTION public.add_coins_to_user IS 'Adds coins to user balance and returns new balance'; 