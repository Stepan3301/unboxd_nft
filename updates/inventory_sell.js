// Function to get user inventory from database with sell buttons
async function getUserInventory() {
    try {
        if (!telegramId) {
            console.error('No Telegram ID available');
            return;
        }
        
        // Get user inventory from Supabase
        const { data: inventoryData, error: inventoryError } = await supabase.rpc('get_user_inventory', {
            p_telegram_id: telegramId
        });
        
        if (inventoryError) {
            console.error('Error getting user inventory:', inventoryError);
            return;
        }
        
        // Clear existing inventory display
        const userCollection = document.getElementById('user-collection');
        userCollection.innerHTML = '';
        
        // Check if inventory is empty
        if (!inventoryData || inventoryData.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-collection-message';
            emptyMessage.style.width = '100%';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '30px';
            emptyMessage.style.color = 'rgba(255,255,255,0.7)';
            
            emptyMessage.innerHTML = `
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>Your collection is empty. Open some cases to get Labubu skins!</p>
            `;
            
            userCollection.appendChild(emptyMessage);
            return;
        }
        
        // Display each item in the inventory
        inventoryData.forEach(item => {
            // Create new card for the collection
            const card = document.createElement('div');
            card.className = 'nft-card';
            
            // Add rarity badge based on tier
            let rarityClass;
            switch(item.skin_tier) {
                case 1: rarityClass = 'common'; break;
                case 2: rarityClass = 'rare'; break;
                case 3: rarityClass = 'epic'; break;
                case 4: rarityClass = 'legendary'; break;
                case 5: rarityClass = 'mythic'; break;
                case 6: rarityClass = 'divine'; break;
                default: rarityClass = 'common';
            }
            
            const rarityBadge = document.createElement('span');
            rarityBadge.className = `rarity-badge rarity-${rarityClass}`;
            rarityBadge.textContent = rarityClass.toUpperCase();
            card.appendChild(rarityBadge);
            
            // Add image
            const img = document.createElement('img');
            img.src = item.skin_image;
            img.alt = item.skin_name;
            img.className = 'nft-image';
            card.appendChild(img);
            
            // Add info
            const info = document.createElement('div');
            info.className = 'nft-info';
            
            const title = document.createElement('div');
            title.className = `nft-title tier-${item.skin_tier}`;
            title.textContent = item.skin_name;
            info.appendChild(title);
            
            // Add acquisition date
            const date = document.createElement('div');
            date.style.fontSize = '0.7rem';
            date.style.color = 'rgba(255,255,255,0.5)';
            date.textContent = new Date(item.acquired_date).toLocaleDateString();
            info.appendChild(date);
            
            // Add sell button
            const sellPrice = skinPrices[item.skin_tier];
            const sellBtn = document.createElement('button');
            sellBtn.className = 'inventory-sell-btn';
            sellBtn.innerHTML = `<i class="fas fa-coins"></i> Sell for <img src="ucoin2.png" alt="UCoin" style="width: 14px; height: 14px; margin: 0 3px;"> ${sellPrice}`;
            sellBtn.onclick = async () => {
                await sellNFT(item.skin_name, item.skin_image, item.skin_tier);
            };
            info.appendChild(sellBtn);
            
            card.appendChild(info);
            
            // Add to collection
            userCollection.appendChild(card);
        });
        
        console.log('User inventory loaded:', inventoryData);
    } catch (err) {
        console.error('Error in getUserInventory:', err);
    }
} 