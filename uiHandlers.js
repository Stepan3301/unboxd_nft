// Function to attach event listeners for UI interactions
function attachEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            console.log('Nav button clicked:', btn.getAttribute('data-tab'));
            
            const bottomNav = document.querySelector('.bottom-nav');
            // Check if we're in case detail view first and close it
            if (bottomNav.hasAttribute('data-case-detail-open')) {
                console.log('Closing case detail view from nav click');
                document.querySelectorAll('.case-detail').forEach(detail => {
                    detail.classList.remove('active');
                });
                bottomNav.removeAttribute('data-case-detail-open');
                // Restore main content visibility
                const mainContent = document.querySelector('.main');
                if (mainContent) mainContent.style.display = 'block'; 
            }
            
            // Get the tab ID
            const tabId = btn.getAttribute('data-tab');
            activateTab(tabId); // Use the new activateTab function
            
            // Perform tab-specific actions (these will call functions from other modules)
            if (tabId === 'inventory-tab') {
                console.log('Inventory tab selected, refreshing inventory');
                await getUserInventory(); // from inventory.js
            }
            
            if (tabId === 'profile-tab') {
                console.log('Profile tab selected, updating user data');
                await updateUserData(); // from user.js
            }
            
            if (tabId === 'cases-tab') {
                console.log('Home tab selected, updating activity log');
                updateActivityLog(); // from activityLog.js
            }
        });
    });

    // Case view buttons (Featured and Popular)
    document.querySelectorAll('.featured-btn[data-case="labubu"], .open-btn[data-case="labubu"]').forEach(button => {
        button.addEventListener('click', () => {
            const caseId = button.dataset.case;
            console.log('View Case button clicked for:', caseId);
            if (caseId === 'labubu') {
                showCaseDetail('labubu-case-detail');
            }
        });
    });

    // Case detail back button for Labubu
    const labubuCaseBack = document.getElementById('labubu-case-back');
    if (labubuCaseBack) {
        labubuCaseBack.addEventListener('click', () => {
            hideCaseDetail('labubu-case-detail');
        });
    }

    // Dark Aura Case view buttons
    document.querySelectorAll('.featured-btn[data-case="darkaura"]:not(.open-case-btn), .open-btn[data-case="darkaura"]:not(.open-case-btn)').forEach(button => {
        button.addEventListener('click', () => {
            const caseId = button.dataset.case;
            console.log('View Case button clicked for:', caseId);
            if (caseId === 'darkaura') {
                showCaseDetail('darkaura-case-detail');
            }
        });
    });

    // Dark Aura Case detail back button
    const darkauraCaseBack = document.getElementById('darkaura-case-back');
    if (darkauraCaseBack) {
        darkauraCaseBack.addEventListener('click', () => {
            hideCaseDetail('darkaura-case-detail');
        });
    }

    // Daily reward button (calls function from dailyRewards.js)
    const dailyRewardBtnEl = document.getElementById('daily-reward-btn');
    if (dailyRewardBtnEl) {
         dailyRewardBtnEl.addEventListener('click', claimDailyReward); // claimDailyReward from dailyRewards.js
    } else {
        console.error("Daily reward button not found for event listener attachment.");
    }

    // Daily reward dialog close button
    const dailyRewardDialogBtnEl = document.getElementById('daily-reward-dialog-btn');
    if (dailyRewardDialogBtnEl) {
        dailyRewardDialogBtnEl.addEventListener('click', function() {
            const dailyRewardDialogEl = document.getElementById('daily-reward-dialog');
            if (dailyRewardDialogEl) dailyRewardDialogEl.classList.remove('active');
        });
    } else {
         console.error("Daily reward dialog button not found.");
    }
    
    // Not enough balance dialog close button
    const notEnoughBalanceBtn = document.getElementById('not-enough-balance-btn');
    if (notEnoughBalanceBtn) {
        notEnoughBalanceBtn.addEventListener('click', () => {
            const dialog = document.getElementById('not-enough-balance-dialog');
            if (dialog) dialog.classList.remove('active');
        });
    }

    // Custom dialog close button (for general purpose dialog)
    const dialogBtn = document.getElementById('dialog-btn');
    if (dialogBtn) {
        dialogBtn.addEventListener('click', () => {
            hideCustomDialog(); // Assumes hideCustomDialog is defined, perhaps in utils.js or here
        });
    }
    
    // Roulette close button (calls function from roulette.js or caseOpening.js)
    const rouletteCloseBtn = document.getElementById('roulette-close');
    if (rouletteCloseBtn) {
        rouletteCloseBtn.addEventListener('click', handleRouletteClose); // handleRouletteClose from roulette.js
    } else {
        console.error('Roulette close button not found');
    }

    // Roulette sell button (calls function from roulette.js or caseOpening.js)
    const rouletteSellBtn = document.getElementById('roulette-sell');
    if (rouletteSellBtn) {
        rouletteSellBtn.addEventListener('click', handleRouletteSell); // handleRouletteSell from roulette.js
    } else {
        console.error('Roulette sell button not found');
    }

    // Labubu Case Open Button (calls function from caseOpening.js)
    const openLabubuCaseButton = document.querySelector('.case-detail#labubu-case-detail .open-case-btn');
    if (openLabubuCaseButton) {
        openLabubuCaseButton.addEventListener('click', openLabubuCase); // openLabubuCase from caseOpening.js
    } else {
        console.warn('Open Labubu Case button inside detail view not found for event listener.');
    }

    // Dark Aura Case Open Button (calls function from caseOpening.js)
    const openDarkAuraCaseButton = document.querySelector('.case-detail#darkaura-case-detail .open-case-btn');
    if (openDarkAuraCaseButton) {
        openDarkAuraCaseButton.addEventListener('click', openDarkAuraCase); // openDarkAuraCase from caseOpening.js
    } else {
        console.warn('Open Dark Aura Case button inside detail view not found for event listener.');
    }

    // TON Connect Wallet Button (calls function from tonConnect.js)
    const tonConnectWalletButton = document.getElementById('ton-connect-wallet-button');
    if (tonConnectWalletButton) {
        tonConnectWalletButton.addEventListener('click', handleTonConnectWalletButtonClick); 
    } else {
        console.error('TON Connect wallet button not found for event listener.');
    }

    // Buy UCoins Modal Buttons
    const addUcoinsBtn = document.getElementById('wallet-add-ucoins-btn');
    const buyUcoinsModal = document.getElementById('buy-ucoins-modal');
    const buyUcoinsModalCloseBtn = document.getElementById('buy-ucoins-modal-close-btn');

    if (addUcoinsBtn && buyUcoinsModal) {
        addUcoinsBtn.addEventListener('click', () => {
            buyUcoinsModal.classList.add('active');
        });
    }

    if (buyUcoinsModalCloseBtn && buyUcoinsModal) {
        buyUcoinsModalCloseBtn.addEventListener('click', () => {
            buyUcoinsModal.classList.remove('active');
        });
    }

    // Add event listeners for each buy button in the UCoins modal (calls function from tonConnect.js)
    document.querySelectorAll('.ucoin-package-buy-btn').forEach(button => {
        button.addEventListener('click', function() {
            const ucoins = this.dataset.ucoins;
            const tonAmount = this.dataset.ton;
            handleUcoinPackageBuyButtonClick(ucoins, tonAmount); 
        });
    });

    // Event listener for the new Connect Wallet button inside the UCoins modal (calls function from tonConnect.js)
    const ucoinModalConnectBtn = document.getElementById('ucoin-modal-connect-wallet-btn');
    if (ucoinModalConnectBtn) { 
        ucoinModalConnectBtn.addEventListener('click', handleUcoinModalConnectWalletButtonClick);
    }

    // Dark Aura Lottie animations click handlers (calls function from roulette.js or caseOpening.js)
    // Ensure this is called after DOM is ready for these elements
    if (document.getElementById('darkaura-case-detail')) { // Check if the container exists
         setupDarkAuraLottieClickHandlers(); // setupDarkAuraLottieClickHandlers from roulette.js
    } else {
        console.warn('Dark Aura case detail not found at initial listener attachment time.');
        // Consider calling this when the darkaura tab/detail becomes active if it loads dynamically
    }

    console.log('[UI Handlers] All event listeners attached.');
}

