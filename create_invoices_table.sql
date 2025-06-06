-- Create invoices table for tracking Telegram Stars payment invoices
CREATE TABLE IF NOT EXISTS invoices (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    case_type VARCHAR(50) NOT NULL,
    stars_amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payload TEXT NOT NULL,
    message_id BIGINT,
    telegram_payment_charge_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_telegram_id ON invoices(telegram_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_case_type ON invoices(case_type);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_charge_id ON invoices(telegram_payment_charge_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own invoices
CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (auth.uid()::text = telegram_id::text);

-- Create policy for service role to manage all invoices
CREATE POLICY "Service role can manage all invoices" ON invoices
    FOR ALL USING (auth.role() = 'service_role'); 