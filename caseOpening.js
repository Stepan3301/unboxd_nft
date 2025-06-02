// Case Opening Logic

// caseOpeningsCount and guaranteedTier3NextOpening are global from config.js

// Load opening count from localStorage
function loadCaseOpeningData() {
    if (!telegramId) { // telegramId from config.js
        console.warn('[Case Opening] No telegramId, cannot load case opening data.');
        return;
    }
    const savedCount = localStorage.getItem(`caseOpeningsCount_${telegramId}`);
    caseOpeningsCount = savedCount ? parseInt(savedCount, 10) : 0;
    console.log('[Case Opening] Loaded case openings count:', caseOpeningsCount);

    const savedGuaranteed = localStorage.getItem(`guaranteedTier3NextOpening_${telegramId}`);
    guaranteedTier3NextOpening = savedGuaranteed === 'true';
    console.log('[Case Opening] Loaded guaranteed Tier 3 next opening:', guaranteedTier3NextOpening);
}

// Save opening count to localStorage
function saveCaseOpeningData() {
    if (!telegramId) {
        console.warn('[Case Opening] No telegramId, cannot save case opening data.');
        return;
    }
    localStorage.setItem(`caseOpeningsCount_${telegramId}`, caseOpeningsCount.toString());
    localStorage.setItem(`guaranteedTier3NextOpening_${telegramId}`, guaranteedTier3NextOpening.toString());
    console.log('[Case Opening] Saved case opening data.');
}

