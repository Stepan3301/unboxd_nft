-- Drop all existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS get_user_inventory(BIGINT);
DROP FUNCTION IF EXISTS add_coins_to_user(BIGINT, INT);
DROP FUNCTION IF EXISTS get_balance(BIGINT);
DROP FUNCTION IF EXISTS remove_skin_from_inventory(BIGINT, UUID);
DROP FUNCTION IF EXISTS get_user_stats(BIGINT);
DROP FUNCTION IF EXISTS add_skin_to_inventory(BIGINT, TEXT, TEXT, INT);

-- Now recreate the get_user_inventory function
CREATE OR REPLACE FUNCTION get_user_inventory(
    p_telegram_id BIGINT
) RETURNS TABLE (
    skin_name TEXT,
    skin_image TEXT,
    skin_tier INT,
    acquired_date TIMESTAMP WITH TIME ZONE,
    unique_id UUID
) AS $$
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
END;
$$ LANGUAGE plpgsql;

-- Add the add_coins_to_user function
CREATE OR REPLACE FUNCTION add_coins_to_user(
    p_telegram_id BIGINT,
    p_amount INT
) RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get user id
  SELECT id INTO v_user_id FROM users WHERE telegram_id = p_telegram_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with telegram_id % not found', p_telegram_id;
  END IF;
  
  -- Update balance
  UPDATE users
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE telegram_id = p_telegram_id
  RETURNING balance INTO v_new_balance;
  
  -- Record transaction (if you have a transactions table)
  -- Uncomment if you have a transactions table
  -- INSERT INTO transactions (user_id, amount, description, transaction_type)
  -- VALUES (v_user_id, p_amount, 'Add coins to user', 'sale');
  
  RETURN v_new_balance;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Create the get_balance function
CREATE OR REPLACE FUNCTION get_balance(
    p_telegram_id BIGINT
) RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT balance FROM users WHERE telegram_id = p_telegram_id);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_balance: %', SQLERRM;
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Create the remove_skin_from_inventory function
CREATE OR REPLACE FUNCTION remove_skin_from_inventory(
    p_telegram_id BIGINT,
    p_unique_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    deleted_count INT;
BEGIN
    -- Delete specific skin using unique ID
    DELETE FROM user_inventory
    WHERE telegram_id = p_telegram_id
      AND unique_id = p_unique_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count > 0;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in remove_skin_from_inventory: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create the get_user_stats function
CREATE OR REPLACE FUNCTION get_user_stats(
    p_telegram_id BIGINT
) RETURNS TABLE (
    nft_count INTEGER,
    cases_opened INTEGER,
    legendary_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT COUNT(*) FROM user_inventory WHERE telegram_id = p_telegram_id), 0) AS nft_count,
        COALESCE(u.cases_opened, 0) AS cases_opened,
        COALESCE(u.legendary_count, 0) AS legendary_count
    FROM 
        users u
    WHERE 
        u.telegram_id = p_telegram_id;
END;
$$ LANGUAGE plpgsql;

-- Create the add_skin_to_inventory function
CREATE OR REPLACE FUNCTION add_skin_to_inventory(
    p_telegram_id BIGINT,
    p_skin_name TEXT,
    p_skin_image TEXT,
    p_skin_tier INT
) RETURNS BOOLEAN AS $$
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
        gen_random_uuid()  -- Generate a new UUID for each skin
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in add_skin_to_inventory: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Add unique_id column to user_inventory table if it doesn't exist
DO $$
BEGIN
    -- Check if unique_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_inventory' 
        AND column_name = 'unique_id'
    ) THEN
        -- Add unique_id column to user_inventory table
        ALTER TABLE user_inventory ADD COLUMN unique_id UUID DEFAULT gen_random_uuid();
        
        -- Add a unique constraint on the unique_id column
        ALTER TABLE user_inventory ADD CONSTRAINT user_inventory_unique_id_key UNIQUE (unique_id);
        
        RAISE NOTICE 'Added unique_id column to user_inventory table';
    END IF;
END $$; 