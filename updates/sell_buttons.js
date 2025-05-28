// Common function for selling NFTs from anywhere
async function sellNFT(skinName, skinImage, skinTier) {
    try {
        // Get the sell price
        const sellPrice = skinPrices[skinTier];
        
        // Remove from inventory
        const { data: removeData, error: removeError } = await supabase.rpc('remove_skin_from_inventory', {
            p_telegram_id: telegramId,
            p_skin_name: skinName,
            p_skin_image: skinImage
        });
        
        if (removeError) {
            console.error('Error removing skin from inventory:', removeError);
            showCustomDialog('Error selling the skin. Please try again.');
            return false;
        }
        
        // Update balance
        const success = await updateUserBalance(sellPrice, `Sold ${skinName}`, 'sale');
        
        if (success) {
            showCustomDialog(`You sold ${skinName} for ${sellPrice} UCoins!`);
            
            // Refresh inventory
            await getUserInventory();
            
            // Update stats
            await updateUserStat('nft_count', -1);
            return true;
        } else {
            showCustomDialog('Error processing the transaction. Please try again.');
            return false;
        }
    } catch (err) {
        console.error('Error in sellNFT:', err);
        showCustomDialog('An error occurred. Please try again.');
        return false;
    }
}

// Updated sell button functionality in roulette
document.getElementById('roulette-sell').addEventListener('click', async function() {
    if (!currentResultSkin) return;
    
    try {
        await sellNFT(currentResultSkin.name, currentResultSkin.image, currentResultSkin.tier);
        rouletteOverlay.classList.remove('active');
    } catch (err) {
        console.error('Error in sell button click handler:', err);
    }
}); 