// Function to control the visibility of the rarity nav
function updateRarityNavVisibility(tabId) {
    const rarityNav = document.getElementById('rarity-nav');
    if (!rarityNav) return;
    if (tabId === 'shop-tab' || tabId === 'inventory-tab') { // Show for shop or inventory
        rarityNav.style.display = 'flex'; // Or use a class like .show
    } else {
        rarityNav.style.display = 'none'; // Or remove the class
    }
}

// Function to activate a tab and update UI
function activateTab(tabId) {
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(nav => {
        nav.classList.remove('active');
    });

    // Add active class to the clicked/target button
    const targetNavBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    if (targetNavBtn) {
        targetNavBtn.classList.add('active');
    }

    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show the selected tab
    const targetTabContent = document.getElementById(tabId);
    if (targetTabContent) {
        targetTabContent.classList.add('active');
        console.log('Showing tab:', tabId);
    } else {
        console.error('Target tab content not found:', tabId);
    }

    // Update rarity navigation visibility based on tab
    updateRarityNavVisibility(tabId);
}

// Functions to show/hide case detail views
function showCaseDetail(caseDetailId) {
    const caseDetailElement = document.getElementById(caseDetailId);
    const mainContent = document.querySelector('.main');
    const bottomNav = document.querySelector('.bottom-nav');

    if (caseDetailElement && mainContent && bottomNav) {
        caseDetailElement.classList.add('active');
        mainContent.style.display = 'none'; // Hide main content
        bottomNav.setAttribute('data-case-detail-open', 'true');
        console.log(`Showing case detail: ${caseDetailId}`);
    } else {
        console.error(`Elements for showing case detail ${caseDetailId} not found.`);
    }
}

function hideCaseDetail(caseDetailId) {
    const caseDetailElement = document.getElementById(caseDetailId);
    const mainContent = document.querySelector('.main');
    const bottomNav = document.querySelector('.bottom-nav');

    if (caseDetailElement && mainContent && bottomNav) {
        caseDetailElement.classList.remove('active');
        mainContent.style.display = 'block'; // Show main content
        bottomNav.removeAttribute('data-case-detail-open');
        console.log(`Hiding case detail: ${caseDetailId}`);
    } else {
        console.error(`Elements for hiding case detail ${caseDetailId} not found.`);
    }
}

// General purpose custom dialog hide function (if not already in utils.js)
function hideCustomDialog() {
    const dialog = document.getElementById('custom-dialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
}

// Placeholder for setupDarkAuraLottieClickHandlers, assume it's in roulette.js or caseOpening.js
// async function setupDarkAuraLottieClickHandlers() { console.log('Placeholder: setupDarkAuraLottieClickHandlers called'); }

console.log('[UI Handlers] uiHandlers.js loaded'); 