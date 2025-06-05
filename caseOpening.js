// Case Opening Logic

// Define global skin prices by tier
window.skinPrices = {
    1: 10,   // Tier 1 (Common)
    2: 25,   // Tier 2 (Rare)
    3: 75,   // Tier 3 (Epic)
    4: 200,  // Tier 4 (Legendary)
    5: 500,  // Tier 5 (Mythic)
    6: 1500  // Tier 6 (Divine)
};

// Define global base prices for cases
window.CASE_PRICES = {
    darkaura: 100, // Base price for Dark Aura case
    labubu: 50,    // Base price for Labubu case
    girlish: 5000,  // NEW: Base price for Girlish case
    newmoney: 10000 // NEW: Base price for New Money case
};

// Define global item arrays for cases
window.labubuItems = [
    { name: 'Skeleton Labubu', tier: 1, image: 'SkeletonLabubu.png', price: window.skinPrices[1] },
    { name: 'Candy Labubu', tier: 1, image: 'CandyLabubu.png', price: window.skinPrices[1] },
    { name: 'Zombie Labubu', tier: 2, image: 'ZombieLabubu.png', price: window.skinPrices[2] },
    { name: 'New DeepSea Labubu', tier: 2, image: 'NewDeepSeaLabubu.png', price: window.skinPrices[2] },
    { name: 'Alien Labubu', tier: 3, image: 'AlienLabubu.png', price: window.skinPrices[3] },
    { name: 'Circus Labubu', tier: 3, image: 'CircusLabubu.png', price: window.skinPrices[3] },
    { name: 'Grass Labubu', tier: 4, image: 'GrassLabubu.png', price: window.skinPrices[4] },
    { name: 'Grinch Labubu', tier: 4, image: 'GrinchLabubu.png', price: window.skinPrices[4] },
    { name: 'Volcanic Labubu', tier: 5, image: 'VolcanicLabubu.png', price: window.skinPrices[5] },
    { name: 'Demon Labubu', tier: 3, image: 'demon-labubu.png', price: window.skinPrices[3] },
    { name: 'Ghost Labubu', tier: 3, image: 'ghost-labubu.png', price: window.skinPrices[3] },
    { name: 'Cyber Labubu', tier: 4, image: 'cyber-labubu.png', price: window.skinPrices[4] },
    { name: 'Ice Crystal Labubu', tier: 4, image: 'ice-crystal-labubu.png', price: window.skinPrices[4] },
    { name: 'Venom Labubu', tier: 5, image: 'venom-labubu.png', price: window.skinPrices[5] },
    { name: 'Samurai Labubu', tier: 5, image: 'ronin-labubu.png', price: window.skinPrices[5] },
    { name: 'Glitch Labubu', tier: 5, image: 'glitch-labubu.png', price: window.skinPrices[5] },
    { name: 'Golden Labubu', tier: 6, image: 'golden-labubu.png', price: window.skinPrices[6] }
];

window.darkAuraSkins = [
    { name: 'Haunted Desk Calendar', lottie: 'cleaned-deskcalendar-280571.json', tier: 1, price: window.skinPrices[1] },
    { name: 'Mad Pumpkin Spirit', lottie: 'cleaned-madpumpkin-7551.json', tier: 2, price: window.skinPrices[2] },
    { name: 'Bag of Holding', lottie: 'darkaura-cleaned-lootbag-7239.json', tier: 3, price: window.skinPrices[3] }, 
    { name: 'Electric Skull', lottie: 'cleaned-electricskull-8221.json', tier: 3, price: window.skinPrices[3] },
    { name: 'Mystic Crystal Ball', lottie: 'darkaura-cleaned-crystalball-9027.json', tier: 3, price: window.skinPrices[3] },
    { name: 'Cursed Voodoo Doll', lottie: 'cleaned-voodoodoll-7970.json', tier: 4, price: window.skinPrices[4] },
    { name: 'Bewitched Ginger Cookie', lottie: 'cleaned-gingercookie-20477.json', tier: 4, price: window.skinPrices[4] },
    { name: 'Cursed Genie Lamp', lottie: 'darkaura-cleaned-genielamp-4594.json', tier: 4, price: window.skinPrices[4] },
    { name: 'Mystical Signet Ring', lottie: 'cleaned-signetring-14328.json', tier: 5, price: window.skinPrices[5] },
    { name: 'Eternal Shadow Rose', lottie: 'darkaura-cleaned-eternalrose-7069.json', tier: 5, price: window.skinPrices[5] },
    { name: 'Mini Oscar Phantom', lottie: 'cleaned-minioscar-1983.json', tier: 6, price: window.skinPrices[6] },
    { name: 'Scared Cat Obelisk', lottie: 'cleaned-scaredcat-18595.json', tier: 6, price: window.skinPrices[6] }
];

// NEW: Girlish Case Items
window.girlishItems = [
    { name: 'Star Notepad', lottie: 'girlish-cleaned-starnotepad-34945.json', tier: 1, price: window.skinPrices[1] },
    { name: 'Ion Gem', lottie: 'girlish-cleaned-iongem-2891.json', tier: 1, price: window.skinPrices[1] },
    { name: 'Lollipop Pop', lottie: 'girlish-cleaned-lolpop-271620.json', tier: 2, price: window.skinPrices[2] },
    { name: 'Homemade Cake', lottie: 'girlish-cleaned-homemadecake-20291.json', tier: 2, price: window.skinPrices[2] },
    { name: 'Neko Helmet', lottie: 'girlish-cleaned-nekohelmet-402.json', tier: 3, price: window.skinPrices[3] },
    { name: 'Cuddly Toybear', lottie: 'girlish-cleaned-toybear-31469.json', tier: 3, price: window.skinPrices[3] },
    { name: 'Plush Pepe', lottie: 'girlish-cleaned-plushpepe-2707.json', tier: 3, price: window.skinPrices[3] },
    { name: 'Astral Shard', lottie: 'girlish-cleaned-astralshard-3087.json', tier: 4, price: window.skinPrices[4] },
    { name: 'Winter Wreath', lottie: 'girlish-cleaned-winterwreath-9594.json', tier: 4, price: window.skinPrices[4] },
    { name: 'Eternal Candle', lottie: 'girlish-cleaned-eternalcandle-17246.json', tier: 5, price: window.skinPrices[5] },
    { name: 'Pastel Lootbag', lottie: 'girlish-cleaned-lootbag-7825.json', tier: 5, price: window.skinPrices[5] }
];

