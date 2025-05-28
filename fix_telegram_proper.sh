#!/bin/bash

# Start with a clean backup
cp webapp.html.backup webapp.html

# Add more debug logging for the Telegram initialization
sed -i '' '/console.log.*Telegram ID:.*telegramId/a\
    // Log more details about the Telegram connection\
    console.log("Is Telegram WebApp defined:", typeof window.Telegram !== "undefined" && typeof window.Telegram.WebApp !== "undefined");\
    if (window.Telegram && window.Telegram.WebApp) {\
        console.log("Telegram WebApp initData:", window.Telegram.WebApp.initData ? "present" : "missing");\
        console.log("Telegram WebApp version:", window.Telegram.WebApp.version);\
    }' webapp.html

# Fix the Telegram initialization so it doesn't create a mock when running in Telegram
sed -i '' '/function ensureTelegramApiAvailable/,/ensureTelegramApiAvailable();/c\
        // Function to check and log Telegram API availability\
        function ensureTelegramApiAvailable() {\
            if (typeof window.Telegram === "undefined" || typeof window.Telegram.WebApp === "undefined") {\
                console.warn("Telegram WebApp API not available - this might be a development environment");\
                // Only create mock in development, not in production\
                if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {\
                    console.log("Creating mock Telegram API for development");\
                    window.Telegram = {\
                        WebApp: {\
                            initData: "",\
                            initDataUnsafe: { \
                                user: { \
                                    id: 12345678,\
                                    first_name: "Test",\
                                    username: "testuser" \
                                } \
                            },\
                            expand: function() {},\
                            showAlert: function(message) {\
                                console.log("Alert would show:", message);\
                                showCustomDialog(message);\
                            },\
                            showConfirm: function(message) {\
                                console.log("Confirm would show:", message);\
                                return true;\
                            }\
                        }\
                    };\
                }\
            } else {\
                console.log("Real Telegram WebApp API detected - Version:", window.Telegram.WebApp.version);\
                console.log("Telegram user data:", window.Telegram.WebApp.initDataUnsafe?.user);\
            }\
        }\
        \
        // Call this function at app initialization\
        ensureTelegramApiAvailable();' webapp.html

# Add a check at the end of the DOMContentLoaded event to verify the connection
sed -i '' '/updateRarityNavVisibility.*cases-tab/a\
            \
            // Final check if we have Telegram user ID\
            if (!telegramId) {\
                console.error("No Telegram ID available after initialization");\
                showCustomDialog("Unable to connect to Telegram. Please restart the app.");\
            } else {\
                console.log("Telegram connection validated with ID:", telegramId);\
            }' webapp.html

# Fix any duplicate code and ensure the closing brackets are correct
cat >> webapp.html << 'EOF'

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

// Sell button functionality
document.getElementById('roulette-sell').addEventListener('click', async function() {
    if (!currentResultSkin) return;
    
    try {
        await sellNFT(currentResultSkin.name, currentResultSkin.image, currentResultSkin.tier);
        rouletteOverlay.classList.remove('active');
    } catch (err) {
        console.error('Error in sell button click handler:', err);
    }
});
EOF

# Fix the linter error about missing closing brace by ensuring all functions are properly closed
grep -n "function" webapp.html | tail -5 