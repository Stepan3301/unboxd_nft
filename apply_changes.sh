#!/bin/bash

# Set the working directory
cd /Users/troitskiystepan/telegram_bot

# Backup the original file
cp webapp.html webapp.html.backup

# Make the animations fix
sed -i '' '2497,2631d' webapp.html
sed -i '' '2497i\
// Fix roulette animation\
function startRouletteAnimation(finalPosition, selectedSkin) {\
    currentResultSkin = selectedSkin;\
    \
    // Set the sell price with coin icon\
    const sellPrice = skinPrices[selectedSkin.tier];\
    const sellPriceElement = document.getElementById('\''sell-price'\'');\
    sellPriceElement.innerHTML = `<img src="ucoin2.png" alt="UCoin" style="width: 18px; height: 18px; margin: 0 5px;"> ${sellPrice}`;\
    \
    // Style the result name according to tier\
    const resultNameElement = document.getElementById('\''result-name'\'');\
    resultNameElement.className = `tier-${selectedSkin.tier}`;\
    resultNameElement.textContent = selectedSkin.name;\
    \
    // Reset animation state\
    rouletteTrack.style.transition = '\''none'\'';\
    rouletteTrack.offsetHeight; // Force a reflow to ensure transition reset is applied\
    \
    // Set the total duration and easing\
    const totalDuration = 7000; // 7 seconds\
    \
    // Using cubic-bezier for super smooth animation\
    // This specific bezier curve will start fast and gradually slow down\
    const easingFunction = '\''cubic-bezier(0.25, 0.1, 0.25, 1)'\'';\
    \
    // Set up the animation\
    setTimeout(() => {\
        rouletteTrack.style.transition = `transform ${totalDuration}ms ${easingFunction}`;\
        rouletteTrack.style.transform = `translateX(-${finalPosition}px)`;\
    }, 50); // Small delay to ensure the transition reset is fully applied\
    \
    // When animation ends, show the result\
    setTimeout(() => {\
        // Update result display\
        resultImage.src = selectedSkin.image;\
        \
        // Show result\
        rouletteResult.classList.add('\''active'\'');\
        \
        // If legendary or epic, update stats\
        if (selectedSkin.rarity === '\''legendary'\'') {\
            updateUserStat('\''legendary_count'\'', 1);\
        }\
        \
        // Update NFT count\
        updateUserStat('\''nft_count'\'', 1);\
        \
        // Add to user'\''s inventory\
        addToInventory(selectedSkin);\
    }, totalDuration + 200); // Add a small buffer for animation completion\
}\
\
// Function to open case - also reset the roulette state\
async function openCase(caseId) {\
    try {\
        // Get fresh balance data first\
        const { data: balanceData, error: balanceError } = await supabase.rpc('\''get_balance'\'', {\
            p_telegram_id: telegramId\
        });\
            \
        if (balanceError) {\
            console.error('\''Error getting balance:'\'', balanceError);\
            showCustomDialog('\''Error retrieving your balance. Please try again.'\'');\
            return;\
        }\
            \
        // Update the local userBalance variable with fresh data\
        userBalance = balanceData || 0;\
        updateBalanceDisplay();\
        \
        // Now check if user has enough balance\
        if (userBalance < 100) {\
            showNotEnoughBalanceDialog();\
            return;\
        }\
        \
        // Initialize roulette\
        initializeRoulette();\
        \
        // Reset roulette position and state\
        rouletteTrack.style.transition = '\''none'\'';\
        rouletteTrack.style.transform = '\''translateX(0)'\'';\
        rouletteTrack.offsetHeight; // Force a reflow\
        \
        // Hide result\
        rouletteResult.classList.remove('\''active'\'');\
        \
        // Show roulette overlay\
        rouletteOverlay.classList.add('\''active'\'');\
        \
        // Deduct balance\
        const success = await updateUserBalance(-100, `Opened Labubu case`, '\''purchase'\'');\
        \
        if (!success) {\
            showCustomDialog('\''Failed to process the transaction. Please try again.'\'');\
            rouletteOverlay.classList.remove('\''active'\'');\
            return;\
        }\
        \
        // Update cases opened stat\
        await updateUserStat('\''cases_opened'\'', 1);\
        \
        // Pick a random skin based on probability\
        const selectedSkin = getRandomSkinByProbability();\
        \
        // Calculate roulette position\
        const itemWidth = 130; // item width + margin\
        const centerPosition = window.innerWidth / 2;\
        \
        // Position the selected item in the center (with the middle set of items)\
        // Find the index of the selected skin in the labubuSkins array\
        const selectedIndex = labubuSkins.findIndex(skin => skin.name === selectedSkin.name);\
        const selectedPosition = labubuSkins.length + selectedIndex; // Use the middle set of items\
        const finalPosition = selectedPosition * itemWidth - centerPosition + itemWidth / 2;\
        \
        // Add a small random offset for more natural feel\
        const randomOffset = Math.random() * 10 - 5;\
        \
        // Start the animation with gradually decreasing speed\
        startRouletteAnimation(finalPosition + randomOffset, selectedSkin);\
    } catch (err) {\
        console.error('\''Error in openCase:'\'', err);\
        showCustomDialog('\''An error occurred. Please try again.'\'');\
        rouletteOverlay.classList.remove('\''active'\'');\
    }\
}' webapp.html

