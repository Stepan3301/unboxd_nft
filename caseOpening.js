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
    // const casePrice = 250; // Example price - Now determined by CASE_PRICES and quantity selector
    const openButton = document.querySelector('#labubu-case-detail .case-controls .open-case-btn');
    const selectedQuantity = parseInt(openButton.dataset.selectedQuantity || '1');
    const finalPrice = parseInt(openButton.dataset.finalPrice || window.CASE_PRICES.labubu.toString());

    console.log(`[Case Opening] Attempting to open ${selectedQuantity} ${caseName}(s) for ${finalPrice} UCoins`);

    if (userBalance < finalPrice) { // userBalance from config.js
        showNotEnoughBalanceDialog(); // from uiHandlers.js or utils.js
        return;
    }

    try {
        // Deduct balance and log transaction BEFORE animation
        const balanceUpdated = await updateUserBalance(-finalPrice, `Opened ${selectedQuantity} x ${caseName}`, 'case_open_multiple'); // from user.js
        if (!balanceUpdated) {
            showToast('Transaction failed. Please try again.', 'error'); // from utils.js
            return;
        }

        // For multiple openings, this loop and logic will need significant rework.
        // The current structure processes one item at a time for animation and inventory addition.
        // For now, we'll focus on fixing single item display, assuming quantity logic will be expanded later.
        // THIS IS A PLACEHOLDER FOR MULTI-OPEN LOGIC
        if (selectedQuantity > 1) {
            console.warn("[Case Opening] Multi-case opening logic is not fully implemented beyond UI price calculation.");
            // For now, just open one for demonstration, but use total price
        }

        caseOpeningsCount++;
        let isGuaranteedTier3 = guaranteedTier3NextOpening;
        if (isGuaranteedTier3) {
            guaranteedTier3NextOpening = false; 
        }
        else if (caseOpeningsCount % 10 === 0) { 
            guaranteedTier3NextOpening = true;
        }
        saveCaseOpeningData();

        console.log(`[Case Opening] ${caseName} - Openings: ${caseOpeningsCount}, Guaranteed Tier 3 Next: ${guaranteedTier3NextOpening}`);

        // Probabilities - using window.labubuItems now
        const labubuProbabilities = isGuaranteedTier3 ? 
            [0,0,0,0,0.15,0.15,0,0,0,0.15,0.15,0.05,0.05,0.05,0.05,0.05,0.05] // Adjusted for 17 items & Tier3+ guarantee
            :
            [0.15,0.15,0.10,0.10,0.05,0.05,0.05,0.05,0.04,0.04,0.035,0.035,0.025,0.025,0.025,0.025,0.05];

        const winningItem = selectRandomItemByProbability(window.labubuItems, labubuProbabilities); 
        currentResultSkin = { ...winningItem, type: 'image', caseType: 'labubu' }; 

        console.log('[Case Opening] Labubu Winning item selected:', winningItem);
        showCustomDialog('Processing your case...', true);
        await startEnhancedLabubuRouletteAnimation(window.labubuItems, labubuProbabilities, winningItem.name, finalPrice / selectedQuantity, 'labubu'); // Pass per-item price
        hideCustomDialog();

        const uniqueItemId = generateUUID(); 
        const addItemResult = await addItemToInventoryDB(winningItem.name, winningItem.tier, winningItem.image, winningItem.price, uniqueItemId);

        if (addItemResult.success) {
            if (typeof addItemResult.new_balance !== 'undefined') {
                 userBalance = parseFloat(addItemResult.new_balance);
                 updateBalanceDisplay(); 
            }
            console.log('[Case Opening] Item added to inventory successfully.');
            
            // Add unique_id to currentResultSkin for roulette functionality
            currentResultSkin.unique_id = addItemResult.unique_id || uniqueItemId;
        } else {
            console.error('[Case Opening] Failed to add item to inventory:', addItemResult.message);
            showToast('Error adding item to inventory. Please contact support.', 'error');
        }
        // showRouletteResult is now called by the roulette animation function
        addActivity('case_open', { caseName: caseName, skinName: winningItem.name });
        await updateUserStat('cases_opened', selectedQuantity); 

    } catch (error) {
        console.error(`[Case Opening] Error opening ${caseName}:`, error);
        showToast('An error occurred while opening the case.', 'error');
        hideCustomDialog(); 
    }
}

