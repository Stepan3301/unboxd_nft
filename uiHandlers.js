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
function updateRarityNavVisibility(tabId) {
    const rarityNav = document.getElementById('rarity-nav');
    if (!rarityNav) return;

    if (tabId === 'inventory-tab') {
        rarityNav.style.display = 'flex';
    } else {
        rarityNav.style.display = 'none';
    }
}

// Function to activate a tab and update UI
function activateTab(tabId) {
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
function displayCaseItems(caseId) {
    let itemsArray;
    let targetGridId;
    let itemBasePath = ''; // Base path for images/lotties
    let itemType = 'image'; // Default to image

    console.log('[UI Handlers] Displaying items for caseId:', caseId);

    if (caseId === 'darkaura') { // Changed to match baseCaseId
        if (typeof window.darkAuraSkins === 'undefined' || typeof window.skinPrices === 'undefined') {
            console.error('[UI Handlers] darkAuraSkins array or skinPrices is not defined globally. Cannot display items.');
            itemsArray = []; // Fallback to empty if not found
        } else {
            itemsArray = window.darkAuraSkins;
        }
        targetGridId = 'darkaura-skins-grid';
        itemBasePath = 'lottie/darkaura/';
        itemType = 'lottie';
    } else if (caseId === 'labubu') { // Changed to match baseCaseId
        if (typeof window.labubuItems === 'undefined' || typeof window.skinPrices === 'undefined') {
            console.error('[UI Handlers] labubuItems array or skinPrices is not defined globally. Cannot display items.');
            itemsArray = []; // Fallback to empty if not found
        } else {
            itemsArray = window.labubuItems;
        }
        targetGridId = 'labubu-skins-grid';
        itemBasePath = ''; // Assuming Labubu images are in root or paths are full in data
                           // If they are in 'lottie/labubu/', this should be 'lottie/labubu/'
                           // For now, let's assume root or full path.
    } else {
        console.error('[UI Handlers] Unknown caseId for displayCaseItems:', caseId);
        return;
    }

    const grid = document.getElementById(targetGridId);
    if (!grid) {
        console.error('[UI Handlers] Target grid #' + targetGridId + ' not found.');
        return;
    }

    grid.innerHTML = ''; // Clear previous items

    if (!itemsArray || itemsArray.length === 0) {
        grid.innerHTML = '<p class="empty-inventory-message" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.7);">No items to display for this case.</p>';
        console.warn('[UI Handlers] No items found for case:', caseId);
        return;
    }

    itemsArray.forEach(item => {
        const card = document.createElement('div');
        // Using inventory-item-card structure for consistency if possible, or skin-card
        card.className = `inventory-item-card tier-${item.tier}`; // Or skin-card if preferred

        let imageElementHTML = '';
        if (itemType === 'lottie' && item.lottie) {
            // Lottie files are expected to be in a subfolder like 'lottie/darkaura/'
            const lottieSrc = itemBasePath + item.lottie;
            imageElementHTML = `
                <div class="item-image-container">
                    <lottie-player class="static-lottie" src="${lottieSrc}" background="transparent" speed="1" loop autoplay></lottie-player>
                </div>`;
        } else if (itemType === 'image' && item.image) {
            // Image paths: if itemBasePath is set, prepend it. Otherwise, use item.image directly.
            const imgSrc = itemBasePath ? itemBasePath + item.image : item.image;
            imageElementHTML = `
                <div class="item-image-container">
                    <img src="${imgSrc}" alt="${item.name}">
                </div>`;
        }

        card.innerHTML = `
            ${imageElementHTML}
            <div class="item-info">
                <h3>${item.name}</h3>
                <div class="item-tier rarity-text tier-${item.tier}" style="text-transform: capitalize;">Tier ${item.tier}</div>
                ${'' /* Price is not typically shown on each item card in a "possible drops" list */}
            </div>
        `;
        grid.appendChild(card);
    });
    console.log('[UI Handlers] Displayed ' + itemsArray.length + ' items in ' + targetGridId);
}

// Functions to show/hide case detail views
function showCaseDetail(caseDetailId) {
    const caseDetailElement = document.getElementById(caseDetailId);
    const mainContent = document.querySelector('.main');
    const bottomNav = document.querySelector('.bottom-nav');

    if (caseDetailElement && mainContent && bottomNav) {
        // Hide all other case-detail views first
        document.querySelectorAll('.case-detail').forEach(cd => {
            if (cd.id !== caseDetailId) {
                cd.classList.remove('active');
            }
        });

        caseDetailElement.classList.add('active');
        mainContent.style.display = 'none'; // Hide main content
        bottomNav.setAttribute('data-case-detail-open', 'true');
        console.log('Showing case detail: ' + caseDetailId);
        
        const baseCaseId = caseDetailId.replace('-case-detail', '');
        displayCaseItems(baseCaseId); // Call to display items
    } else {
        console.error('Elements for showing case detail ' + caseDetailId + ' not found.');
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