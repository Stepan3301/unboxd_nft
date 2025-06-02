// Function to get user inventory from database
async function getUserInventory() {
    console.log('[InventoryJS] getUserInventory() called.');
    try {
        console.log('[InventoryJS] Fetching user inventory for telegramId:', telegramId);
        if (!telegramId) { // telegramId from config.js
            console.error('[InventoryJS] getUserInventory - FAILED: No telegram ID.');
            showInventoryError('Unable to load inventory. Please log in again.');
            return;
        }

        const params = { p_telegram_id: telegramId };
        console.log('[InventoryJS] getUserInventory - Params for get_user_inventory:', params);
        const { data: inventory, error } = await supabase.rpc('get_user_inventory', params);

        if (error) {
            console.error('[InventoryJS] getUserInventory - ERROR from get_user_inventory:', error);
            showInventoryError('Could not load your inventory. Please try again.');
            return;
        }

        console.log('[InventoryJS] getUserInventory - SUCCESS from get_user_inventory. Raw inventory data:', inventory);
        displayInventory(inventory);

    } catch (err) {
        console.error('[Inventory] Error in getUserInventory function:', err);
        showInventoryError('An unexpected error occurred. Please try again.');
    }
}

// Function to display user inventory in the UI
function displayInventory(inventory) {
    const inventoryGrid = document.getElementById('inventory-grid');
    if (!inventoryGrid) {
        console.error('[Inventory] inventory-grid element not found in DOM.');
        return;
    }
    inventoryGrid.innerHTML = ''; // Clear existing items

    if (!inventory || inventory.length === 0) {
        showEmptyInventoryState(inventoryGrid);
        return;
    }

    // Sort inventory: by tier (desc), then by name (asc)
    inventory.sort((a, b) => {
        if (a.skin_tier !== b.skin_tier) {
            return b.skin_tier - a.skin_tier; // Higher tier first
        }
        return a.skin_name.localeCompare(b.skin_name);
    });

    inventory.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'inventory-item-card';
        itemCard.dataset.tier = item.skin_tier;
        itemCard.dataset.uniqueId = item.unique_id; // Store unique_id for selling

        const itemPrice = skinPrices[item.skin_tier] || 0; // skinPrices from config.js

        // Check if the item image is a Lottie file or a static image
        let imageElement;
        if (item.skin_image && item.skin_image.endsWith('.json')) {
            let lottieFileName = item.skin_image;
            if (lottieFileName.startsWith('LottieAnimations/')) {
                lottieFileName = lottieFileName.substring('LottieAnimations/'.length);
            }
            imageElement = `
                <lottie-player 
                    src="${lottieFileName}" 
                    background="transparent" 
                    speed="1" 
                    style="width: 100%; height: 120px;" 
                    loop 
                    autoplay>
                </lottie-player>
            `;
        } else {
            imageElement = `<img src="${item.skin_image || 'placeholder.png'}" alt="${item.skin_name}">`;
        }

        itemCard.innerHTML = `
            <div class="item-image-container">
                ${imageElement}
            </div>
            <div class="item-info">
                <h3>${item.skin_name}</h3>
                <p class="item-tier tier-${item.skin_tier}">Tier ${item.skin_tier}</p>
                <p class="item-price">
                    <img src="ucoin2.png" alt="UCoin" style="width: 14px; height: 14px; vertical-align: middle;">
                    ${itemPrice.toLocaleString()}
                </p>
                <button class="sell-btn" data-skin-name="${item.skin_name}" data-tier="${item.skin_tier}" data-unique-id="${item.unique_id}">Sell</button>
            </div>
        `;
        inventoryGrid.appendChild(itemCard);
    });

    // Add event listeners to new sell buttons
    inventoryGrid.querySelectorAll('.sell-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const skinName = this.dataset.skinName;
            const tier = parseInt(this.dataset.tier);
            const uniqueId = this.dataset.uniqueId; // Get unique ID
            
            console.log(`[Inventory] Attempting to sell item: ${skinName}, Tier: ${tier}, Unique ID: ${uniqueId}`);
            
            // Confirmation dialog (optional but recommended)
            if (!confirm(`Are you sure you want to sell ${skinName} for ${skinPrices[tier]} UCoins?`)) {
                return;
            }

            await sellNFT(skinName, tier, uniqueId); // Pass unique ID to sellNFT
        });
    });
}

// Helper function to show empty inventory state
function showEmptyInventoryState(gridElement) {
    if (!gridElement) return;
    gridElement.innerHTML = `
        <div class="inventory-empty-state">
            <i class="fas fa-box-open empty-icon"></i>
            <p>Your inventory is empty.</p>
            <span>Open some cases to find cool items!</span>
        </div>
    `;
}

// Helper function to show inventory error state
function showInventoryError(message) {
    const inventoryGrid = document.getElementById('inventory-grid');
    if (!inventoryGrid) return;
    inventoryGrid.innerHTML = `
        <div class="inventory-error-state">
            <i class="fas fa-exclamation-triangle error-icon"></i>
            <p>${message}</p>
        </div>
    `;
}