// NEW: Open Labubu Case with Telegram Stars
async function openLabubuCaseWithStars() {
    const caseName = 'Labubu Case (Stars)';
    const starsPrice = 1; // 1 Telegram Star
    
    console.log(`[Case Opening] Attempting to open ${caseName} for ${starsPrice} Stars`);

    try {
        // Initiate Telegram Stars payment using proper API flow
        const paymentResult = await initiateStarsPayment('labubu', starsPrice);
        
        if (!paymentResult.success) {
            showToast(paymentResult.message || 'Payment failed. Please try again.', 'error');
            return;
        }

        console.log(`[Case Opening] ${caseName} payment flow initiated successfully`);

    } catch (error) {
        console.error(`[Case Opening] Error initiating ${caseName} payment:`, error);
        showToast('An error occurred while initiating payment. Please try again.', 'error');
    }
}

// NEW: Function to handle case opening after successful Stars payment
async function processStarsPaymentSuccess(caseType, paymentId) {
    const caseName = `${caseType} Case (Stars)`;
    
    console.log(`[Case Opening] Processing successful Stars payment for ${caseName}`);

    try {
        // Show processing dialog
        showCustomDialog('🎉 Payment successful! Opening your case...', true);
        
        // Increment case opening count
        caseOpeningsCount++;
        let isGuaranteedTier3 = guaranteedTier3NextOpening;
        if (isGuaranteedTier3) {
            guaranteedTier3NextOpening = false; 
        }
        else if (caseOpeningsCount % 10 === 0) { 
            guaranteedTier3NextOpening = true;
        }
        saveCaseOpeningData();

        console.log(`[Case Opening] ${caseName} - Openings: ${caseOpeningsCount}, Guaranteed Tier 3 Next: ${guaranteedTier3NextOpening}`);

        let probabilities, items, animationFunction;
        
        // Set up case-specific data with proper validation
        switch (caseType.toLowerCase()) {
            case 'labubu':
                items = window.labubuItems;
                probabilities = isGuaranteedTier3 ? 
                    [0,0,0,0,0.15,0.15,0,0,0,0.15,0.15,0.05,0.05,0.05,0.05,0.05,0.05]
                    :
                    [0.15,0.15,0.10,0.10,0.05,0.05,0.05,0.05,0.04,0.04,0.035,0.035,0.025,0.025,0.025,0.025,0.05];
                animationFunction = startEnhancedLabubuRouletteAnimation;
                break;
                
            case 'darkaura':
                items = window.darkAuraItems;
                probabilities = isGuaranteedTier3 ? 
                    // Adjust probabilities for DarkAura guaranteed Tier 3
                    [0,0,0,0,0.2,0.2,0.2,0.2,0.2] // Example - adjust based on actual items
                    :
                    [0.2,0.2,0.15,0.15,0.1,0.1,0.05,0.025,0.025]; // Example - adjust based on actual items
                animationFunction = startEnhancedDarkAuraRouletteAnimation; // Assuming this exists
                break;
                
            case 'girlish':
                items = window.girlishItems;
                probabilities = isGuaranteedTier3 ? 
                    // Adjust probabilities for Girlish guaranteed Tier 3
                    [0,0,0,0,0.25,0.25,0.25,0.25] // Example - adjust based on actual items
                    :
                    [0.25,0.25,0.2,0.15,0.1,0.025,0.015,0.01]; // Example - adjust based on actual items
                animationFunction = startEnhancedGirlishRouletteAnimation; // Assuming this exists
                break;
                
            case 'newmoney':
                items = window.newMoneyItems;
                probabilities = isGuaranteedTier3 ? 
                    // Adjust probabilities for NewMoney guaranteed Tier 3
                    [0,0,0,0,0.3,0.3,0.4] // Example - adjust based on actual items
                    :
                    [0.3,0.3,0.25,0.1,0.025,0.015,0.01]; // Example - adjust based on actual items
                animationFunction = startEnhancedNewMoneyRouletteAnimation; // Assuming this exists
                break;
                
            default:
                throw new Error(`Case type ${caseType} not supported for Stars payment`);
        }

        // Validate items array
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error(`No items found for case type ${caseType}`);
        }

        // Validate probabilities array
        if (!probabilities || probabilities.length !== items.length) {
            throw new Error(`Probability array mismatch for case type ${caseType}`);
        }

        const winningItem = selectRandomItemByProbability(items, probabilities);
        currentResultSkin = { 
            ...winningItem, 
            type: 'image', 
            caseType: caseType, 
            paymentMethod: 'stars', 
            paymentId: paymentId 
        }; 

        console.log(`[Case Opening] ${caseName} winning item selected:`, winningItem);
        
        // Start the appropriate roulette animation
        if (animationFunction && typeof animationFunction === 'function') {
            await animationFunction(items, probabilities, winningItem.name, 0, caseType);
        } else {
            console.warn(`[Case Opening] Animation function not found for ${caseType}, using default`);
            // Fallback to Labubu animation if others don't exist
            await startEnhancedLabubuRouletteAnimation(items, probabilities, winningItem.name, 0, caseType);
        }
        
        hideCustomDialog();

        // Add item to inventory
        const uniqueItemId = generateUUID(); 
        const addItemResult = await addItemToInventoryDB(winningItem.name, winningItem.tier, winningItem.image, winningItem.price, uniqueItemId);

        if (addItemResult.success) {
            console.log('[Case Opening] Item added to inventory successfully.');
            if (typeof showToast === 'function') {
                showToast(`🎁 ${winningItem.name} added to inventory!`, 'success');
            }
            
            // Add unique_id to currentResultSkin for roulette functionality
            currentResultSkin.unique_id = addItemResult.unique_id || uniqueItemId;
        } else {
            console.error('[Case Opening] Failed to add item to inventory:', addItemResult.message);
            showToast('Error adding item to inventory. Please contact support.', 'error');
        }
        
        // Show result and add activity - result is shown by roulette animation function
        addActivity('case_open_stars', { 
            caseName: caseName, 
            skinName: winningItem.name,
            paymentId: paymentId,
            starsAmount: 1 // Could be dynamic based on case type
        });
        await updateUserStat('cases_opened', 1);
        await updateUserStat('stars_spent', 1); // New stat for stars spending

        return { success: true, item: winningItem };

    } catch (error) {
        console.error(`[Case Opening] Error processing Stars payment for ${caseName}:`, error);
        hideCustomDialog();
        
        if (typeof showToast === 'function') {
            showToast(`Error opening ${caseName}. Please contact support.`, 'error');
        }
        
        return { success: false, message: error.message };
    }
}

