-- Fix and troubleshoot get_user_inventory function

-- First, check if function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'get_user_inventory';

-- Check the structure of the user_inventory table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_inventory';

-- Check if there are any rows in the table
SELECT COUNT(*) FROM user_inventory;

-- Drop the function and recreate it
DROP FUNCTION IF EXISTS get_user_inventory(BIGINT);

-- Recreate the function with debug logging
CREATE OR REPLACE FUNCTION get_user_inventory(p_telegram_id BIGINT)
RETURNS TABLE (
    skin_name TEXT,
    skin_image TEXT,
    skin_tier INT,
    acquired_date TIMESTAMP WITH TIME ZONE,
    unique_id UUID
) AS $$
BEGIN
    -- Debug log
    RAISE NOTICE 'Getting inventory for user ID: %', p_telegram_id;
    
    -- Return query
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

-- Test the function with a sample user
-- Replace 123456789 with a real telegram_id from your database
SELECT * FROM get_user_inventory(123456789);

-- Insert a test item if needed (uncomment to use)
/*
INSERT INTO user_inventory (telegram_id, skin_name, skin_image, skin_tier, acquired_date, unique_id)
VALUES (
    123456789, -- Replace with real telegram_id
    'Test Labubu',
    'SkeletonLabubu.png',
    1,
    NOW(),
    gen_random_uuid()
);
*/ 