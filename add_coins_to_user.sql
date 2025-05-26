-- Function to add coins to user balance
CREATE OR REPLACE FUNCTION add_coins_to_user(
    p_telegram_id BIGINT,
    p_amount INT
) RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get user id
  SELECT id INTO v_user_id FROM users WHERE telegram_id = p_telegram_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with telegram_id % not found', p_telegram_id;
  END IF;
  
  -- Update balance
  UPDATE users
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE telegram_id = p_telegram_id
  RETURNING balance INTO v_new_balance;
  
  -- Record transaction (if you have a transactions table)
  INSERT INTO transactions (user_id, amount, description, transaction_type)
  VALUES (v_user_id, p_amount, 'Add coins to user', 'sale');
  
  RETURN v_new_balance;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$; 