// Open Dark Aura Case function
async function openDarkAuraCase() {
    const caseName = 'Dark Aura Case';
    // const casePrice = 500; // Example price - Now determined by CASE_PRICES and quantity selector
    const openButton = document.querySelector('#darkaura-case-detail .case-controls .open-case-btn');
    const selectedQuantity = parseInt(openButton.dataset.selectedQuantity || '1');
    const finalPrice = parseInt(openButton.dataset.finalPrice || window.CASE_PRICES.darkaura.toString());

    console.log(`[Case Opening] Attempting to open ${selectedQuantity} ${caseName}(s) for ${finalPrice} UCoins`);

    if (userBalance < finalPrice) { 
        showNotEnoughBalanceDialog(); 
        return;
    }

    try {
        showCustomDialog('Processing your request...', true); 
        const balanceUpdated = await updateUserBalance(-finalPrice, `Opened ${selectedQuantity} x ${caseName}`, 'case_open_multiple'); 
        if (!balanceUpdated) {
            hideCustomDialog();
            showToast('Transaction failed. Please try again.', 'error'); 
            return;
        }

        if (selectedQuantity > 1) {
            console.warn("[Case Opening] Multi-case opening logic is not fully implemented beyond UI price calculation.");
        }

        caseOpeningsCount++;
        let isGuaranteedTier3 = guaranteedTier3NextOpening;
        if (isGuaranteedTier3) {
            guaranteedTier3NextOpening = false; 
        }
        else if (caseOpeningsCount % 10 === 0) { 
            guaranteedTier3NextOpening = true;
        }
        saveCaseOpeningData();

        console.log(`[Case Opening] ${caseName} - Openings: ${caseOpeningsCount}, Guaranteed Tier 3 Next: ${guaranteedTier3NextOpening}`);
        
        // Probabilities - using window.darkAuraSkins now (12 items)
        let darkAuraProbabilities = [
            0.20,0.15,0.10,0.10,0.10,0.08,0.07,0.06,0.04,0.04,0.03,0.03 
        ];

        if (isGuaranteedTier3) {
            console.log("[Case Opening] Applying guaranteed Tier 3+ probabilities for Dark Aura Case.");
            darkAuraProbabilities = [
                0,0,0.20,0.20,0.20,0.08,0.07,0.06,0.06,0.05,0.04,0.04 // Adjusted for 12 items & Tier3+ guarantee
            ];
        }

        const winningItem = selectRandomItemByProbability(window.darkAuraSkins, darkAuraProbabilities);
        currentResultSkin = { ...winningItem, type: 'lottie', caseType: 'darkaura' };

        console.log('[Case Opening] Dark Aura Winning item selected:', winningItem);
        await startEnhancedDarkAuraRouletteAnimation(window.darkAuraSkins, darkAuraProbabilities, winningItem.name, finalPrice / selectedQuantity, 'darkaura');
        hideCustomDialog(); 

        const uniqueItemId = generateUUID(); 
        const addItemResult = await addItemToInventoryDB(winningItem.name, winningItem.tier, winningItem.lottie, winningItem.price, uniqueItemId);

        if (addItemResult.success) {
            if (typeof addItemResult.new_balance !== 'undefined') {
                userBalance = parseFloat(addItemResult.new_balance);
                updateBalanceDisplay();
            }
            console.log('[Case Opening] Item added to inventory successfully.');
            
            // Add unique_id to currentResultSkin for roulette functionality
            currentResultSkin.unique_id = addItemResult.unique_id || uniqueItemId;
        } else {
            console.error('[Case Opening] Failed to add item to inventory:', addItemResult.message);
            showToast('Error adding item to inventory. Please contact support.', 'error');
        }
        // showRouletteResult is now called by the roulette animation function 
        addActivity('case_open', { caseName: caseName, skinName: winningItem.name });
        await updateUserStat('cases_opened', selectedQuantity);

    } catch (error) {
        console.error(`[Case Opening] Error opening ${caseName}:`, error);
        showToast('An error occurred while opening the case.', 'error');
        hideCustomDialog(); 
    }
}