# Find and replace the sell button handler
sed -i '' '2800,2825d' webapp.html
sed -i '' '2800i\
// Common function for selling NFTs from anywhere\
async function sellNFT(skinName, skinImage, skinTier) {\
    try {\
        // Get the sell price\
        const sellPrice = skinPrices[skinTier];\
        \
        // Remove from inventory\
        const { data: removeData, error: removeError } = await supabase.rpc('\''remove_skin_from_inventory'\'', {\
            p_telegram_id: telegramId,\
            p_skin_name: skinName,\
            p_skin_image: skinImage\
        });\
        \
        if (removeError) {\
            console.error('\''Error removing skin from inventory:'\'', removeError);\
            showCustomDialog('\''Error selling the skin. Please try again.'\'');\
            return false;\
        }\
        \
        // Update balance\
        const success = await updateUserBalance(sellPrice, `Sold ${skinName}`, '\''sale'\'');\
        \
        if (success) {\
            showCustomDialog(`You sold ${skinName} for ${sellPrice} UCoins!`);\
            \
            // Refresh inventory\
            await getUserInventory();\
            \
            // Update stats\
            await updateUserStat('\''nft_count'\'', -1);\
            return true;\
        } else {\
            showCustomDialog('\''Error processing the transaction. Please try again.'\'');\
            return false;\
        }\
    } catch (err) {\
        console.error('\''Error in sellNFT:'\'', err);\
        showCustomDialog('\''An error occurred. Please try again.'\'');\
        return false;\
    }\
}\
\
// Sell button functionality\
document.getElementById('\''roulette-sell'\'').addEventListener('\''click'\'', async function() {\
    if (!currentResultSkin) return;\
    \
    try {\
        await sellNFT(currentResultSkin.name, currentResultSkin.image, currentResultSkin.tier);\
        rouletteOverlay.classList.remove('\''active'\'');\
    } catch (err) {\
        console.error('\''Error in sell button click handler:'\'', err);\
    }\
});' webapp.html

