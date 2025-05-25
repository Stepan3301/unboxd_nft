# Daily Reward System Database Implementation

This document explains the database schema and functions for the daily reward system.

## Database Schema

### `reward_claims` Table

This table tracks all reward claims made by users.

```sql
CREATE TABLE IF NOT EXISTS reward_claims (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    claim_time TIMESTAMP WITH TIME ZONE NOT NULL,
    amount INT NOT NULL,
    next_available_time TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reward_claims_telegram_id ON reward_claims(telegram_id);
```

**Fields:**
- `id`: Auto-incrementing primary key
- `telegram_id`: The Telegram user ID (links to users table)
- `claim_time`: Timestamp when the reward was claimed
- `amount`: Amount of UCoins awarded (default 50)
- `next_available_time`: Timestamp when the next reward will be available (12 hours later)

## Database Functions

### `check_reward_availability`

Checks if a reward is available for a specific user.

```sql
CREATE OR REPLACE FUNCTION check_reward_availability(p_telegram_id BIGINT)
RETURNS JSONB
```

**Parameters:**
- `p_telegram_id`: Telegram user ID

**Returns:**
- JSONB object with:
  - `is_available`: Boolean indicating if reward is available
  - `next_available`: Timestamp when next reward will be available
  - `last_claimed`: Timestamp when last reward was claimed (null for new users)

### `claim_reward`

Claims a reward for a specific user, updates their balance, and sets the next availability time.

```sql
CREATE OR REPLACE FUNCTION claim_reward(
    p_telegram_id BIGINT,
    p_amount INT DEFAULT 50
)
RETURNS JSONB
```

**Parameters:**
- `p_telegram_id`: Telegram user ID
- `p_amount`: Amount of UCoins to award (default 50)

**Returns:**
- JSONB object with:
  - `success`: Boolean indicating if claim was successful
  - `message`: Success/error message
  - `amount`: Amount awarded (if successful)
  - `next_available`: Timestamp when next reward will be available
  - `balance`: Updated user balance

## How It Works

1. When a user opens the app, `check_reward_availability` is called to determine if a reward is available
2. If available, the "Claim Reward" button is enabled
3. When the user clicks the button, `claim_reward` is called to:
   - Verify availability (double-check)
   - Add UCoins to the user's balance
   - Record the claim in the database
   - Set the next availability time to 12 hours later
4. A countdown timer shows when the next reward will be available

## Error Handling

- If database calls fail, the system falls back to localStorage (client-side tracking)
- Success/failure messages are shown to the user
- Proper timestamp handling ensures time zone consistency

## Implementation

Run the SQL commands in `reward_tracking.sql` to add these functions to your Supabase database.

```bash
psql -U postgres -d your_database_name -f reward_tracking.sql
```

Or copy and paste the SQL code into the Supabase SQL Editor. 