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

        // Define item probabilities for Labubu Case - UPDATED LIST
        const labubuItems = [
            // Assuming Tiers based on file names and some visual cues if any
            { name: 'Skeleton Labubu', tier: 1, image: 'SkeletonLabubu.png' },
            { name: 'Candy Labubu', tier: 1, image: 'CandyLabubu.png' },
            { name: 'Zombie Labubu', tier: 2, image: 'ZombieLabubu.png' },
            { name: 'New DeepSea Labubu', tier: 2, image: 'NewDeepSeaLabubu.png' },
            { name: 'Alien Labubu', tier: 3, image: 'AlienLabubu.png' },
            { name: 'Circus Labubu', tier: 3, image: 'CircusLabubu.png' },
            { name: 'Grass Labubu', tier: 4, image: 'GrassLabubu.png' },
            { name: 'Grinch Labubu', tier: 4, image: 'GrinchLabubu.png' },
            { name: 'Volcanic Labubu', tier: 5, image: 'VolcanicLabubu.png' }
        ];
        
        // Adjusted probabilities for 9 items. You should fine-tune these.
        // Tier 1: ~50%, Tier 2: ~30%, Tier 3: ~15%, Tier 4: ~4%, Tier 5: ~1%
        const labubuProbabilities = isGuaranteedTier3 ? 
            [0, 0, 0, 0, 0.3, 0.3, 0.2, 0.1, 0.1] : // Example: Guaranteed at least Tier 3 (Alien/Circus) or higher
            [0.25, 0.25,       // Tier 1 (50%)
             0.15, 0.15,       // Tier 2 (30%)
             0.075, 0.075,    // Tier 3 (15%)
             0.02, 0.02,       // Tier 4 (4%)
             0.01];            // Tier 5 (1%)


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
        const addItemResult = await addItemToInventoryDB(winningItem.name, winningItem.tier, winningItem.image, uniqueItemId);

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

        // Define item probabilities for Dark Aura Case (darkAuraSkins from config.js)
        const darkAuraProbabilities = [
            0.35, // Tier 1: Haunted Desk Calendar
            0.25, // Tier 2: Mad Pumpkin Spirit
            isGuaranteedTier3 ? 1 : 0.20, // Tier 3: Electric Skull (guaranteed if applicable, else 20%)
            0.10, // Tier 4: Cursed Voodoo Doll
            0.05, // Tier 4: Bewitched Ginger Cookie 
            0.03, // Tier 5: Mystical Signet Ring
            0.01, // Tier 6: Mini Oscar Phantom
            0.01  // Tier 6: Scared Cat Obelisk
        ];
        // Adjust probabilities if guaranteed Tier 3
        if (isGuaranteedTier3) {
            darkAuraProbabilities[0] = 0; // No Tier 1
            darkAuraProbabilities[1] = 0; // No Tier 2
            // Tier 3 is 1 (100%)
            darkAuraProbabilities[3] = 0;
            darkAuraProbabilities[4] = 0;
            darkAuraProbabilities[5] = 0;
            darkAuraProbabilities[6] = 0;
            darkAuraProbabilities[7] = 0;
        }

        const winningDarkAuraItem = selectRandomItemByProbability(darkAuraSkins, darkAuraProbabilities); // from utils.js
        currentResultSkin = { ...winningDarkAuraItem, type: 'lottie', caseType: 'darkaura' }; // currentResultSkin from config.js

        console.log('[Case Opening] Dark Aura Winning item selected:', winningDarkAuraItem);

        // Start roulette animation (from roulette.js)
        await startEnhancedDarkAuraRouletteAnimation(darkAuraSkins, darkAuraProbabilities, winningDarkAuraItem.name, casePrice, 'darkaura');

        hideCustomDialog();

        // Add item to inventory (from inventory.js)
        const uniqueItemId = generateUUID(); // from utils.js
        const addItemResult = await addItemToInventoryDB(winningDarkAuraItem.name, winningDarkAuraItem.tier, winningDarkAuraItem.image, uniqueItemId);

        if (addItemResult.success) {
            if (typeof addItemResult.new_balance !== 'undefined') {
                userBalance = parseFloat(addItemResult.new_balance);
                updateBalanceDisplay(); // from user.js
            }
            console.log('[Case Opening] Item added to Dark Aura inventory successfully.');
        } else {
            console.error('[Case Opening] Failed to add Dark Aura item to inventory:', addItemResult.message);
            showToast('Error adding item to inventory. Please contact support.', 'error');
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