// Function to sell an NFT
async function sellNFT(skinName, tier, uniqueId) {
    try {
        console.log(`[Inventory] Selling NFT: ${skinName}, Tier: ${tier}, Unique ID: ${uniqueId}`);
        if (!telegramId || !uniqueId) { // telegramId from config.js
            console.error('[Inventory] Telegram ID or Unique ID missing for selling NFT.');
            showToast('Error: Cannot identify item to sell. Please try again.', 'error');
            return false;
        }

        // Step 1: Remove the skin from inventory
        const { data: removalSuccess, error: removalError } = await supabase.rpc('remove_skin_from_inventory', {
            p_telegram_id: telegramId,
            p_unique_id: uniqueId 
        });

        if (removalError) {
            console.error('[Inventory] Error removing NFT from DB:', removalError);
            showToast('Error selling item (step 1). Please try again later.', 'error');
            return false;
        }

        if (!removalSuccess) {
            console.warn('[Inventory] Sell NFT failed: Could not remove item from inventory.');
            showToast('Could not remove item. It might have been already sold or removed.', 'warning');
            await getUserInventory(); // Refresh inventory to reflect actual state
            return false;
        }

        console.log('[Inventory] NFT removed from inventory successfully.');

        // Step 2: Add coins to user for the sold skin
        const sellPrice = skinPrices[tier] || 0; // skinPrices from config.js
        if (sellPrice <= 0) {
            console.warn('[Inventory] Sell price is zero or invalid for tier:', tier, '- item removed but no coins added.');
            // Item is removed, refresh inventory and stats
            await getUserInventory();
            await getUserStats(); // remove_skin_from_inventory updated stats in DB, refresh UI
            showToast(`${skinName} removed. No coins awarded for this item.`, 'info');
            return true; // Technically removal was a success
        }

        const { data: newBalance, error: addCoinsError } = await supabase.rpc('add_coins_to_user', {
            p_telegram_id: telegramId,
            p_amount: sellPrice
        });

        if (addCoinsError) {
            console.error('[Inventory] Error adding coins to user after selling NFT:', addCoinsError);
            showToast('Item sold, but error updating balance. Please contact support.', 'error');
            // Item is removed, refresh inventory and stats despite balance error
            await getUserInventory();
            await getUserStats(); // remove_skin_from_inventory updated stats in DB, refresh UI
            return false; // Indicate that the full operation had issues
        }

        console.log('[Inventory] NFT sold and coins added successfully. New balance:', newBalance);
        showToast(`${skinName} sold for ${sellPrice.toLocaleString()} UCoins!`, 'success');
        
        // Update balance (userBalance from config.js, updateUserBalance from user.js)
        userBalance = parseFloat(newBalance);
        updateBalanceDisplay(); // from user.js
        
        // Refresh inventory and stats (getUserInventory from this file, getUserStats from user.js)
        // remove_skin_from_inventory SQL function already updates nft_count and legendary_count
        await getUserInventory(); 
        await getUserStats(); // This will refresh the UI with the stats updated by the DB
        
        addActivity('sale', { skinName: skinName, price: sellPrice }); // addActivity from activityLog.js
        return true;

    } catch (err) {
        console.error('[Inventory] Error in sellNFT function:', err);
        showToast('An unexpected error occurred while selling. Please try again.', 'error');
        return false;
    }
}

// Function to add item to user inventory (called after case opening)
async function addItemToInventoryDB(skinName, tier, skinImage, skinPrice, uniqueId) {
    try {
        console.log('[Inventory] Adding item to inventory DB:', { skinName, tier, skinImage, skinPrice, uniqueId });
        if (!telegramId) { // telegramId from config.js
            console.error('[Inventory] No Telegram ID, cannot add item to inventory.');
            return { success: false, message: 'User not identified.' };
        }
        
        const { data, error } = await supabase.rpc('add_skin_to_inventory', {
            p_telegram_id: telegramId,
            p_skin_name: skinName,
            p_skin_tier: tier,
            p_skin_image: skinImage,
            p_skin_price: skinPrice,
            p_unique_id: uniqueId
        });

        if (error) {
            console.error('[Inventory] Error adding item to inventory DB:', error);
            return { success: false, message: 'Database error while adding item.' };
        }
        
        console.log('[Inventory] Item added to inventory DB successfully:', data);
        
        // Refresh user stats after adding item
        await updateUserStat('nft_count', 1); // from user.js
        if (tier === 4) { // Assuming Tier 4 is Legendary
            await updateUserStat('legendary_count', 1); // from user.js
        }

        return { success: data.success, message: data.message, new_balance: data.new_balance };

    } catch (err) {
        console.error('[Inventory] Exception in addItemToInventoryDB:', err);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

console.log('[InventoryJS] inventory.js script finished loading.'); 