// NEW: Open Girlish Case function
async function openGirlishCase() {
    const caseName = 'Girlish Case';
    const openButton = document.querySelector('#girlish-case-detail .case-controls .open-case-btn');
    const selectedQuantity = parseInt(openButton.dataset.selectedQuantity || '1');
    const finalPrice = parseInt(openButton.dataset.finalPrice || window.CASE_PRICES.girlish.toString());

    console.log(`[Case Opening] Attempting to open ${selectedQuantity} ${caseName}(s) for ${finalPrice} UCoins`);

    if (userBalance < finalPrice) { 
        showNotEnoughBalanceDialog(); 
        return;
    }

    try {
        showCustomDialog('Processing your request...', true); 
        const balanceUpdated = await updateUserBalance(-finalPrice, `Opened ${selectedQuantity} x ${caseName}`, 'case_open_multiple'); 
        if (!balanceUpdated) {
            hideCustomDialog();
            showToast('Transaction failed. Please try again.', 'error'); 
            return;
        }

        if (selectedQuantity > 1) {
            console.warn("[Case Opening] Multi-case opening logic is not fully implemented beyond UI price calculation for Girlish case.");
        }

        caseOpeningsCount++; // Assuming this global counter is still relevant
        let isGuaranteedTier3 = guaranteedTier3NextOpening; // And this pity system too
        if (isGuaranteedTier3) {
            guaranteedTier3NextOpening = false; 
        }
        else if (caseOpeningsCount % 10 === 0) { 
            guaranteedTier3NextOpening = true;
        }
        saveCaseOpeningData();

        console.log(`[Case Opening] ${caseName} - Openings: ${caseOpeningsCount}, Guaranteed Tier 3 Next: ${guaranteedTier3NextOpening}`);
        
        // Probabilities for Girlish Case (11 items, 5 tiers)
        // T1:2, T2:2, T3:3, T4:2, T5:2
        let girlishProbabilities = [
            0.20, 0.20, // Tier 1 (40%)
            0.15, 0.15, // Tier 2 (30%)
            0.08, 0.08, 0.07, // Tier 3 (23%)
            0.02, 0.02, // Tier 4 (4%)
            0.01, 0.01  // Tier 5 (2%)
        ]; // Sum = 0.99 - adjust slightly
        // Re-adjusting for sum to 1:
        girlishProbabilities = [
            0.20, 0.20,       // T1 (40%)
            0.15, 0.15,       // T2 (30%)
            0.08, 0.08, 0.07, // T3 (23%)
            0.025, 0.025,     // T4 (5%)
            0.01, 0.01        // T5 (2%) - Total 100%
        ];


        if (isGuaranteedTier3) {
            console.log("[Case Opening] Applying guaranteed Tier 3+ probabilities for Girlish Case.");
            // Keep T1, T2 at 0, distribute their probability to T3, T4, T5 proportionally
            // Original P(T1+T2) = 0.40 + 0.30 = 0.70
            // P(T3) = 0.23, P(T4) = 0.05, P(T5) = 0.02. Sum = 0.30
            // New T3 = 0.23 + (0.23/0.30)*0.70 = 0.23 + 0.536 = 0.766 (approx)
            // New T4 = 0.05 + (0.05/0.30)*0.70 = 0.05 + 0.116 = 0.166 (approx)
            // New T5 = 0.02 + (0.02/0.30)*0.70 = 0.02 + 0.046 = 0.066 (approx)
            // Let's simplify: Give T3 bulk of it.
            girlishProbabilities = [
                0, 0,           // T1
                0, 0,           // T2
                0.30, 0.30, 0.20, // T3 (80%)
                0.05, 0.05,     // T4 (10%)
                0.05, 0.05      // T5 (10%)
            ];
        }

        const winningItem = selectRandomItemByProbability(window.girlishItems, girlishProbabilities);
        currentResultSkin = { ...winningItem, type: 'lottie', caseType: 'girlish' }; // Ensure type is lottie

        console.log('[Case Opening] Girlish Case Winning item selected:', winningItem);
        // Using the enhanced Girlish roulette animation
        await startEnhancedGirlishRouletteAnimation(window.girlishItems, girlishProbabilities, winningItem.name, finalPrice / selectedQuantity, 'girlish');
        hideCustomDialog(); 

        const uniqueItemId = generateUUID(); 
        const addItemResult = await addItemToInventoryDB(winningItem.name, winningItem.tier, winningItem.lottie, winningItem.price, uniqueItemId);

        if (addItemResult.success) {
            if (typeof addItemResult.new_balance !== 'undefined') {
                userBalance = parseFloat(addItemResult.new_balance);
                updateBalanceDisplay();
            }
            console.log('[Case Opening] Item added to inventory successfully.');
            
            // Add unique_id to currentResultSkin for roulette functionality
            currentResultSkin.unique_id = addItemResult.unique_id || uniqueItemId;
        } else {
            console.error('[Case Opening] Failed to add item to inventory:', addItemResult.message);
            showToast('Error adding item to inventory. Please contact support.', 'error');
        }
        // showRouletteResult is now called by the roulette animation function 
        addActivity('case_open', { caseName: caseName, skinName: winningItem.name });
        await updateUserStat('cases_opened', selectedQuantity);

    } catch (error) {
        console.error(`[Case Opening] Error opening ${caseName}:`, error);
        showToast('An error occurred while opening the case.', 'error');
        hideCustomDialog(); 
    }
}