// Open Labubu Case function
async function openLabubuCase() {
    const caseName = 'Labubu Case';
    const casePrice = 250; // Example price
    console.log(`[Case Opening] Attempting to open ${caseName} for ${casePrice} UCoins`);

    if (userBalance < casePrice) { // userBalance from config.js
        showNotEnoughBalanceDialog(); // from uiHandlers.js or utils.js
        return;
    }

    try {
        // Deduct balance and log transaction BEFORE animation
        const balanceUpdated = await updateUserBalance(-casePrice, `Opened ${caseName}`, 'case_open'); // from user.js
        if (!balanceUpdated) {
            showToast('Transaction failed. Please try again.', 'error'); // from utils.js
            return;
        }

        // Increment opening count and manage guaranteed tier
        caseOpeningsCount++;
        let isGuaranteedTier3 = guaranteedTier3NextOpening;
        if (isGuaranteedTier3) {
            guaranteedTier3NextOpening = false; // Reset after use
        }
        // If not guaranteed, and 10th opening, then next is guaranteed
        else if (caseOpeningsCount % 10 === 0) { 
            guaranteedTier3NextOpening = true;
        }
        saveCaseOpeningData();

        console.log(`[Case Opening] ${caseName} - Openings: ${caseOpeningsCount}, Guaranteed Tier 3 Next: ${guaranteedTier3NextOpening}`);

        // Define item probabilities for Labubu Case - UPDATED LIST (NOW 17 items)
        const labubuItems = [
            // Existing Tiers 1-2
            { name: 'Skeleton Labubu', tier: 1, image: 'SkeletonLabubu.png', price: skinPrices[1] },
            { name: 'Candy Labubu', tier: 1, image: 'CandyLabubu.png', price: skinPrices[1] },
            { name: 'Zombie Labubu', tier: 2, image: 'ZombieLabubu.png', price: skinPrices[2] },
            { name: 'New DeepSea Labubu', tier: 2, image: 'NewDeepSeaLabubu.png', price: skinPrices[2] },
            // Existing Tiers 3-5
            { name: 'Alien Labubu', tier: 3, image: 'AlienLabubu.png', price: skinPrices[3] },
            { name: 'Circus Labubu', tier: 3, image: 'CircusLabubu.png', price: skinPrices[3] },
            { name: 'Grass Labubu', tier: 4, image: 'GrassLabubu.png', price: skinPrices[4] },
            { name: 'Grinch Labubu', tier: 4, image: 'GrinchLabubu.png', price: skinPrices[4] },
            { name: 'Volcanic Labubu', tier: 5, image: 'VolcanicLabubu.png', price: skinPrices[5] },
            // NEW Labubus - Assigning example Tiers, please review
            { name: 'Demon Labubu', tier: 3, image: 'demon-labubu.png', price: skinPrices[3] },      // NEW
            { name: 'Ghost Labubu', tier: 3, image: 'ghost-labubu.png', price: skinPrices[3] },      // NEW
            { name: 'Cyber Labubu', tier: 4, image: 'cyber-labubu.png', price: skinPrices[4] },      // NEW
            { name: 'Ice Crystal Labubu', tier: 4, image: 'ice-crystal-labubu.png', price: skinPrices[4] },// NEW
            { name: 'Venom Labubu', tier: 5, image: 'venom-labubu.png', price: skinPrices[5] },      // NEW
            { name: 'Samurai Labubu', tier: 5, image: 'ronin-labubu.png', price: skinPrices[5] },     // NEW (using ronin-labubu.png)
            { name: 'Glitch Labubu', tier: 5, image: 'glitch-labubu.png', price: skinPrices[5] },     // NEW
            { name: 'Golden Labubu', tier: 6, image: 'golden-labubu.png', price: skinPrices[6] }     // NEW (Highest Tier)
        ];
        
        // Adjusted probabilities for 17 items. YOU MUST FINE-TUNE THESE & GUARANTEED LOGIC.
        // Example distribution (sums to ~0.99, please adjust to sum to 1.0)
        const labubuProbabilities = isGuaranteedTier3 ? 
            // Example: Guaranteed at least Tier 3. Adjust for 17 items.
            // Tier 3 items: Alien, Circus, Demon, Ghost (Indices 4, 5, 9, 10)
            [0, 0, 0, 0,  // Tiers 1-2 zeroed
             0.15, 0.15, // Alien, Circus (Tier 3)
             0, 0, 0,    // Grass, Grinch, Volcanic (T4, T5)
             0.15, 0.15, // Demon, Ghost (Tier 3)
             0.05, 0.05, // Cyber, Ice (Tier 4)
             0.05, 0.05, // Venom, Samurai (Tier 5)
             0.05,       // Glitch (Tier 5)
             0.05]       // Golden (Tier 6)
             // Sum for guaranteed = 0.85 - NEEDS ADJUSTMENT TO SUM TO 1.0
            :
            [ // Normal Probabilities
            // Tier 1 (2 items) ~30%
             0.15, 0.15,
            // Tier 2 (2 items) ~20%
             0.10, 0.10,
            // Tier 3 (4 items: Alien, Circus, Demon, Ghost) ~20%
             0.05, 0.05, 0.05, 0.05, 
            // Tier 4 (4 items: Grass, Grinch, Cyber, Ice) ~15%
             0.04, 0.04, 0.035, 0.035, 
            // Tier 5 (4 items: Volcanic, Venom, Samurai, Glitch) ~10%
             0.025, 0.025, 0.025, 0.025,
            // Tier 6 (1 item: Golden) ~5%
             0.05 
            ]; // Sum: 0.95 - NEEDS ADJUSTMENT TO SUM TO 1.0


        // Select winning item
        const winningItem = selectRandomItemByProbability(labubuItems, labubuProbabilities); // from utils.js
        currentResultSkin = { ...winningItem, type: 'image', caseType: 'labubu' }; // currentResultSkin from config.js

        console.log('[Case Opening] Labubu Winning item selected:', winningItem);

        // Show processing dialog (from uiHandlers.js or utils.js)
        showCustomDialog('Processing your case...', true);

        // Start roulette animation (from roulette.js)
        // Ensure probabilities array passed to roulette matches the items array length.
        await startEnhancedLabubuRouletteAnimation(labubuItems, labubuProbabilities, winningItem.name, casePrice, 'labubu');
        
        // Hide processing dialog (from uiHandlers.js or utils.js)
        hideCustomDialog();

        // Add item to inventory (from inventory.js)
        const uniqueItemId = generateUUID(); // from utils.js
        const addItemResult = await addItemToInventoryDB(winningItem.name, winningItem.tier, winningItem.image, winningItem.price, uniqueItemId);

        if (addItemResult.success) {
            // Update balance if addItemResult provides it (e.g. if cost was only confirmed here)
            if (typeof addItemResult.new_balance !== 'undefined') {
                 userBalance = parseFloat(addItemResult.new_balance);
                 updateBalanceDisplay(); // from user.js
            }
            console.log('[Case Opening] Item added to inventory successfully.');
        } else {
            console.error('[Case Opening] Failed to add item to inventory:', addItemResult.message);
            showToast('Error adding item to inventory. Please contact support.', 'error');
            // Note: Balance was already deducted. Consider refund or manual fix process.
        }

        // Show result (from roulette.js)
        showRouletteResult(currentResultSkin, 'labubu');
        
        // Log activity (from activityLog.js)
        addActivity('case_open', { caseName: caseName, skinName: winningItem.name });
        await updateUserStat('cases_opened', 1); // from user.js

    } catch (error) {
        console.error(`[Case Opening] Error opening ${caseName}:`, error);
        showToast('An error occurred while opening the case.', 'error');
        hideCustomDialog(); 
        // Consider if balance needs to be restored if error happened after deduction but before item grant
    }
}

