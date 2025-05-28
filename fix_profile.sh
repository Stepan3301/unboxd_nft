#!/bin/bash

# Create a backup
cp webapp.html webapp.html.bak

# Fix CSS styles - ensure they're in the head section
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

# Add the inventory-sell-btn CSS to style section
sed -i '' '1550i\
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
        }' webapp.html

# Fix the profile section - completely replace it
sed -i '' '1515,1540c\
            <div class="tab-content" id="profile-tab">\
                <h2 class="section-title">\
                    <i class="fas fa-user"></i> Profile\
                </h2>\
                \
                <div class="profile-section">\
                    <img alt="Profile" class="profile-avatar" id="profile-avatar">\
                    <h2 class="profile-username" id="profile-username">CryptoCollector</h2>\
                    <p class="profile-bio" id="profile-bio">NFT enthusiast and collector since 2021</p>\
                    \
                    <div class="featured-stats">\
                        <div class="stat">\
                            <div class="stat-value" id="profile-nfts-count">0</div>\
                            <div class="stat-label">NFTs</div>\
                        </div>\
                        <div class="stat">\
                            <div class="stat-value" id="profile-cases-opened">0</div>\
                            <div class="stat-label">CASES OPENED</div>\
                        </div>\
                        <div class="stat">\
                            <div class="stat-value" id="profile-legendary-count">0</div>\
                            <div class="stat-label">LEGENDARY</div>\
                        </div>\
                    </div>\
                    \
                    <div class="wallet" style="width: fit-content; margin: 20px auto 0;">\
                        <img src="ucoin2.png" alt="UCoin" style="width: 18px; height: 18px; margin-right: 5px;">\
                        <span id="profile-balance">0</span>\
                    </div>\
                </div>\
                \
                <h2 class="section-title" style="margin-top: 20px;">\
                    <i class="fas fa-crown"></i> Achievements\
                </h2>\
                \
                <div class="cases-grid">' webapp.html

# Fix the getUserInventory function that had a syntax error
sed -i '' '2343c\
        userCollection.innerHTML = "";' webapp.html

# Fix the sellNFT function
sed -i '' '2910,2928c\
// Common function for selling NFTs from anywhere\
async function sellNFT(skinName, skinImage, skinTier) {\
    try {\
        // Get the sell price\
        const sellPrice = skinPrices[skinTier];\
        \
        // Remove from inventory\
        const { data: removeData, error: removeError } = await supabase.rpc("remove_skin_from_inventory", {\
            p_telegram_id: telegramId,\
            p_skin_name: skinName,\
            p_skin_image: skinImage\
        });\
        \
        if (removeError) {\
            console.error("Error removing skin from inventory:", removeError);\
            showCustomDialog("Error selling the skin. Please try again.");\
            return false;\
        }\
        \
        // Update balance\
        const success = await updateUserBalance(sellPrice, `Sold ${skinName}`, "sale");\
        \
        if (success) {\
            showCustomDialog(`You sold ${skinName} for ${sellPrice} UCoins!`);\
            \
            // Refresh inventory\
            await getUserInventory();\
            \
            // Update stats\
            await updateUserStat("nft_count", -1);\
            return true;\
        } else {\
            showCustomDialog("Error processing the transaction. Please try again.");\
            return false;\
        }\
    } catch (err) {\
        console.error("Error in sellNFT:", err);\
        showCustomDialog("An error occurred. Please try again.");\
        return false;\
    }\
}' webapp.html

# Fix the roulette sell button functionality
sed -i '' '2928i\
\
// Sell button functionality\
document.getElementById("roulette-sell").addEventListener("click", async function() {\
    if (!currentResultSkin) return;\
    \
    try {\
        await sellNFT(currentResultSkin.name, currentResultSkin.image, currentResultSkin.tier);\
        rouletteOverlay.classList.remove("active");\
    } catch (err) {\
        console.error("Error in sell button click handler:", err);\
    }\
});' webapp.html

# Ensure the addToInventory function is correctly defined
sed -i '' '2658,2680c\
// Function to add skin to user'"'"'s inventory\
async function addToInventory(skin) {\
    try {\
        // Call the custom function we created in Supabase\
        const { data, error } = await supabase.rpc("add_skin_to_inventory", {\
            p_telegram_id: telegramId,\
            p_skin_name: skin.name,\
            p_skin_image: skin.image,\
            p_skin_tier: skin.tier\
        });\
        \
        if (error) {\
            console.error("Error adding skin to inventory:", error);\
            return;\
        }\
        \
        console.log("Skin added to inventory:", skin.name);\
        \
        // Now update the UI - we'"'"'ll reload the entire inventory to ensure consistency\
        getUserInventory();\
    } catch (err) {\
        console.error("Error in addToInventory:", err);\
    }\
}' webapp.html

# Define skinPrices if not already defined
sed -i '' '/const labubuSkins = \[/i\
// Define skin prices by tier for selling\
const skinPrices = {\
    1: 20,\
    2: 50,\
    3: 120,\
    4: 300,\
    5: 750,\
    6: 10000\
};\
' webapp.html 