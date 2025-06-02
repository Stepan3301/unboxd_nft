// Function to get user inventory from database
async function getUserInventory() {
    try {
        console.log('[Inventory] Fetching user inventory for telegramId:', telegramId);
        if (!telegramId) { // telegramId from config.js
            console.error('[Inventory] No telegram ID for inventory retrieval.');
            showInventoryError('Unable to load inventory. Please log in again.');
            return;
        }

        const { data: inventory, error } = await supabase.rpc('get_user_inventory_jsonb', {
            p_telegram_id: telegramId
        });

        if (error) {
            console.error('[Inventory] Error fetching user inventory from DB:', error);
            showInventoryError('Could not load your inventory. Please try again.');
            return;
        }

        console.log('[Inventory] User inventory retrieved:', inventory);
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
        if (a.tier !== b.tier) {
            return b.tier - a.tier; // Higher tier first
        }
        return a.skin_name.localeCompare(b.skin_name);
    });

    inventory.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'inventory-item-card';
        itemCard.dataset.tier = item.tier;
        itemCard.dataset.uniqueId = item.unique_id; // Store unique_id for selling

        const itemPrice = skinPrices[item.tier] || 0; // skinPrices from config.js

        // Check if the item image is a Lottie file or a static image
        let imageElement;
        if (item.skin_image && item.skin_image.endsWith('.json')) {
            imageElement = `
                <lottie-player 
                    src="lottie/${item.skin_image}" 
                    background="transparent" 
                    speed="1" 
                    style="width: 100%; height: 120px;" 
                    loop 
                    autoplay>
                </lottie-player>
            `;
        } else {
            imageElement = `<img src="images/${item.skin_image || 'placeholder.png'}" alt="${item.skin_name}">`;
        }

        itemCard.innerHTML = `
            <div class="item-image-container">
                ${imageElement}
            </div>
            <div class="item-info">
                <h3>${item.skin_name}</h3>
                <p class="item-tier tier-${item.tier}">Tier ${item.tier}</p>
                <p class="item-price">
                    <img src="ucoin2.png" alt="UCoin" style="width: 14px; height: 14px; vertical-align: middle;">
                    ${itemPrice.toLocaleString()}
                </p>
                <button class="sell-btn" data-skin-name="${item.skin_name}" data-tier="${item.tier}" data-unique-id="${item.unique_id}">Sell</button>
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

        const { data, error } = await supabase.rpc('sell_skin', {
            p_telegram_id: telegramId,
            p_unique_id: uniqueId 
        });

        if (error) {
            console.error('[Inventory] Error selling NFT in DB:', error);
            showToast('Error selling item. Please try again later.', 'error');
            return false;
        }

        if (!data.success) {
            console.warn('[Inventory] Sell NFT failed:', data.message);
            showToast(data.message || 'Could not sell item.', 'warning');
            return false;
        }

        console.log('[Inventory] NFT sold successfully:', data);
        showToast(`${skinName} sold for ${skinPrices[tier]} UCoins!`, 'success'); // skinPrices from config.js
        
        // Update balance (userBalance from config.js, updateUserBalance from user.js)
        userBalance = parseFloat(data.new_balance);
        updateBalanceDisplay(); // from user.js
        
        // Refresh inventory and stats (getUserInventory from this file, updateUserStat from user.js)
        await getUserInventory(); 
        await updateUserStat('nft_count', -1); 
        
        addActivity('sale', { skinName: skinName, price: skinPrices[tier] }); // addActivity from activityLog.js
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

console.log('[Inventory] inventory.js loaded'); 