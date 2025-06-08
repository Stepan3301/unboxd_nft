// Function to attach event listeners for UI interactions
function attachEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            console.log('Nav button clicked:', btn.getAttribute('data-tab'));
            
            const bottomNav = document.querySelector('.bottom-nav');
            // Check if we're in case detail view first and close it
            if (bottomNav && bottomNav.hasAttribute('data-case-detail-open')) {
                console.log('Closing case detail view from nav click');
                document.querySelectorAll('.case-detail').forEach(detail => {
                    detail.classList.remove('active');
                });
                bottomNav.removeAttribute('data-case-detail-open');
                // Restore main content visibility
                const mainContent = document.querySelector('.main');
                if (mainContent) mainContent.classList.add('active'); 
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
            
            if (tabId === 'home-tab') {
                console.log('Home tab selected, updating activity log');
                updateActivityLogUI(); // CORRECTED: from activityLog.js
            }

            // NEW: Add particle burst for cases tab
            if (tabId === 'cases-tab') {
                console.log('Cases tab clicked, creating particle burst.');
                createParticleBurst(btn); // Pass the clicked button element
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

    // Dark Aura Case detail back button
    const darkauraCaseBack = document.getElementById('darkaura-case-back');
    if (darkauraCaseBack) {
        darkauraCaseBack.addEventListener('click', () => {
            hideCaseDetail('darkaura-case-detail');
        });
    }

    // Girlish Case detail back button (NEW)
    const girlishCaseBack = document.getElementById('girlish-case-back');
    if (girlishCaseBack) {
        girlishCaseBack.addEventListener('click', () => {
            hideCaseDetail('girlish-case-detail');
        });
    }

    // New Money Case detail back button (NEW)
    const newmoneyCaseBack = document.getElementById('newmoney-case-back');
    if (newmoneyCaseBack) {
        newmoneyCaseBack.addEventListener('click', () => {
            hideCaseDetail('newmoney-case-detail');
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

    // NEW: Labubu Case Stars Payment Button (calls function from caseOpening.js)
    const openLabubuCaseStarsButton = document.querySelector('.case-detail#labubu-case-detail .open-case-stars-btn');
    if (openLabubuCaseStarsButton) {
        openLabubuCaseStarsButton.addEventListener('click', openLabubuCaseWithStars); // openLabubuCaseWithStars from caseOpening.js
    } else {
        console.warn('Open Labubu Case with Stars button inside detail view not found for event listener.');
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
        console.log('[UI Handlers] TON Connect wallet button event listener attached successfully');
    } else {
        console.error('TON Connect wallet button not found for event listener.');
    }

    // Buy UCoins Modal Buttons
    const addUcoinsBtn = document.getElementById('wallet-add-ucoins-btn');
    const buyUcoinsModal = document.getElementById('buy-ucoins-modal');
    const buyUcoinsModalCloseBtn = buyUcoinsModal ? buyUcoinsModal.querySelector('.close-btn') : null;

    if (addUcoinsBtn && buyUcoinsModal) {
        addUcoinsBtn.addEventListener('click', () => {
            buyUcoinsModal.classList.add('active');
        });
        console.log('[UI Handlers] Add UCoins button event listener attached');
    } else {
        console.warn('[UI Handlers] Add UCoins button or modal not found');
    }

    if (buyUcoinsModalCloseBtn && buyUcoinsModal) {
        buyUcoinsModalCloseBtn.addEventListener('click', () => {
            buyUcoinsModal.classList.remove('active');
        });
        console.log('[UI Handlers] Buy UCoins modal close button event listener attached');
    } else {
        console.warn('[UI Handlers] Buy UCoins modal close button not found');
    }

    // Add event listeners for each buy button in the UCoins modal (calls function from tonConnect.js)
    const buyUcoinButtons = document.querySelectorAll('.buy-ucoin-btn');
    if (buyUcoinButtons.length > 0) {
        buyUcoinButtons.forEach(button => {
            button.addEventListener('click', function() {
                const ucoins = this.dataset.ucoins;
                const tonAmount = this.dataset.ton;
                handleUcoinPackageBuyButtonClick(ucoins, tonAmount); 
            });
        });
        console.log(`[UI Handlers] ${buyUcoinButtons.length} UCoin buy button event listeners attached`);
    } else {
        console.warn('[UI Handlers] No UCoin buy buttons found');
    }

    // Event listener for the new Connect Wallet button inside the UCoins modal (calls function from tonConnect.js)
    const ucoinModalConnectBtn = document.getElementById('ucoin-modal-connect-wallet-btn');
    if (ucoinModalConnectBtn) { 
        ucoinModalConnectBtn.addEventListener('click', handleUcoinModalConnectWalletButtonClick);
        console.log('[UI Handlers] UCoin modal connect wallet button event listener attached');
    } else {
        console.warn('[UI Handlers] UCoin modal connect wallet button not found');
    }

    // Dark Aura Lottie animations click handlers (calls function from roulette.js or caseOpening.js)
    // Ensure this is called after DOM is ready for these elements
    if (document.getElementById('darkaura-case-detail')) { // Check if the container exists
         setupDarkAuraLottieClickHandlers(); // setupDarkAuraLottieClickHandlers from roulette.js
    } else {
        console.warn('Dark Aura case detail not found at initial listener attachment time.');
        // Consider calling this when the darkaura tab/detail becomes active if it loads dynamically
    }

    // Case "View Items" and "Open Case" buttons on case cards in listings
    const featuredButtons = document.querySelectorAll('.featured-btn, .open-btn[data-case]');
    featuredButtons.forEach(button => {
        button.addEventListener('click', function() {
            const caseId = this.dataset.case;
            if (caseId === 'darkaura' || caseId === 'labubu' || caseId === 'girlish' || caseId === 'newmoney') {
                showCaseDetail(caseId);
            } else {
                console.error('Unknown case ID:', caseId);
                hideAllMainViews(); // Hide all main views
                document.getElementById('cases-tab-content').classList.add('active'); // Show cases tab
            }
        });
    });

    console.log('[UI Handlers] All event listeners attached.');
}

// NEW FUNCTION DEFINITION
function hideAllMainViews() {
    console.log('[UI] Attempting to hide all main views and case details.');
    const mainContentAreas = [
        document.getElementById('home-tab-content'),
        document.getElementById('cases-tab-content'),
        document.getElementById('inventory-tab-content'),
        document.getElementById('profile-tab-content'),
        document.getElementById('settings-tab-content') // Assuming settings is a main view
    ];

    mainContentAreas.forEach(view => {
        if (view) {
            view.classList.remove('active');
            console.log(`[UI] Hid main view: ${view.id}`);
        }
    });

    // Also explicitly hide all case detail views
    document.querySelectorAll('.case-detail').forEach(detailView => {
        if (detailView) {
            detailView.classList.remove('active');
            console.log(`[UI] Hid case detail view: ${detailView.id}`);
        }
    });
    
    // The .main container's display is typically handled by the function *showing* a specific view (like a case detail page hiding it, or a tab function showing it).
    // So, hideAllMainViews focuses on the *contents* within .main or elements that overlay .main.
    console.log('[UI] hideAllMainViews finished.');
}
// END NEW FUNCTION DEFINITION

// Function to handle filtering in the Cases tab sub-navigation
function setupCasesSubNavigation() {
    const subNavItems = document.querySelectorAll('.cases-sub-nav-item');
    const caseListings = document.querySelector('.cases-listings');

    if (!subNavItems.length || !caseListings) {
        console.warn('[UI Handlers] Cases sub-navigation elements not found.');
        return;
    }

    subNavItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active state for sub-nav items
            subNavItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const filter = item.getAttribute('data-filter');
            filterCaseListings(filter);
        });
    });
}