# Update the getUserInventory function
sed -i '' '2296,2389d' webapp.html
sed -i '' '2296i\
// Function to get user inventory from database\
async function getUserInventory() {\
    try {\
        if (!telegramId) {\
            console.error('\''No Telegram ID available'\'');\
            return;\
        }\
        \
        // Get user inventory from Supabase\
        const { data: inventoryData, error: inventoryError } = await supabase.rpc('\''get_user_inventory'\'', {\
            p_telegram_id: telegramId\
        });\
        \
        if (inventoryError) {\
            console.error('\''Error getting user inventory:'\'', inventoryError);\
            return;\
        }\
        \
        // Clear existing inventory display\
        const userCollection = document.getElementById('\''user-collection'\'');\
        userCollection.innerHTML = '\'''';\
        \
        // Check if inventory is empty\
        if (!inventoryData || inventoryData.length === 0) {\
            const emptyMessage = document.createElement('\''div'\'');\
            emptyMessage.className = '\''empty-collection-message'\'';\
            emptyMessage.style.width = '\''100%'\'';\
            emptyMessage.style.textAlign = '\''center'\'';\
            emptyMessage.style.padding = '\''30px'\'';\
            emptyMessage.style.color = '\''rgba(255,255,255,0.7)'\'';\
            \
            emptyMessage.innerHTML = `\
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>\
                <p>Your collection is empty. Open some cases to get Labubu skins!</p>\
            `;\
            \
            userCollection.appendChild(emptyMessage);\
            return;\
        }\
        \
        // Display each item in the inventory\
        inventoryData.forEach(item => {\
            // Create new card for the collection\
            const card = document.createElement('\''div'\'');\
            card.className = '\''nft-card'\'';\
            \
            // Add rarity badge based on tier\
            let rarityClass;\
            switch(item.skin_tier) {\
                case 1: rarityClass = '\''common'\''; break;\
                case 2: rarityClass = '\''rare'\''; break;\
                case 3: rarityClass = '\''epic'\''; break;\
                case 4: rarityClass = '\''legendary'\''; break;\
                case 5: rarityClass = '\''mythic'\''; break;\
                case 6: rarityClass = '\''divine'\''; break;\
                default: rarityClass = '\''common'\'';\
            }\
            \
            const rarityBadge = document.createElement('\''span'\'');\
            rarityBadge.className = `rarity-badge rarity-${rarityClass}`;\
            rarityBadge.textContent = rarityClass.toUpperCase();\
            card.appendChild(rarityBadge);\
            \
            // Add image\
            const img = document.createElement('\''img'\'');\
            img.src = item.skin_image;\
            img.alt = item.skin_name;\
            img.className = '\''nft-image'\'';\
            card.appendChild(img);\
            \
            // Add info\
            const info = document.createElement('\''div'\'');\
            info.className = '\''nft-info'\'';\
            \
            const title = document.createElement('\''div'\'');\
            title.className = `nft-title tier-${item.skin_tier}`;\
            title.textContent = item.skin_name;\
            info.appendChild(title);\
            \
            // Add acquisition date\
            const date = document.createElement('\''div'\'');\
            date.style.fontSize = '\''0.7rem'\'';\
            date.style.color = '\''rgba(255,255,255,0.5)'\'';\
            date.textContent = new Date(item.acquired_date).toLocaleDateString();\
            info.appendChild(date);\
            \
            // Add sell button\
            const sellPrice = skinPrices[item.skin_tier];\
            const sellBtn = document.createElement('\''button'\'');\
            sellBtn.className = '\''inventory-sell-btn'\'';\
            sellBtn.innerHTML = `<i class="fas fa-coins"></i> Sell for <img src="ucoin2.png" alt="UCoin" style="width: 14px; height: 14px; margin: 0 3px;"> ${sellPrice}`;\
            sellBtn.onclick = async () => {\
                await sellNFT(item.skin_name, item.skin_image, item.skin_tier);\
            };\
            info.appendChild(sellBtn);\
            \
            card.appendChild(info);\
            \
            // Add to collection\
            userCollection.appendChild(card);\
        });\
        \
        console.log('\''User inventory loaded:'\'', inventoryData);\
    } catch (err) {\
        console.error('\''Error in getUserInventory:'\'', err);\
    }\
}' webapp.html

# Add CSS for the inventory sell button
sed -i '' '1651i\
\
        /* Add style for inventory sell button */\
        .inventory-sell-btn {\
            background: linear-gradient(45deg, var(--primary), var(--accent));\
            color: white;\
            border: none;\
            padding: 8px 0;\
            border-radius: 20px;\
            font-size: 0.8rem;\
            font-weight: 600;\
            cursor: pointer;\
            transition: all 0.3s ease;\
            width: 100%;\
            text-align: center;\
            margin-top: 10px;\
            display: flex;\
            align-items: center;\
            justify-content: center;\
        }\
\
        .inventory-sell-btn i {\
            margin-right: 5px;\
        }\
\
        .inventory-sell-btn:hover {\
            transform: scale(1.05);\
            box-shadow: 0 0 15px rgba(108, 92, 231, 0.5);\
        }\
' webapp.html

# Update the roulette-sell styles
sed -i '' '1528,1550c\
        .roulette-sell {\
            background: linear-gradient(45deg, var(--primary), var(--accent));\
            color: white;\
            border: none;\
            padding: 10px 30px;\
            border-radius: 25px;\
            font-size: 1rem;\
            font-weight: 600;\
            cursor: pointer;\
            transition: all 0.3s ease;\
            display: flex;\
            align-items: center;\
            justify-content: center;\
        }\
        \
        .roulette-sell i {\
            margin-right: 8px;\
        }\
        \
        .roulette-sell:hover {\
            transform: scale(1.05);\
            box-shadow: 0 0 20px rgba(108, 92, 231, 0.7);\
        }' webapp.html

# Make a commit
git add webapp.html
git commit -m "Fix roulette animation and add sell functionality in inventory"

# Push to GitHub
git push origin master 