window.openGirlishCase = openGirlishCase;

// NEW: Open New Money Case function
async function openNewMoneyCase() {
    const caseName = 'New Money Case';
    const openButton = document.querySelector('#newmoney-case-detail .case-controls .open-case-btn');
    const selectedQuantity = parseInt(openButton.dataset.selectedQuantity || '1');
    const finalPrice = parseInt(openButton.dataset.finalPrice || window.CASE_PRICES.newmoney.toString());

    console.log(`[Case Opening] Attempting to open ${selectedQuantity} ${caseName}(s) for ${finalPrice} UCoins`);

    if (userBalance < finalPrice) { 
        showNotEnoughBalanceDialog(); 
        return;
    }

    try {
        showCustomDialog('Processing your lavish request...', true); 
        const balanceUpdated = await updateUserBalance(-finalPrice, `Opened ${selectedQuantity} x ${caseName}`, 'case_open_multiple'); 
        if (!balanceUpdated) {
            hideCustomDialog();
            showToast('Transaction failed. Please try again.', 'error'); 
            return;
        }

        if (selectedQuantity > 1) {
            console.warn("[Case Opening] Multi-case opening logic is not fully implemented beyond UI price calculation for New Money case.");
        }

        caseOpeningsCount++;
        let isGuaranteedTier3 = guaranteedTier3NextOpening;
        if (isGuaranteedTier3) {
            guaranteedTier3NextOpening = false; 
        }
        else if (caseOpeningsCount % 10 === 0) { 
            guaranteedTier3NextOpening = true;
        }
        saveCaseOpeningData();

        console.log(`[Case Opening] ${caseName} - Openings: ${caseOpeningsCount}, Guaranteed Tier 3 Next: ${guaranteedTier3NextOpening}`);
        
        // Probabilities for New Money Case (9 items, 5 tiers)
        // T1:2, T2:2, T3:2, T4:2, T5:1
        // Adjusted probabilities for 9 items
        let newMoneyProbabilities = [
            0.22, 0.22,       // T1 (44%)
            0.15, 0.15,       // T2 (30%)
            0.08, 0.08,       // T3 (16%)
            0.03, 0.03,       // T4 (6%)
            0.04            // T5 (4%) - Total 100%
        ];

        if (isGuaranteedTier3) {
            console.log("[Case Opening] Applying guaranteed Tier 3+ probabilities for New Money Case.");
            newMoneyProbabilities = [
                0, 0,           // T1
                0, 0,           // T2
                0.35, 0.35,     // T3 (70%)
                0.10, 0.10,     // T4 (20%)
                0.10            // T5 (10%)
            ];
        }

        const winningItem = selectRandomItemByProbability(window.newMoneyItems, newMoneyProbabilities);
        currentResultSkin = { ...winningItem, type: 'lottie', caseType: 'newmoney' };

        console.log('[Case Opening] New Money Case Winning item selected:', winningItem);
        await startEnhancedNewMoneyRouletteAnimation(window.newMoneyItems, newMoneyProbabilities, winningItem.name, finalPrice / selectedQuantity, 'newmoney');
        hideCustomDialog(); 

        const uniqueItemId = generateUUID(); 
        const addItemResult = await addItemToInventoryDB(winningItem.name, winningItem.tier, winningItem.lottie, winningItem.price, uniqueItemId);

        if (addItemResult.success) {
            if (typeof addItemResult.new_balance !== 'undefined') {
                userBalance = parseFloat(addItemResult.new_balance);
                updateBalanceDisplay();
            }
            console.log('[Case Opening] Item added to inventory successfully.');
            
            // Add unique_id to currentResultSkin for roulette functionality
            currentResultSkin.unique_id = addItemResult.unique_id || uniqueItemId;
        } else {
            console.error('[Case Opening] Failed to add item to inventory:', addItemResult.message);
            showToast('Error adding item to inventory. Please contact support.', 'error');
        }
        // showRouletteResult is now called by the roulette animation function 
        addActivity('case_open', { caseName: caseName, skinName: winningItem.name });
        await updateUserStat('cases_opened', selectedQuantity); 

    } catch (error) {
        console.error(`[Case Opening] Error opening ${caseName}:`, error);
        showToast('An error occurred while opening the case.', 'error');
        hideCustomDialog(); 
    }
}
window.openNewMoneyCase = openNewMoneyCase;

// Helper to show not enough balance dialog (could be moved to utils.js or uiHandlers.js if not there)
function showNotEnoughBalanceDialog() {
    const dialog = document.getElementById('not-enough-balance-dialog');
    if (dialog) {
        dialog.classList.add('active');
    }
}

console.log('[Case Opening] caseOpening.js loaded'); 