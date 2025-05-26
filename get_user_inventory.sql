-- Function to get user inventory
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