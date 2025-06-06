-- Create payments table for completed Telegram Stars transactions
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    case_type VARCHAR(50) NOT NULL,
    stars_amount INTEGER NOT NULL,
    telegram_payment_charge_id VARCHAR(255) UNIQUE NOT NULL,
    provider_payment_charge_id VARCHAR(255),
    payload TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on telegram_id for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_telegram_id ON payments(telegram_id);

-- Create index on telegram_payment_charge_id for uniqueness and lookups
CREATE INDEX IF NOT EXISTS idx_payments_charge_id ON payments(telegram_payment_charge_id);

-- Create index on case_type for analytics
CREATE INDEX IF NOT EXISTS idx_payments_case_type ON payments(case_type);

-- Add RLS (Row Level Security) if needed
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid()::text = telegram_id::text);

-- Create policy to allow service role to insert payments
CREATE POLICY "Service role can insert payments" ON payments
    FOR INSERT WITH CHECK (true);

-- Create function to get user's star purchases
CREATE OR REPLACE FUNCTION get_user_star_purchases(p_telegram_id BIGINT)
RETURNS TABLE(
    case_type VARCHAR(50),
    stars_amount INTEGER,
    payment_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.case_type,
        p.stars_amount,
        p.created_at
    FROM payments p
    WHERE p.telegram_id = p_telegram_id
    AND p.status = 'completed'
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 