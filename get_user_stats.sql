-- Function to get user stats
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