// Function to filter case listings based on the selected sub-nav filter
function filterCaseListings(filter) {
    const featuredCaseContainer = document.querySelector('.featured-case-container');
    const popularCaseCards = document.querySelectorAll('.cases-grid .case-card'); // Selects only cards in popular section

    // Handle featured case visibility
    if (featuredCaseContainer) {
        const featuredCaseType = featuredCaseContainer.getAttribute('data-case-type');
        if (filter === 'all' || filter === featuredCaseType || (filter === 'telegram' && featuredCaseType === 'darkaura')) {
            featuredCaseContainer.classList.add('active');
        } else {
            featuredCaseContainer.classList.remove('active');
        }
    }

    // Handle popular cases visibility
    popularCaseCards.forEach(card => {
        const popularCaseType = card.getAttribute('data-case-type');
        if (filter === 'all' || filter === popularCaseType || 
            (filter === 'custom' && popularCaseType === 'labubu') || 
            (filter === 'telegram' && popularCaseType === 'darkaura')) {
            card.classList.add('active'); // Or flex, grid, depending on original display
        } else {
            card.classList.remove('active');
        }
    });
    // If no popular cases match, the .cases-grid might still be visible but empty.
    // Consider hiding .popular-cases-container if all its children are hidden.
}

// Function to control the visibility of the rarity nav
window.updateRarityNavVisibility = function(tabId) {
    const rarityNav = document.getElementById('rarity-nav');
    if (!rarityNav) return;

    if (tabId === 'inventory-tab') {
        rarityNav.classList.add('active');
    } else {
        rarityNav.classList.remove('active');
    }
}

