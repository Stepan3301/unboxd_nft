# UnboxdNFT Database Setup Guide

This document provides instructions for setting up the complete database schema and functions for the UnboxdNFT Telegram bot application.

## 🚨 Critical Database Connection Issues Fixed

### Issues Identified and Resolved:

1. **Multiple Supabase Initialization Conflicts**
   - Fixed duplicate client initialization in webapp.html
   - Consolidated into single, proper initialization flow

2. **Missing Database Functions**
   - Added `add_user_with_balance()` function
   - Added `update_balance()` function  
   - Added `check_reward_availability()` function
   - Added `claim_reward()` function
   - All functions now properly handle error cases

3. **Incorrect Supabase Client Creation**
   - Fixed `supabase.createClient()` to use `window.supabase.createClient()`
   - Fixed variable naming conflicts and duplicate declarations

4. **Race Condition Issues**
   - Implemented proper async initialization flow
   - Added connection testing before app setup

## 📋 Database Setup Instructions

### Step 1: Run the Complete Database Setup

Execute the `complete_database_functions.sql` file in your Supabase SQL Editor:

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the entire contents of `complete_database_functions.sql`
4. Run the script

This will create:
- All necessary tables with proper relationships
- All required functions for the app to work
- Proper indexes for performance
- Correct permissions for Supabase roles

### Step 2: Verify Database Functions

Run these test queries to ensure everything is working:

```sql
-- Test user registration
SELECT add_user_with_balance(123456789, 'testuser', 'Test', 'User');

-- Test balance retrieval
SELECT get_balance(123456789);

-- Test inventory function
SELECT * FROM get_user_inventory(123456789);

-- Test reward availability
SELECT check_reward_availability(123456789);
```

### Step 3: Web App Configuration

The web app has been updated with:
- Single, proper Supabase client initialization
- Better error handling for database connections
- Fixed race conditions in app startup
- Proper async function flow

## 🔧 Functions Included

### User Management
- `add_user_with_balance()` - Register new users with starting balance
- `get_balance()` - Get user's current balance
- `update_balance()` - Update balance with transaction logging
- `add_coins_to_user()` - Simple coin addition function

### Inventory Management  
- `get_user_inventory()` - Retrieve user's NFT collection
- `add_skin_to_inventory()` - Add new NFTs to inventory
- `remove_skin_from_inventory()` - Remove NFTs (supports both UUID and legacy name-based removal)

### Statistics
- `get_user_stats()` - Get user statistics
- `update_user_stats()` - Update user statistics
- `record_case_opened()` - Record case opening events

### Daily Rewards
- `check_reward_availability()` - Check if daily reward is available
- `claim_reward()` - Claim daily reward with cooldown management

## 📊 Database Schema

### Main Tables Created:
- `users` - User profiles and basic stats
- `user_inventory` - NFT inventory with unique IDs
- `balances` - Separate balance tracking (optional)
- `transactions` - Transaction history
- `user_stats` - Detailed user statistics
- `reward_claims` - Daily reward claim tracking

## 🔒 Security & Permissions

The script automatically sets up proper permissions for:
- `anon` role (for public access)
- `authenticated` role (for logged-in users)

## 🚀 Testing Your Setup

1. **Web App Test**: Open the webapp.html in a browser and check console for connection messages
2. **Database Test**: Use the test_inventory.html file to test specific functions
3. **Bot Test**: Run the Python bot and test user registration

## 📝 Maintenance Notes

- All functions include proper error handling
- Indexes are created for optimal performance  
- Functions are designed to be safe for concurrent access
- Backup your database before running the setup script

## 🔍 Troubleshooting

### Common Issues:

1. **"Function does not exist" errors**
   - Ensure you ran the complete SQL script
   - Check that functions were created successfully

2. **Permission denied errors**
   - Verify RLS policies allow your operations
   - Check that permissions were granted correctly

3. **Connection timeouts**
   - Check your Supabase project URL and API key
   - Verify network connectivity

### Debug Steps:

1. Check browser console for detailed error messages
2. Use the test_inventory.html file for isolated testing
3. Check Supabase logs for server-side errors
4. Verify your API keys and project URL are correct

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all database functions were created successfully  
3. Test with the provided test files
4. Check Supabase project settings and API keys 