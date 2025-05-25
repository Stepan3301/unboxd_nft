-- Check if the user_inventory table already has a unique_id column
DO $$
BEGIN
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
    END IF;
END $$;

-- IMPORTANT: We need to drop existing functions before recreating them with new parameters/return types
-- This could cause temporary issues if another user is accessing the database during the update
-- It's recommended to perform this update during off-peak hours
DROP FUNCTION IF EXISTS add_skin_to_inventory(BIGINT, TEXT, TEXT, INT);
DROP FUNCTION IF EXISTS get_user_inventory(BIGINT);
DROP FUNCTION IF EXISTS remove_skin_from_inventory(BIGINT, TEXT, TEXT);

-- Create compatibility function for any code still using the old version
-- This will be called by older versions of the app that haven't been updated yet
CREATE OR REPLACE FUNCTION remove_skin_from_inventory(
    p_telegram_id BIGINT,
    p_skin_name TEXT,
    p_skin_image TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    target_skin RECORD;
    deleted_count INT;
BEGIN
    -- Find the first matching skin to remove (for backward compatibility)
    SELECT * INTO target_skin
    FROM user_inventory
    WHERE telegram_id = p_telegram_id
      AND skin_name = p_skin_name
      AND skin_image = p_skin_image
    LIMIT 1;
    
    IF target_skin IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Delete the specific skin using its unique ID
    DELETE FROM user_inventory
    WHERE telegram_id = p_telegram_id
      AND unique_id = target_skin.unique_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count > 0;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Update existing function to add skin to inventory with unique ID
CREATE OR REPLACE FUNCTION add_skin_to_inventory(
    p_telegram_id BIGINT,
    p_skin_name TEXT,
    p_skin_image TEXT,
    p_skin_tier INT
)
RETURNS BOOLEAN AS $$
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
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Update function to get user inventory with unique IDs
CREATE OR REPLACE FUNCTION get_user_inventory(p_telegram_id BIGINT)
RETURNS TABLE (
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

-- Create the new function to remove a specific skin from inventory using unique_id
CREATE OR REPLACE FUNCTION remove_skin_from_inventory(
    p_telegram_id BIGINT,
    p_unique_id UUID
)
RETURNS BOOLEAN AS $$
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
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql; 