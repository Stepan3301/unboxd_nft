# Inventory System Updates

This document explains the changes made to the inventory system to ensure each NFT is treated as a unique item.

## Problem

Previously, NFTs were identified by their name and image, which caused an issue where selling one NFT would remove all NFTs of the same type from the inventory. This happened because we didn't have a unique identifier for each individual NFT.

## Solution

We've implemented a unique ID system that assigns a UUID (Universally Unique Identifier) to each NFT when it's added to the inventory. This ensures that each NFT is treated as a distinct item, even if multiple NFTs have the same name, image, and tier.

## Database Changes

### User Inventory Table

Added a `unique_id` column to the `user_inventory` table:

```sql
ALTER TABLE user_inventory ADD COLUMN unique_id UUID DEFAULT gen_random_uuid();
ALTER TABLE user_inventory ADD CONSTRAINT user_inventory_unique_id_key UNIQUE (unique_id);
```

### Updated Functions

1. **add_skin_to_inventory** - Now generates a unique ID for each new NFT:
   ```sql
   CREATE OR REPLACE FUNCTION add_skin_to_inventory(
       p_telegram_id BIGINT,
       p_skin_name TEXT,
       p_skin_image TEXT,
       p_skin_tier INT
   )
   RETURNS BOOLEAN AS $$
   BEGIN
       INSERT INTO user_inventory (
           telegram_id, 
           skin_name, 
           skin_image, 
           skin_tier, 
           acquired_date,
           unique_id
       ) VALUES (
           p_telegram_id,
           p_skin_name,
           p_skin_image,
           p_skin_tier,
           NOW(),
           gen_random_uuid()
       );
       
       RETURN TRUE;
   EXCEPTION
       WHEN OTHERS THEN
           RETURN FALSE;
   END;
   $$ LANGUAGE plpgsql;
   ```

2. **get_user_inventory** - Now returns the unique ID for each NFT:
   ```sql
   CREATE OR REPLACE FUNCTION get_user_inventory(p_telegram_id BIGINT)
   RETURNS TABLE (
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
   ```

3. **remove_skin_from_inventory** - Updated to have two versions:
   
   a. New version that removes a specific NFT based on its unique ID:
   ```sql
   CREATE OR REPLACE FUNCTION remove_skin_from_inventory(
       p_telegram_id BIGINT,
       p_unique_id UUID
   )
   RETURNS BOOLEAN AS $$
   DECLARE
       deleted_count INT;
   BEGIN
       DELETE FROM user_inventory
       WHERE telegram_id = p_telegram_id
         AND unique_id = p_unique_id;
       
       GET DIAGNOSTICS deleted_count = ROW_COUNT;
       
       RETURN deleted_count > 0;
   EXCEPTION
       WHEN OTHERS THEN
           RETURN FALSE;
   END;
   $$ LANGUAGE plpgsql;
   ```

   b. Compatibility version that maintains the old signature but only removes one NFT:
   ```sql
   CREATE OR REPLACE FUNCTION remove_skin_from_inventory(
       p_telegram_id BIGINT,
       p_skin_name TEXT,
       p_skin_image TEXT
   )
   RETURNS BOOLEAN AS $$
   DECLARE
       target_skin RECORD;
       deleted_count INT;
   BEGIN
       -- Find the first matching skin to remove (for backward compatibility)
       SELECT * INTO target_skin
       FROM user_inventory
       WHERE telegram_id = p_telegram_id
         AND skin_name = p_skin_name
         AND skin_image = p_skin_image
       LIMIT 1;
       
       IF target_skin IS NULL THEN
           RETURN FALSE;
       END IF;
       
       -- Delete the specific skin using its unique ID
       DELETE FROM user_inventory
       WHERE telegram_id = p_telegram_id
         AND unique_id = target_skin.unique_id;
       
       GET DIAGNOSTICS deleted_count = ROW_COUNT;
       
       RETURN deleted_count > 0;
   EXCEPTION
       WHEN OTHERS THEN
           RETURN FALSE;
   END;
   $$ LANGUAGE plpgsql;
   ```

## Frontend Changes

1. **getUserInventory** - Now stores the unique ID as a data attribute on each NFT card
2. **sellNFT** - Now uses the unique ID to identify which specific NFT to sell
3. **addToInventory** - Now retrieves the newly added NFT to get its unique ID
4. **Roulette System** - Updated to track the unique ID of the newly acquired NFT

## Implementation

Run the SQL commands in `inventory_update.sql` to update your database schema and functions. The changes will automatically be applied to the frontend when the page loads.

## Troubleshooting

If you encounter an error like:
```
ERROR: 42P13: cannot change return type of existing function
DETAIL: Row type defined by OUT parameters is different.
HINT: Use DROP FUNCTION get_user_inventory(bigint) first.
```

This is normal and indicates that you need to drop the existing functions before creating the new ones. The updated `inventory_update.sql` script handles this automatically by including the necessary DROP statements. 