-- SQL for creating user inventory table
CREATE TABLE IF NOT EXISTS user_inventory (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    skin_name VARCHAR(255) NOT NULL,
    skin_image VARCHAR(255) NOT NULL,
    skin_tier INT NOT NULL,
    acquired_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

-- Function to add skin to user inventory
CREATE OR REPLACE FUNCTION add_skin_to_inventory(
    p_telegram_id BIGINT,
    p_skin_name VARCHAR(255),
    p_skin_image VARCHAR(255),
    p_skin_tier INT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO user_inventory (telegram_id, skin_name, skin_image, skin_tier)
    VALUES (p_telegram_id, p_skin_name, p_skin_image, p_skin_tier);
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Function to get user inventory
CREATE OR REPLACE FUNCTION get_user_inventory(
    p_telegram_id BIGINT
) RETURNS TABLE (
    skin_name VARCHAR(255),
    skin_image VARCHAR(255),
    skin_tier INT,
    acquired_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.skin_name,
        ui.skin_image,
        ui.skin_tier,
        ui.acquired_date
    FROM 
        user_inventory ui
    WHERE 
        ui.telegram_id = p_telegram_id
    ORDER BY 
        ui.acquired_date DESC;
END;
$$; 