// Function to activate a tab and update UI
window.activateTab = function(tabId) {
    console.log('Activating tab:', tabId);
    // Deactivate all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Deactivate all nav buttons
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.classList.remove('active');
    });

    // Activate the selected tab content
    const selectedTabContent = document.getElementById(tabId);
    if (selectedTabContent) {
        selectedTabContent.classList.add('active');
    } else {
        console.error('Selected tab content not found:', tabId);
        // Fallback to home tab if current tab is invalid
        document.getElementById('home-tab')?.classList.add('active');
        document.querySelector('.nav-btn[data-tab="home-tab"]')?.classList.add('active');
        updateRarityNavVisibility('home-tab');
        return;
    }

    // Activate the selected nav button
    const selectedNavButton = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    if (selectedNavButton) {
        selectedNavButton.classList.add('active');
    } else {
        console.error('Selected nav button not found for tab:', tabId);
        // Fallback for button if content was found but button wasn't (should not happen with correct HTML)
        document.querySelector('.nav-btn[data-tab="home-tab"]')?.classList.add('active');
    }
    
    // Update rarity nav visibility based on the new active tab
    updateRarityNavVisibility(tabId);

    // Scroll to top of the page
    window.scrollTo(0, 0);
    console.log(tabId, 'activated.');
}

