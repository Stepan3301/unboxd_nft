-- Create table for reward claims if it doesn't exist
CREATE TABLE IF NOT EXISTS reward_claims (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    claim_time TIMESTAMP WITH TIME ZONE NOT NULL,
    amount INT NOT NULL,
    next_available_time TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index on telegram_id for better performance
CREATE INDEX IF NOT EXISTS idx_reward_claims_telegram_id ON reward_claims(telegram_id);

-- Function to check if a reward is available
CREATE OR REPLACE FUNCTION check_reward_availability(p_telegram_id BIGINT)
RETURNS JSONB AS $$
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
END;
$$ LANGUAGE plpgsql;

-- Function to claim a reward
CREATE OR REPLACE FUNCTION claim_reward(
    p_telegram_id BIGINT,
    p_amount INT DEFAULT 50
)
RETURNS JSONB AS $$
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
    
    -- Update user balance using existing function
    SELECT (update_balance(p_telegram_id, p_amount, 'Daily reward claimed', 'reward')) INTO current_balance;
    
    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Reward claimed successfully',
        'amount', p_amount,
        'next_available', to_char(next_available, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'balance', current_balance
    );
END;
$$ LANGUAGE plpgsql; 