// Open Dark Aura Case function
async function openDarkAuraCase() {
    const caseName = 'Dark Aura Case';
    const casePrice = 500; // Example price
    console.log(`[Case Opening] Attempting to open ${caseName} for ${casePrice} UCoins`);

    if (userBalance < casePrice) { // userBalance from config.js
        showNotEnoughBalanceDialog(); // from uiHandlers.js or utils.js
        return;
    }

    try {
        showCustomDialog('Processing your request...', true); // from uiHandlers.js or utils.js

        // Deduct balance and log transaction BEFORE animation
        const balanceUpdated = await updateUserBalance(-casePrice, `Opened ${caseName}`, 'case_open'); // from user.js
        if (!balanceUpdated) {
            hideCustomDialog();
            showToast('Transaction failed. Please try again.', 'error'); // from utils.js
            return;
        }

        // Increment opening count and manage guaranteed tier
        caseOpeningsCount++;
        let isGuaranteedTier3 = guaranteedTier3NextOpening;
        if (isGuaranteedTier3) {
            guaranteedTier3NextOpening = false; // Reset after use
        }
        else if (caseOpeningsCount % 10 === 0) { 
            guaranteedTier3NextOpening = true;
        }
        saveCaseOpeningData();

        console.log(`[Case Opening] ${caseName} - Openings: ${caseOpeningsCount}, Guaranteed Tier 3 Next: ${guaranteedTier3NextOpening}`);

        // Define items for Dark Aura Case
        const darkAuraSkins = [
            { name: 'Haunted Desk Calendar', lottie: 'cleaned-deskcalendar-280571.json', tier: 1, price: skinPrices[1] },
            { name: 'Mad Pumpkin Spirit', lottie: 'cleaned-madpumpkin-7551.json', tier: 2, price: skinPrices[2] },
            // NEW ITEM ADDED HERE
            { name: 'Bag of Holding', lottie: 'darkaura-cleaned-lootbag-7239.json', tier: 3, price: skinPrices[3] }, 
            { name: 'Electric Skull', lottie: 'cleaned-electricskull-8221.json', tier: 3, price: skinPrices[3] },
            { name: 'Mystic Crystal Ball', lottie: 'darkaura-cleaned-crystalball-9027.json', tier: 3, price: skinPrices[3] },
            { name: 'Cursed Voodoo Doll', lottie: 'cleaned-voodoodoll-7970.json', tier: 4, price: skinPrices[4] },
            { name: 'Bewitched Ginger Cookie', lottie: 'cleaned-gingercookie-20477.json', tier: 4, price: skinPrices[4] },
            { name: 'Cursed Genie Lamp', lottie: 'darkaura-cleaned-genielamp-4594.json', tier: 4, price: skinPrices[4] },
            { name: 'Mystical Signet Ring', lottie: 'cleaned-signetring-14328.json', tier: 5, price: skinPrices[5] },
            { name: 'Eternal Shadow Rose', lottie: 'darkaura-cleaned-eternalrose-7069.json', tier: 5, price: skinPrices[5] },
            { name: 'Mini Oscar Phantom', lottie: 'cleaned-minioscar-1983.json', tier: 6, price: skinPrices[6] },
            { name: 'Scared Cat Obelisk', lottie: 'cleaned-scaredcat-18595.json', tier: 6, price: skinPrices[6] }
        ];
        // Total 13 items now

        // IMPORTANT: REVIEW AND ADJUST THESE PROBABILITIES TO SUM TO 1.0 for 13 items
        let darkAuraProbabilities = [
            0.20,  // Haunted Desk Calendar (Tier 1)
            0.15,  // Mad Pumpkin Spirit (Tier 2)
            0.10,  // Bag of Holding (Tier 3) - NEW
            0.10,  // Electric Skull (Tier 3)
            0.10,  // Mystic Crystal Ball (Tier 3)
            0.08,  // Cursed Voodoo Doll (Tier 4)
            0.07,  // Bewitched Ginger Cookie (Tier 4)
            0.06,  // Cursed Genie Lamp (Tier 4)
            0.04,  // Mystical Signet Ring (Tier 5)
            0.04,  // Eternal Shadow Rose (Tier 5)
            0.03,  // Mini Oscar Phantom (Tier 6)
            0.03   // Scared Cat Obelisk (Tier 6)
            // SUM: 0.20+0.15+0.10+0.10+0.10+0.08+0.07+0.06+0.04+0.04+0.03+0.03 = 1.00
        ];

        if (isGuaranteedTier3) {
            console.log("[Case Opening] Applying guaranteed Tier 3+ probabilities for Dark Aura Case.");
            // Indices for Tier 3 items: Bag of Holding (2), Electric Skull (3), Mystic Crystal Ball (4)
            // Higher Tiers: 5 through 12
            darkAuraProbabilities = [
                0,    // T1: Haunted Desk Calendar
                0,    // T2: Mad Pumpkin Spirit
                0.20, // T3: Bag of Holding
                0.20, // T3: Electric Skull
                0.20, // T3: Mystic Crystal Ball
                0.08, // T4: Cursed Voodoo Doll
                0.07, // T4: Bewitched Ginger Cookie
                0.06, // T4: Cursed Genie Lamp
                0.06, // T5: Mystical Signet Ring
                0.06, // T5: Eternal Shadow Rose
                0.035,// T6: Mini Oscar Phantom
                0.035 // T6: Scared Cat Obelisk
                // SUM: 0.20+0.20+0.20+0.08+0.07+0.06+0.06+0.06+0.035+0.035 = 1.00
            ];
        }

        const winningDarkAuraItem = selectRandomItemByProbability(darkAuraSkins, darkAuraProbabilities); // from utils.js
        currentResultSkin = { ...winningDarkAuraItem, type: 'lottie', caseType: 'darkaura' }; // currentResultSkin from config.js

        console.log('[Case Opening] Dark Aura Winning item selected:', winningDarkAuraItem);

        // Start roulette animation (from roulette.js)
        await startEnhancedDarkAuraRouletteAnimation(darkAuraSkins, darkAuraProbabilities, winningDarkAuraItem.name, casePrice, 'darkaura');

        hideCustomDialog();

        // Add item to inventory (from inventory.js)
        const darkAuraUniqueId = generateUUID(); // from utils.js
        const darkAuraAddItemResult = await addItemToInventoryDB(winningDarkAuraItem.name, winningDarkAuraItem.tier, winningDarkAuraItem.image, winningDarkAuraItem.price, darkAuraUniqueId);

        if (darkAuraAddItemResult.success) {
            // Update balance if addItemResult provides it
            if (typeof darkAuraAddItemResult.new_balance !== 'undefined') {
                userBalance = parseFloat(darkAuraAddItemResult.new_balance);
                updateBalanceDisplay(); // from user.js
            }
            console.log('[Case Opening] Dark Aura item added to inventory successfully.');
        } else {
            console.error('[Case Opening] Failed to add Dark Aura item to inventory:', darkAuraAddItemResult.message);
            showToast('Error adding item to inventory. Please contact support.', 'error');
            // Note: Balance was already deducted. Consider refund or manual fix process.
        }

        // Show result (from roulette.js)
        showRouletteResult(currentResultSkin, 'darkaura');
        
        addActivity('case_open', { caseName: caseName, skinName: winningDarkAuraItem.name }); // from activityLog.js
        await updateUserStat('cases_opened', 1); // from user.js

    } catch (error) {
        console.error('[Case Opening] Error opening Dark Aura Case:', error);
        hideCustomDialog();
        showToast('An error occurred while opening the Dark Aura case.', 'error');
    }
}

// Helper to show not enough balance dialog (could be moved to utils.js or uiHandlers.js if not there)
function showNotEnoughBalanceDialog() {
    const dialog = document.getElementById('not-enough-balance-dialog');
    if (dialog) {
        dialog.classList.add('active');
    }
}

console.log('[Case Opening] caseOpening.js loaded'); 