// NEW FUNCTION to display items in the case detail view
function displayCaseItems(caseId, items, gridId) {
    console.log(`[UI] Displaying items for ${caseId} in grid ${gridId}`);
    const grid = document.getElementById(gridId);
    if (!grid) {
        console.error('Items grid not found for ID:', gridId);
        return;
    }
    grid.innerHTML = ''; // Clear previous items

    // Determine base path for Lottie/image files
    let itemBasePath = ''; // Default for root
    if (caseId === 'labubu') {
        itemBasePath = ''; // Labubu images are co-located with index.html (in LottieAnimations/)
    } else if (caseId === 'darkaura' || caseId === 'girlish') {
        itemBasePath = '/unboxd_nft/'; // Dark Aura & Girlish Lotties are at the site root, accessed via /project_name/
    }
    
    console.log(`[UI] Using itemBasePath: '${itemBasePath}' for case ${caseId}`);

    if (!items || items.length === 0) {
        console.warn(`[UI] No items to display for ${caseId} or items array is empty/undefined.`);
        grid.innerHTML = '<p style="color: white; text-align: center;">No items defined for this case.</p>';
        // Attempt to load items if they are not yet available (retry logic)
        if (caseId === 'darkaura' && !window.darkAuraSkins) {
            console.log('[UI] darkAuraSkins not ready, retrying displayCaseItems for darkaura...');
            setTimeout(() => displayCaseItems(caseId, window.darkAuraSkins, gridId), 1000);
            return;
        } else if (caseId === 'labubu' && !window.labubuItems) {
            console.log('[UI] labubuItems not ready, retrying displayCaseItems for labubu...');
            setTimeout(() => displayCaseItems(caseId, window.labubuItems, gridId), 1000);
            return;
        } else if (caseId === 'girlish' && !window.girlishItems) { // NEW: Retry for girlish
            console.log('[UI] girlishItems not ready, retrying displayCaseItems for girlish...');
            setTimeout(() => displayCaseItems(caseId, window.girlishItems, gridId), 1000);
            return;
        }
        return;
    }
    
    // Sort items by tier (rarest first) - assuming tier is a number, higher is rarer
    const sortedItems = [...items].sort((a, b) => b.tier - a.tier);

    sortedItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'inventory-item-card'; // Re-using inventory item card style

        const imageContainer = document.createElement('div');
        imageContainer.className = 'item-image-container';

        let playerOrImg;
        if (item.lottie) {
            const lottiePath = itemBasePath + item.lottie;
            console.log(`[UI] Creating Lottie for ${item.name}: ${lottiePath}`);
            playerOrImg = document.createElement('lottie-player');
            playerOrImg.setAttribute('src', lottiePath);
            playerOrImg.setAttribute('background', 'transparent');
            playerOrImg.setAttribute('speed', '1');
            // playerOrImg.setAttribute('autoplay', ''); // Removed autoplay
            // playerOrImg.setAttribute('loop', ''); // Removed loop
            playerOrImg.style.width = '100%';
            playerOrImg.style.height = '100%';
            itemCard.addEventListener('click', () => {
                playerOrImg.stop();
                playerOrImg.play();
            });
        } else if (item.image) {
            const imagePath = itemBasePath + item.image;
            console.log(`[UI] Creating Image for ${item.name}: ${imagePath}`);
            playerOrImg = document.createElement('img');
            playerOrImg.src = imagePath;
            playerOrImg.alt = item.name;
        }
        imageContainer.appendChild(playerOrImg);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'item-info';
        const nameDiv = document.createElement('div');
        nameDiv.className = 'item-name';
        nameDiv.textContent = item.name;
        
        // Tier text removed as per previous request
        // const tierDiv = document.createElement('div');
        // tierDiv.className = `item-tier tier-${item.tier}`;
        // tierDiv.textContent = `Tier ${item.tier}`;

        infoDiv.appendChild(nameDiv);
        // infoDiv.appendChild(tierDiv); // Tier text removed

        itemCard.appendChild(imageContainer);
        itemCard.appendChild(infoDiv);
        grid.appendChild(itemCard);
    });
}

// NEW FUNCTION to handle quantity selector and price updates for a case
function initializeCaseControls(caseId, basePrice) {
    const caseDetailView = document.getElementById(`${caseId}-case-detail`);
    if (!caseDetailView) {
        console.error(`[UI] Case detail view not found for ${caseId} to initialize controls.`);
        // Attempt to load items if they are not yet available (retry logic)
        if (caseId === 'darkaura' && (!window.CASE_PRICES || !window.CASE_PRICES.darkaura)) {
            console.log('[UI] CASE_PRICES not ready, retrying initializeCaseControls for darkaura...');
            setTimeout(() => initializeCaseControls(caseId, window.CASE_PRICES ? window.CASE_PRICES.darkaura : undefined), 1000);
            return;
        } else if (caseId === 'labubu' && (!window.CASE_PRICES || !window.CASE_PRICES.labubu)) {
            console.log('[UI] CASE_PRICES not ready, retrying initializeCaseControls for labubu...');
            setTimeout(() => initializeCaseControls(caseId, window.CASE_PRICES ? window.CASE_PRICES.labubu : undefined), 1000);
            return;
        } else if (caseId === 'girlish' && (!window.CASE_PRICES || !window.CASE_PRICES.girlish)) { // NEW: Retry for girlish
            console.log('[UI] CASE_PRICES not ready, retrying initializeCaseControls for girlish...');
            setTimeout(() => initializeCaseControls(caseId, window.CASE_PRICES ? window.CASE_PRICES.girlish : undefined), 1000);
            return;
        }
        return;
    }

    const quantityButtons = caseDetailView.querySelectorAll('.quantity-btn');
    const openCaseBtn = caseDetailView.querySelector('.open-case-btn');
    const priceValueSpan = openCaseBtn.querySelector('.price-value');

    if (!openCaseBtn || !priceValueSpan) {
        console.error(`[UI] Open case button or price span not found for ${caseId}.`);
        return;
    }

    function updatePrice(quantity, discount) {
        const discountedPrice = Math.round(basePrice * quantity * (1 - discount / 100));
        priceValueSpan.textContent = discountedPrice;
        openCaseBtn.dataset.selectedQuantity = quantity;
        openCaseBtn.dataset.finalPrice = discountedPrice;
    }

    quantityButtons.forEach(button => {
        button.addEventListener('click', () => {
            quantityButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const quantity = parseInt(button.dataset.quantity);
            const discount = parseInt(button.dataset.discount);
            updatePrice(quantity, discount);
        });
    });

    // Initialize with the default selected button (quantity 1)
    const defaultButton = caseDetailView.querySelector('.quantity-btn[data-quantity="1"]');
    if (defaultButton) {
        defaultButton.click(); // Simulate click to set initial price and active state
    } else { // Fallback if no button with data-quantity="1" is found (should not happen with current HTML)
        updatePrice(1, 0); 
    }
}

