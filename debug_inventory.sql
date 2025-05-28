-- Check if the user_inventory table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_inventory'
);

-- Check structure of the user_inventory table
SELECT column_name, data_type, character_maximum_length, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_inventory';

-- Check if there are any rows in the user_inventory table
SELECT COUNT(*) FROM user_inventory;

-- Look at a sample of user_inventory data
SELECT * FROM user_inventory LIMIT 10;

-- Check if the get_user_inventory function exists
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'get_user_inventory';

-- Test run the get_user_inventory function with a test user ID
-- Replace 123456789 with a real telegram_id from your database
SELECT * FROM get_user_inventory(123456789);

-- Check if there's any inventory data for a specific user
-- Replace 123456789 with a real telegram_id from your database
SELECT COUNT(*) FROM user_inventory WHERE telegram_id = 123456789; 