// NEW: New Money Case Items
window.newMoneyItems = [
    { name: 'Golden Lootbag', lottie: 'moneyrain-cleaned-lootbag-4244.json', tier: 1, price: window.skinPrices[1] },
    { name: 'Vintage Record Player', lottie: 'moneyrain-cleaned-recordplayer-5940.json', tier: 1, price: window.skinPrices[1] },
    { name: 'Diamond Star Notepad', lottie: 'moneyrain-cleaned-starnotepad-32502.json', tier: 2, price: window.skinPrices[2] },
    { name: 'Luxury Swiss Watch', lottie: 'moneyrain-cleaned-swisswatch-3145.json', tier: 2, price: window.skinPrices[2] },
    { name: 'Retro Tamagadget', lottie: 'moneyrain-cleaned-tamagadget-1168.json', tier: 3, price: window.skinPrices[3] },
    { name: 'Classic Top Hat', lottie: 'moneyrain-cleaned-tophat-32663.json', tier: 3, price: window.skinPrices[3] },
    { name: 'Golden Toy Bear', lottie: 'moneyrain-cleaned-toybear-35493.json', tier: 4, price: window.skinPrices[4] },
    { name: 'Premium Vintage Cigar', lottie: 'moneyrain-cleaned-vintagecigar-12246.json', tier: 4, price: window.skinPrices[4] },
    { name: 'Gilded Winter Wreath', lottie: 'moneyrain-cleaned-winterwreath-31568.json', tier: 5, price: window.skinPrices[5] }
];

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
        } else {
            console.error('[Case Opening] Failed to add item to inventory:', addItemResult.message);
            showToast('Error adding item to inventory. Please contact support.', 'error');
        }
        showRouletteResult(currentResultSkin, 'labubu');
        addActivity('case_open', { caseName: caseName, skinName: winningItem.name });
        await updateUserStat('cases_opened', selectedQuantity); 

    } catch (error) {
        console.error(`[Case Opening] Error opening ${caseName}:`, error);
        showToast('An error occurred while opening the case.', 'error');
        hideCustomDialog(); 
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
        await startLottieRouletteAnimation(window.darkAuraSkins, darkAuraProbabilities, winningItem.name, finalPrice / selectedQuantity, 'darkaura');
        hideCustomDialog(); 

        const uniqueItemId = generateUUID(); 
        const addItemResult = await addItemToInventoryDB(winningItem.name, winningItem.tier, winningItem.lottie, winningItem.price, uniqueItemId, 'lottie');

        if (addItemResult.success) {
            if (typeof addItemResult.new_balance !== 'undefined') {
                userBalance = parseFloat(addItemResult.new_balance);
                updateBalanceDisplay();
            }
            console.log('[Case Opening] Item added to inventory successfully.');
        } else {
            console.error('[Case Opening] Failed to add item to inventory:', addItemResult.message);
            showToast('Error adding item to inventory. Please contact support.', 'error');
        }
        showLottieRouletteResult(currentResultSkin, 'darkaura'); 
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
        // Assuming a Lottie roulette animation similar to Dark Aura
        await startLottieRouletteAnimation(window.girlishItems, girlishProbabilities, winningItem.name, finalPrice / selectedQuantity, 'girlish');
        hideCustomDialog(); 

        const uniqueItemId = generateUUID(); 
        const addItemResult = await addItemToInventoryDB(winningItem.name, winningItem.tier, winningItem.lottie, winningItem.price, uniqueItemId, 'lottie'); // Specify type as lottie

        if (addItemResult.success) {
            if (typeof addItemResult.new_balance !== 'undefined') {
                userBalance = parseFloat(addItemResult.new_balance);
                updateBalanceDisplay();
            }
            console.log('[Case Opening] Item added to inventory successfully.');
        } else {
            console.error('[Case Opening] Failed to add item to inventory:', addItemResult.message);
            showToast('Error adding item to inventory. Please contact support.', 'error');
        }
        showLottieRouletteResult(currentResultSkin, 'girlish'); 
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
        await startLottieRouletteAnimation(window.newMoneyItems, newMoneyProbabilities, winningItem.name, finalPrice / selectedQuantity, 'newmoney');
        hideCustomDialog(); 

        const uniqueItemId = generateUUID(); 
        const addItemResult = await addItemToInventoryDB(winningItem.name, winningItem.tier, winningItem.lottie, winningItem.price, uniqueItemId, 'lottie');

        if (addItemResult.success) {
            if (typeof addItemResult.new_balance !== 'undefined') {
                userBalance = parseFloat(addItemResult.new_balance);
                updateBalanceDisplay();
            }
            console.log('[Case Opening] Item added to inventory successfully.');
        } else {
            console.error('[Case Opening] Failed to add item to inventory:', addItemResult.message);
            showToast('Error adding item to inventory. Please contact support.', 'error');
        }
        showLottieRouletteResult(currentResultSkin, 'newmoney'); 
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