// Functions to show/hide case detail views
function showCaseDetail(caseId) {
    // Hide all tabs and other detail views
    document.querySelectorAll('.tab-content, .case-detail').forEach(el => el.classList.remove('active'));
    window.updateRarityNavVisibility(null); // Hide rarity nav by passing a non-inventory tab or null

    // Hide main content area and set nav state for detail view
    const mainContent = document.querySelector('.main');
    if (mainContent) mainContent.classList.remove('active');
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) bottomNav.setAttribute('data-case-detail-open', 'true');

    if (caseId === 'girlish') {
        console.log('[UI] showCaseDetail called for Girlish case.');
    }

    let caseDetailElement;
    let caseTitle = '';
    let itemsToDisplay = [];
    let gridId = '';
    let basePrice = 0;
    let caseThemeControlsClass, caseThemeDetailClass;

    // Define a retry mechanism for fetching case data
    const maxRetries = 5;
    let currentRetry = 0;

    function attemptToLoadCaseData() {
        caseItems = null;

        // Simplified data retrieval from centralized config
        basePrice = window.CASE_PRICES ? window.CASE_PRICES[caseId] : null;

        const caseDataMap = {
            'darkaura': {
                title: 'Dark Aura Collection',
                elementId: 'darkaura-case-detail',
                gridId: 'darkaura-skins-grid',
                items: window.darkAuraSkins,
                themeControls: 'darkaura-theme-controls',
                themeDetail: 'darkaura-theme-detail'
            },
            'labubu': {
                title: 'Labubu & Friends',
                elementId: 'labubu-case-detail',
                gridId: 'labubu-skins-grid',
                items: window.labubuItems,
                themeControls: 'labubu-theme-controls',
                themeDetail: 'labubu-theme-detail'
            },
            'girlish': {
                title: 'Girlish Collection',
                elementId: 'girlish-case-detail',
                gridId: 'girlish-skins-grid',
                items: window.girlishItems,
                themeControls: 'girlish-theme-controls',
                themeDetail: 'girlish-theme-detail'
            },
            'newmoney': {
                title: 'New Money Collection',
                elementId: 'newmoney-case-detail',
                gridId: 'newmoney-skins-grid',
                items: window.newMoneyItems,
                themeControls: 'newmoney-theme-controls',
                themeDetail: 'newmoney-theme-detail'
            }
        };

        const caseData = caseDataMap[caseId];

        if (!caseData) {
            console.error('Unknown case ID:', caseId);
            hideAllMainViews(); // Hide all main views
            document.getElementById('cases-tab-content').classList.add('active'); // Show cases tab
            return;
        }

        caseTitle = caseData.title;
        caseDetailElement = document.getElementById(caseData.elementId);
        skinsGridId = caseData.gridId;
        caseItems = caseData.items;
        caseThemeControlsClass = caseData.themeControls;
        caseThemeDetailClass = caseData.themeDetail;


        if (!caseItems || typeof basePrice === 'undefined' || basePrice === null) {
            currentRetry++;
            if (currentRetry <= maxRetries) {
                console.warn(`[showCaseDetail] Data for ${caseId} not ready. Retry ${currentRetry}/${maxRetries}.`);
                setTimeout(attemptToLoadCaseData, 300); // Retry after 300ms
                return;
            }
            console.error(`[showCaseDetail] Failed to load data for ${caseId} after ${maxRetries} retries.`);
            showToast('Error loading case details. Please try again.', 'error');
            hideAllMainViews(); // Hide all main views
            document.getElementById('cases-tab-content').classList.add('active'); // Show cases tab
            return;
        }

        // All data is loaded, proceed to display
        console.log(`[showCaseDetail] Displaying detail for ${caseId}. Items:`, caseItems, `Base Price: ${basePrice}`);
        
        // Update title
        const titleElement = document.getElementById(caseId + '-case-title');
        if (titleElement) {
            titleElement.textContent = caseTitle;
        } else {
            console.warn("[showCaseDetail] Case title element not found for", caseId);
        }

        // Update case detail classes if needed (though they are already on the elements)
        if (!caseDetailElement.classList.contains(caseThemeDetailClass)) {
            caseDetailElement.classList.add(caseThemeDetailClass);
        }
        const controlsElement = caseDetailElement.querySelector('.case-controls');
        if (controlsElement && !controlsElement.classList.contains(caseThemeControlsClass)) {
            controlsElement.classList.add(caseThemeControlsClass);
        }

        hideAllMainViews();
        caseDetailElement.classList.add('active');
        document.getElementById('app').classList.add('case-detail-open');

        // Base path for Lottie files - should be from project root for GitHub Pages
        // const itemBasePath = '/unboxd_nft/'; // itemBasePath is now determined within displayCaseItems
        displayCaseItems(caseId, caseItems, skinsGridId); // CORRECTED ARGUMENT ORDER & REMOVED itemBasePath from call
        initializeCaseControls(caseId, basePrice);
    }

    attemptToLoadCaseData(); // Initial attempt to load data
}

