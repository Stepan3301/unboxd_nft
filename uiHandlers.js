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

    // Case "View Items" and "Open Case" buttons on case cards in listings
    document.querySelectorAll('.featured-btn, .open-btn[data-case]').forEach(button => {
        button.addEventListener('click', () => {
            const caseId = button.dataset.case;
            if (caseId === 'girlish') {
                console.log('[UI] Girlish case card \'View Items\' button clicked, data-case:', caseId);
            }
            if (caseId) {
                showCaseDetail(caseId);
            }
        });
    });

    console.log('[UI Handlers] All event listeners attached.');
}

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
            featuredCaseContainer.style.display = 'block';
        } else {
            featuredCaseContainer.style.display = 'none';
        }
    }

    // Handle popular cases visibility
    popularCaseCards.forEach(card => {
        const popularCaseType = card.getAttribute('data-case-type');
        if (filter === 'all' || filter === popularCaseType || 
            (filter === 'custom' && popularCaseType === 'labubu') || 
            (filter === 'telegram' && popularCaseType === 'darkaura')) {
            card.style.display = 'block'; // Or flex, grid, depending on original display
        } else {
            card.style.display = 'none';
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
        rarityNav.style.display = 'flex';
    } else {
        rarityNav.style.display = 'none';
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
        itemBasePath = 'img/labubu/';
    }
    // For 'darkaura' and 'girlish', Lottie files are expected at the root, so itemBasePath remains ''.
    
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
    hideRarityNav(); // Hide rarity nav when showing case details

    if (caseId === 'girlish') {
        console.log('[UI] showCaseDetail called for Girlish case.');
    }

    let caseDetailElement;
    let caseTitle = '';
    let itemsToDisplay = [];
    let gridId = '';
    let basePrice = 0;

    if (caseId === 'darkaura') {
        caseDetailElement = document.getElementById('darkaura-case-detail');
        caseTitle = 'Dark Aura Case';
        itemsToDisplay = window.darkAuraSkins;
        gridId = 'darkaura-skins-grid';
        basePrice = window.CASE_PRICES.darkaura;
    } else if (caseId === 'labubu') {
        caseDetailElement = document.getElementById('labubu-case-detail');
        caseTitle = 'Labubu & Friends';
        itemsToDisplay = window.labubuItems;
        gridId = 'labubu-skins-grid';
        basePrice = window.CASE_PRICES.labubu;
    } else if (caseId === 'girlish') { // NEW: Girlish case
        caseDetailElement = document.getElementById('girlish-case-detail');
        caseTitle = 'Girlish Collection';
        itemsToDisplay = window.girlishItems;
        gridId = 'girlish-skins-grid';
        basePrice = window.CASE_PRICES.girlish;
    }

    if (caseDetailElement) {
        document.getElementById(caseId + '-case-title').textContent = caseTitle;
        displayCaseItems(caseId, itemsToDisplay, gridId); // Pass caseId here
        initializeCaseControls(caseId, basePrice);
        caseDetailElement.classList.add('active');
        caseDetailElement.scrollTop = 0; // Scroll to top
    } else {
        console.error('Case detail element not found for:', caseId);
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