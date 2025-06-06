-- Create invoices table for Telegram Stars payments
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    case_type VARCHAR(50) NOT NULL,
    stars_amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payload TEXT,
    telegram_payment_charge_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on telegram_id for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_telegram_id ON invoices(telegram_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Add RLS (Row Level Security) if needed
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own invoices
CREATE POLICY "Users can view own invoices" ON invoices
    FOR SELECT USING (auth.uid()::text = telegram_id::text);

-- Create policy to allow service role to insert invoices
CREATE POLICY "Service role can insert invoices" ON invoices
    FOR INSERT WITH CHECK (true);

-- Create policy to allow service role to update invoices
CREATE POLICY "Service role can update invoices" ON invoices
    FOR UPDATE USING (true); 