function hideCaseDetail(caseDetailId) {
    const caseDetailElement = document.getElementById(caseDetailId);
    const mainContent = document.querySelector('.main');
    const bottomNav = document.querySelector('.bottom-nav');

    if (caseDetailElement && mainContent && bottomNav) {
        caseDetailElement.classList.remove('active');
        mainContent.classList.add('active'); // Show main content
        bottomNav.removeAttribute('data-case-detail-open');
        document.getElementById('app').classList.remove('case-detail-open');
        console.log(`Hiding case detail: ${caseDetailId}`);
        activateTab('cases-tab'); // Explicitly activate the cases tab content
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

// Function to create NFT particle burst effect
function createParticleBurst(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // NFT image URL
    const nftImageUrl = 'princess_pepe.png'; // Updated image path
    
    // Number of particles to create
    const particleCount = 20;
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('img');
        
        // Set the image source
        particle.src = nftImageUrl;
        
        // Set styles for the particle
        particle.style.position = 'fixed';
        particle.style.width = '30px'; // Small size for the NFT
        particle.style.height = '30px';
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1000';
        particle.style.borderRadius = '4px'; // Slight rounding of corners
        
        // Random initial rotation
        const rotation = Math.random() * 360;
        particle.style.transform = `rotate(${rotation}deg)`;
        
        // Random movement parameters
        const angle = Math.random() * Math.PI * 2; // Random direction
        const velocity = 1.5 + Math.random() * 2.5; // Random speed
        const rotationSpeed = (Math.random() - 0.5) * 15; // Random rotation speed
        const lifetime = 800 + Math.random() * 1200; // Random lifetime (800-2000ms)
        const scale = 0.5 + Math.random() * 0.5; // Random size variation
        
        // Apply initial scale
        particle.style.transform = `rotate(${rotation}deg) scale(${scale})`;
        
        document.body.appendChild(particle);
        
        let startTime = Date.now();
        
        function animateParticle() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / lifetime;
            
            if (progress >= 1) {
                particle.remove();
                return;
            }
            
            const distance = velocity * elapsed * 0.1;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance - (progress * progress * 40); // Add gravity
            const currentRotation = rotation + (rotationSpeed * elapsed * 0.1);
            
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.opacity = 1 - progress;
            particle.style.transform = `rotate(${currentRotation}deg) scale(${scale * (1 - progress * 0.3)})`;
            
            requestAnimationFrame(animateParticle);
        }
        
        requestAnimationFrame(animateParticle);
    }
}

// Placeholder for setupDarkAuraLottieClickHandlers, assume it's in roulette.js or caseOpening.js
// async function setupDarkAuraLottieClickHandlers() { console.log('Placeholder: setupDarkAuraLottieClickHandlers called'); }

console.log('[UI Handlers] uiHandlers.js loaded'); 