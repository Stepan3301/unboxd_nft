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

        // Define item probabilities for Dark Aura Case (darkAuraSkins from config.js - now 11 items)
        const darkAuraProbabilities = [
            // Tier 1 (1 item)
            0.20, // Haunted Desk Calendar
            // Tier 2 (1 item)
            0.15, // Mad Pumpkin Spirit
            // Tier 3 (2 items)
            0.10, // Electric Skull
            0.10, // Mystic Crystal Ball (NEW)
            // Tier 4 (3 items)
            0.08, // Cursed Voodoo Doll
            0.08, // Bewitched Ginger Cookie 
            0.08, // Cursed Genie Lamp (NEW)
            // Tier 5 (2 items)
            0.05, // Mystical Signet Ring
            0.05, // Eternal Shadow Rose (NEW)
            // Tier 6 (2 items)
            0.005, // Mini Oscar Phantom
            0.005  // Scared Cat Obelisk
        ]; // Sum: 0.9 (adjust to sum to 1, or handle shortfall in selection logic)

        // Adjust probabilities if guaranteed Tier 3
        // Tier 3 items are now at index 2 and 3
        if (isGuaranteedTier3) {
            // Zero out lower tiers
            darkAuraProbabilities[0] = 0; // Tier 1
            darkAuraProbabilities[1] = 0; // Tier 2
            
            // Distribute 100% among Tier 3 and higher
            // For simplicity, giving Tier 3 items a higher chance, then distributing rest
            darkAuraProbabilities[2] = 0.3; // Electric Skull (Tier 3)
            darkAuraProbabilities[3] = 0.3; // Mystic Crystal Ball (Tier 3 - NEW)
            
            // Zero out tiers below the guaranteed one if they were not already handled
            // For higher tiers, you might want to keep their relative probabilities or adjust.
            // For now, let's set the others to have some chance, summing up to 0.4
            darkAuraProbabilities[4] = 0.08; // Cursed Voodoo Doll
            darkAuraProbabilities[5] = 0.08; // Bewitched Ginger Cookie 
            darkAuraProbabilities[6] = 0.08; // Cursed Genie Lamp (NEW)
            darkAuraProbabilities[7] = 0.05; // Mystical Signet Ring
            darkAuraProbabilities[8] = 0.05; // Eternal Shadow Rose (NEW)
            darkAuraProbabilities[9] = 0.03; // Mini Oscar Phantom
            darkAuraProbabilities[10] =0.03; // Scared Cat Obelisk
            // This sums to 1.0 for the guaranteed case. Please review & adjust distribution.
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