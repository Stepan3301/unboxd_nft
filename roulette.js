// Roulette and Animation Logic

// lottieAnimations and lottiePlayerInstance are globals from config.js (or should be)
// For now, lottieAnimations will be initialized here, lottiePlayerInstance managed per animation.
let lottieAnimations = {}; // Stores preloaded Lottie animation data
// currentResultSkin is a global from config.js, set by caseOpening.js before roulette starts

// Create a proper state manager for roulette instances
class RouletteStateManager {
    constructor() {
        this.activeRoulettes = new Map(); // Stores active Lottie player instances for roulettes
        this.currentWinningItem = null; // Stores the item that should be displayed as won
    }

    setActiveRoulette(caseType, playerInstance) {
        this.activeRoulettes.set(caseType, playerInstance);
        console.log(`[RouletteSM] Active roulette set for ${caseType}:`, playerInstance);
    }

    getActiveRoulette(caseType) {
        return this.activeRoulettes.get(caseType);
    }

    removeActiveRoulette(caseType) {
        const player = this.activeRoulettes.get(caseType);
        if (player && typeof player.destroy === 'function') {
            player.destroy(); // Clean up Lottie player
        }
        this.activeRoulettes.delete(caseType);
        console.log(`[RouletteSM] Active roulette removed for ${caseType}`);
    }

    setCurrentWinningItem(item) {
        this.currentWinningItem = item;
    }

    getCurrentWinningItem() {
        return this.currentWinningItem;
    }

    clearState() {
        this.activeRoulettes.forEach(player => {
            if (player && typeof player.destroy === 'function') {
                player.destroy();
            }
        });
        this.activeRoulettes.clear();
        this.currentWinningItem = null;
        console.log('[RouletteSM] State cleared');
    }
}
const rouletteStateManager = new RouletteStateManager();

// Enhanced Lottie Preloading System for All Cases
async function preloadLottieAnimations() {
    console.log('[Roulette] Preloading Lottie animations for all cases...');
    
    // Define all case collections
    const caseCollections = [
        { name: 'darkAuraSkins', data: window.darkAuraSkins },
        { name: 'girlishItems', data: window.girlishItems },
        { name: 'newMoneyItems', data: window.newMoneyItems },
        { name: 'mainCharacterItems', data: window.mainCharacterItems }
    ];
    
    let totalPreloaded = 0;
    
    for (const collection of caseCollections) {
        if (!collection.data) {
            console.warn(`[Roulette] ${collection.name} not available yet, skipping preload`);
            continue;
        }
        
        console.log(`[Roulette] Preloading ${collection.name}...`);
        
        for (const item of collection.data) {
            if (item.type === 'lottie' && item.image) {
                try {
                    const response = await fetch(`${item.image}`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch Lottie: ${item.image}, status: ${response.status}`);
                    }
                    lottieAnimations[item.image] = await response.json();
                    console.log(`[Roulette] Preloaded Lottie: ${item.image}`);
                    totalPreloaded++;
                } catch (error) {
                    console.error(`[Roulette] Error preloading Lottie ${item.image}:`, error);
                }
            }
        }
    }
    
    console.log(`[Roulette] Lottie preloading complete. Total preloaded: ${totalPreloaded}`);
}

// Setup click handlers for Dark Aura Lottie animations on the case detail page
async function setupDarkAuraLottieClickHandlers() {
    try {
        await customElements.whenDefined('lottie-player');
        console.log('[Roulette] lottie-player element defined, setting up click handlers for static Dark Aura Lotties.');

        const darkAuraLotties = document.querySelectorAll('#darkaura-case-detail .static-lottie');
        
        darkAuraLotties.forEach(lottiePlayer => {
            // Ensure methods are available, especially if players are added dynamically
            if (typeof lottiePlayer.play !== 'function' || typeof lottiePlayer.stop !== 'function') {
                console.warn('[Roulette] Lottie player methods not ready for:', lottiePlayer.src);
                // Attempt to re-query and re-bind after a short delay as a fallback
                setTimeout(() => setupSingleLottieClickHandler(lottiePlayer), 500);
                return;
            }
            setupSingleLottieClickHandler(lottiePlayer);
        });
        
        console.log(`[Roulette] Setup click handlers for ${darkAuraLotties.length} static Dark Aura Lotties.`);
    } catch (error) {
        console.error('[Roulette] Error setting up Dark Aura Lottie click handlers:', error);
    }
}

function setupSingleLottieClickHandler(lottiePlayer) {
    // Remove existing listeners to prevent duplicates if re-called
    lottiePlayer.removeEventListener('click', toggleLottieAnimation);
    lottiePlayer.addEventListener('click', toggleLottieAnimation);

    // Add hover effects (if not already handled by CSS)
    lottiePlayer.addEventListener('mouseenter', () => {
        lottiePlayer.style.cursor = 'pointer';
        if (lottiePlayer.classList.contains('static-lottie')) {
            lottiePlayer.style.opacity = '0.8';
        }
    });
    lottiePlayer.addEventListener('mouseleave', () => {
        if (lottiePlayer.classList.contains('static-lottie')) {
            lottiePlayer.style.opacity = '1';
        }
    });
}

function toggleLottieAnimation(event) {
    const lottiePlayer = event.currentTarget;
    if (typeof lottiePlayer.play !== 'function' || typeof lottiePlayer.stop !== 'function') {
        console.warn('[Roulette] Clicked Lottie player methods not ready:', lottiePlayer.src);
        return;
    }
    if (lottiePlayer.classList.contains('static-lottie')) {
        lottiePlayer.classList.remove('static-lottie');
        lottiePlayer.classList.add('animated-lottie');
        lottiePlayer.loop = true;
        lottiePlayer.autoplay = true;
        lottiePlayer.play();
        lottiePlayer.style.transform = 'scale(1.1)';
        lottiePlayer.style.transition = 'transform 0.3s ease, opacity 0.2s ease';
    } else {
        lottiePlayer.classList.remove('animated-lottie');
        lottiePlayer.classList.add('static-lottie');
        lottiePlayer.loop = false;
        lottiePlayer.autoplay = false;
        lottiePlayer.stop();
        lottiePlayer.style.transform = 'scale(1)';
    }
}

// Enhanced Dark Aura roulette animation with Lottie support
async function startEnhancedDarkAuraRouletteAnimation(items, probabilities, winningItemName, casePrice, caseType) {
    console.log('[Roulette] Starting Dark Aura Roulette Animation. Winning item:', winningItemName);
    // currentResultSkin should be set by caseOpening.js to the winning item object
    if (!currentResultSkin || currentResultSkin.name !== winningItemName) {
        console.error('[Roulette] Mismatch or missing currentResultSkin for Dark Aura. Expected:', winningItemName, 'Got:', currentResultSkin);
        currentResultSkin = items.find(item => item.name === winningItemName) || items[0]; // Fallback
        if (!currentResultSkin.type) currentResultSkin.type = 'lottie';
        if (!currentResultSkin.caseType) currentResultSkin.caseType = caseType;
    }

    const rouletteOverlay = document.getElementById('roulette-overlay');
    if (rouletteOverlay) {
        rouletteOverlay.classList.add('active');
        
        // Show the track initially, hide result
        const rouletteTrack = document.getElementById('roulette-track');
        const rouletteResult = document.getElementById('roulette-result');
        if (rouletteTrack) rouletteTrack.style.display = 'block';
        if (rouletteResult) rouletteResult.style.display = 'none';
    }
    
    rouletteStateManager.setCurrentWinningItem(currentResultSkin);
    
    return new Promise(async (resolve, reject) => {
        try {
            const winningLottieData = lottieAnimations[currentResultSkin.image || currentResultSkin.lottie];
            if (!winningLottieData && (currentResultSkin.image || currentResultSkin.lottie)) {
                console.log('[Roulette] Preloading Dark Aura Lottie animation:', currentResultSkin.image || currentResultSkin.lottie);
                // Attempt to fetch it now
                try {
                    const response = await fetch(`${currentResultSkin.image || currentResultSkin.lottie}`);
                    if (!response.ok) throw new Error('Fetch failed');
                    lottieAnimations[currentResultSkin.image || currentResultSkin.lottie] = await response.json();
                    console.log('[Roulette] Fetched missing Lottie on demand:', currentResultSkin.image || currentResultSkin.lottie);
                } catch (fetchErr) {
                    console.error('[Roulette] Failed to fetch missing Lottie on demand:', fetchErr);
                    // Continue anyway, will show as image
                }
            }
            
            console.log('[Roulette] Dark Aura animation phase started (simulated delay).');
            setTimeout(() => {
                console.log('[Roulette] Dark Aura animation phase complete.');
                // Show the result after animation
                showRouletteResult(currentResultSkin, caseType);
                resolve(currentResultSkin);
            }, 3000); // Simulate animation time

        } catch (error) {
            console.error('[Roulette] Error in Dark Aura roulette animation:', error);
            hideCustomDialog(); // from uiHandlers.js or utils.js
            showRouletteResult(currentResultSkin, caseType); // Show result even on anim error
            reject(error);
        }
    });
}

// Enhanced Labubu roulette animation (placeholder, can be simpler image-based)
async function startEnhancedLabubuRouletteAnimation(items, probabilities, winningItemName, casePrice, caseType) {
    console.log('[Roulette] Starting Labubu Roulette Animation. Winning item:', winningItemName);
    if (!currentResultSkin || currentResultSkin.name !== winningItemName) {
        console.error('[Roulette] Mismatch or missing currentResultSkin for Labubu. Expected:', winningItemName, 'Got:', currentResultSkin);
        currentResultSkin = items.find(item => item.name === winningItemName) || items[0]; // Fallback
        if (!currentResultSkin.type) currentResultSkin.type = 'image';
        if (!currentResultSkin.caseType) currentResultSkin.caseType = caseType;
    }

    const rouletteOverlay = document.getElementById('roulette-overlay');
    if (rouletteOverlay) {
        rouletteOverlay.classList.add('active');
        
        // Show the track initially, hide result
        const rouletteTrack = document.getElementById('roulette-track');
        const rouletteResult = document.getElementById('roulette-result');
        if (rouletteTrack) rouletteTrack.style.display = 'block';
        if (rouletteResult) rouletteResult.style.display = 'none';
    }
    
    rouletteStateManager.setCurrentWinningItem(currentResultSkin);

    return new Promise((resolve, reject) => {
        try {
            // Simpler animation for Labubu (e.g., just show the item after a delay)
            console.log('[Roulette] Labubu animation phase started (simulated delay).');
            setTimeout(() => {
                console.log('[Roulette] Labubu animation phase complete.');
                // Show the result after animation
                showRouletteResult(currentResultSkin, caseType);
                resolve(currentResultSkin);
            }, 2000); // Simulate animation time
        } catch (error) {
            console.error('[Roulette] Error in Labubu roulette animation:', error);
            hideCustomDialog();
            showRouletteResult(currentResultSkin, caseType);
            reject(error);
        }
    });
}

// Enhanced Girlish roulette animation
async function startEnhancedGirlishRouletteAnimation(items, probabilities, winningItemName, casePrice, caseType) {
    console.log('[Roulette] Starting Girlish Roulette Animation. Winning item:', winningItemName);
    if (!currentResultSkin || currentResultSkin.name !== winningItemName) {
        console.error('[Roulette] Mismatch or missing currentResultSkin for Girlish. Expected:', winningItemName, 'Got:', currentResultSkin);
        currentResultSkin = items.find(item => item.name === winningItemName) || items[0]; // Fallback
        if (!currentResultSkin.type) currentResultSkin.type = 'lottie';
        if (!currentResultSkin.caseType) currentResultSkin.caseType = caseType;
    }

    const rouletteOverlay = document.getElementById('roulette-overlay');
    if (rouletteOverlay) {
        rouletteOverlay.classList.add('active');
        
        // Show the track initially, hide result
        const rouletteTrack = document.getElementById('roulette-track');
        const rouletteResult = document.getElementById('roulette-result');
        if (rouletteTrack) rouletteTrack.style.display = 'block';
        if (rouletteResult) rouletteResult.style.display = 'none';
    }
    
    rouletteStateManager.setCurrentWinningItem(currentResultSkin);

    return new Promise(async (resolve, reject) => {
        try {
            // Check if it's a Lottie animation and preload if needed
            if (currentResultSkin.type === 'lottie' && (currentResultSkin.image || currentResultSkin.lottie)) {
                const winningLottieData = lottieAnimations[currentResultSkin.image || currentResultSkin.lottie];
                if (!winningLottieData) {
                    console.log('[Roulette] Preloading Girlish Lottie animation:', currentResultSkin.image || currentResultSkin.lottie);
                    try {
                        const response = await fetch(`${currentResultSkin.image || currentResultSkin.lottie}`);
                        if (!response.ok) throw new Error('Fetch failed');
                        lottieAnimations[currentResultSkin.image || currentResultSkin.lottie] = await response.json();
                        console.log('[Roulette] Fetched Girlish Lottie on demand:', currentResultSkin.image || currentResultSkin.lottie);
                    } catch (fetchErr) {
                        console.error('[Roulette] Failed to fetch Girlish Lottie on demand:', fetchErr);
                        // Continue anyway, will show as image
                    }
                }
            }
            
            console.log('[Roulette] Girlish animation phase started (simulated delay).');
            setTimeout(() => {
                console.log('[Roulette] Girlish animation phase complete.');
                // Show the result after animation
                showRouletteResult(currentResultSkin, caseType);
                resolve(currentResultSkin);
            }, 2500); // Simulate animation time
        } catch (error) {
            console.error('[Roulette] Error in Girlish roulette animation:', error);
            hideCustomDialog();
            showRouletteResult(currentResultSkin, caseType);
            reject(error);
        }
    });
}

// Enhanced NewMoney roulette animation
async function startEnhancedNewMoneyRouletteAnimation(items, probabilities, winningItemName, casePrice, caseType) {
    console.log('[Roulette] Starting NewMoney Roulette Animation. Winning item:', winningItemName);
    if (!currentResultSkin || currentResultSkin.name !== winningItemName) {
        console.error('[Roulette] Mismatch or missing currentResultSkin for NewMoney. Expected:', winningItemName, 'Got:', currentResultSkin);
        currentResultSkin = items.find(item => item.name === winningItemName) || items[0]; // Fallback
        if (!currentResultSkin.type) currentResultSkin.type = 'lottie';
        if (!currentResultSkin.caseType) currentResultSkin.caseType = caseType;
    }

    const rouletteOverlay = document.getElementById('roulette-overlay');
    if (rouletteOverlay) {
        rouletteOverlay.classList.add('active');
        
        // Show the track initially, hide result
        const rouletteTrack = document.getElementById('roulette-track');
        const rouletteResult = document.getElementById('roulette-result');
        if (rouletteTrack) rouletteTrack.style.display = 'block';
        if (rouletteResult) rouletteResult.style.display = 'none';
    }
    
    rouletteStateManager.setCurrentWinningItem(currentResultSkin);

    return new Promise(async (resolve, reject) => {
        try {
            // Check if it's a Lottie animation and preload if needed
            if (currentResultSkin.type === 'lottie' && (currentResultSkin.image || currentResultSkin.lottie)) {
                const winningLottieData = lottieAnimations[currentResultSkin.image || currentResultSkin.lottie];
                if (!winningLottieData) {
                    console.log('[Roulette] Preloading NewMoney Lottie animation:', currentResultSkin.image || currentResultSkin.lottie);
                    try {
                        const response = await fetch(`${currentResultSkin.image || currentResultSkin.lottie}`);
                        if (!response.ok) throw new Error('Fetch failed');
                        lottieAnimations[currentResultSkin.image || currentResultSkin.lottie] = await response.json();
                        console.log('[Roulette] Fetched NewMoney Lottie on demand:', currentResultSkin.image || currentResultSkin.lottie);
                    } catch (fetchErr) {
                        console.error('[Roulette] Failed to fetch NewMoney Lottie on demand:', fetchErr);
                        // Continue anyway, will show as image
                    }
                }
            }
            
            console.log('[Roulette] NewMoney animation phase started (simulated delay).');
            setTimeout(() => {
                console.log('[Roulette] NewMoney animation phase complete.');
                // Show the result after animation
                showRouletteResult(currentResultSkin, caseType);
                resolve(currentResultSkin);
            }, 2500); // Simulate animation time
        } catch (error) {
            console.error('[Roulette] Error in NewMoney roulette animation:', error);
            hideCustomDialog();
            showRouletteResult(currentResultSkin, caseType);
            reject(error);
        }
    });
}

// Enhanced Main Character roulette animation (simulated)
async function startEnhancedMainCharacterRouletteAnimation(items, probabilities, winningItemName, casePrice, caseType) {
    console.log('[Roulette] Starting Main Character roulette animation for:', winningItemName, 'Case Type:', caseType);
    
    // Find the winning item from the items array
    const winningItem = items.find(item => item.name === winningItemName);
    if (!winningItem) {
        console.error('[Roulette] Main Character winning item not found:', winningItemName);
        return null;
    }

    // Store the current result skin globally to currentResultSkin config.js variable
    currentResultSkin = winningItem; // From config.js
    if (!currentResultSkin.unique_id && typeof generateUniqueId === 'function') {
        currentResultSkin.unique_id = generateUniqueId();
        console.log('[Roulette] Generated unique_id for Main Character item:', currentResultSkin.unique_id);
    }
    
    rouletteStateManager.setCurrentWinningItem(currentResultSkin);

    return new Promise(async (resolve, reject) => {
        try {
            // Check if it's a Lottie animation and preload if needed
            if (currentResultSkin.type === 'lottie' && (currentResultSkin.image || currentResultSkin.lottie)) {
                const winningLottieData = lottieAnimations[currentResultSkin.image || currentResultSkin.lottie];
                if (!winningLottieData) {
                    console.log('[Roulette] Preloading Main Character Lottie animation:', currentResultSkin.image || currentResultSkin.lottie);
                    try {
                        const response = await fetch(`${currentResultSkin.image || currentResultSkin.lottie}`);
                        if (!response.ok) throw new Error('Fetch failed');
                        lottieAnimations[currentResultSkin.image || currentResultSkin.lottie] = await response.json();
                        console.log('[Roulette] Fetched Main Character Lottie on demand:', currentResultSkin.image || currentResultSkin.lottie);
                    } catch (fetchErr) {
                        console.error('[Roulette] Failed to fetch Main Character Lottie on demand:', fetchErr);
                        // Continue anyway, will show as image
                    }
                }
            }
            
            console.log('[Roulette] Main Character animation phase started (simulated delay).');
            setTimeout(() => {
                console.log('[Roulette] Main Character animation phase complete.');
                // Show the result after animation
                showRouletteResult(currentResultSkin, caseType);
                resolve(currentResultSkin);
            }, 2500); // Simulate animation time
        } catch (error) {
            console.error('[Roulette] Error in Main Character roulette animation:', error);
            hideCustomDialog();
            showRouletteResult(currentResultSkin, caseType);
            reject(error);
        }
    });
}

// Placeholder for the old animateRouletteTrack - this was complex and tied to Lottie.
// The new approach in startEnhanced...Animation functions is to simplify this for now.
async function animateRouletteTrack(winningItem, items, probabilities, caseType) {
    console.log('[Roulette] AnimateRouletteTrack called with winning item:', winningItem);
    // This function needs significant rework if a visual spinning reel is desired.
    // For now, it will just simulate a delay and then focus on the winning item.
    return new Promise(resolve => {
        setTimeout(() => {
            console.log('[Roulette] Simulated track animation finished.');
            resolve(winningItem);
        }, 1500); 
    });
}


// Show roulette result with Lottie or image support
function showRouletteResult(item, caseType) {
    console.log('[Roulette] Showing roulette result:', item, 'Case Type:', caseType);
    rouletteStateManager.setCurrentWinningItem(item); // Ensure SM has the final item

    const resultScreen = document.getElementById('roulette-overlay');
    const rouletteHeader = resultScreen ? resultScreen.querySelector('.roulette-header h2') : null;
    const rouletteHeaderP = resultScreen ? resultScreen.querySelector('.roulette-header p') : null;
    const resultItemName = document.getElementById('result-name');
    const resultImage = document.getElementById('result-image');
    const sellPriceElement = document.getElementById('sell-price');
    const rouletteResult = document.getElementById('roulette-result');
    const rouletteTrack = document.getElementById('roulette-track');

    if (!resultScreen) {
        console.error('[Roulette] Roulette overlay not found.');
        return;
    }

    // Update header to show result
    if (rouletteHeader) {
        rouletteHeader.textContent = 'Case Opened!';
    }
    if (rouletteHeaderP) {
        rouletteHeaderP.textContent = 'You won:';
    }

    // Hide the spinning track and show result
    if (rouletteTrack) {
        rouletteTrack.style.display = 'none';
    }
    if (rouletteResult) {
        rouletteResult.style.display = 'block';
    }

    // Set item name
    if (resultItemName) {
        resultItemName.textContent = item.name || 'Unknown Item';
    }
    
    // Set sell price if element exists
    if (sellPriceElement && item.price) {
        sellPriceElement.textContent = item.price.toLocaleString();
    }

    // Handle image display - need to use the result-image container
    if (resultImage) {
        const imageContainer = resultImage.parentElement;
        if (imageContainer) {
            imageContainer.innerHTML = ''; // Clear previous
            
            if (item.type === 'lottie' && (item.image || item.lottie) && lottieAnimations[item.image || item.lottie]) {
                const player = document.createElement('lottie-player');
                player.autoplay = true;
                player.loop = true;
                player.mode = "normal";
                player.style.width = '120px';
                player.style.height = '120px';
                player.style.maxWidth = '100%';
                player.style.maxHeight = '100%';
                
                try {
                    player.setAnimationData(lottieAnimations[item.image || item.lottie]);
                    imageContainer.appendChild(player);
                    rouletteStateManager.setActiveRoulette(caseType + '_result', player);
                    console.log('[Roulette] Lottie animation displayed successfully');
                } catch (error) {
                    console.error('[Roulette] Error setting Lottie animation:', error);
                    // Fallback to image
                    const img = document.createElement('img');
                    img.src = item.image || item.lottie || 'placeholder.png';
                    img.alt = item.name;
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '120px';
                    img.style.display = 'block';
                    imageContainer.appendChild(img);
                }
            } else if (item.image || item.lottie) {
                const img = document.createElement('img');
                img.src = item.image || item.lottie;
                img.alt = item.name;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '120px';
                img.style.display = 'block';
                imageContainer.appendChild(img);
                console.log('[Roulette] Image displayed successfully');
            } else {
                imageContainer.innerHTML = '<div style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;background:#333;border-radius:8px;color:#fff;"><i class="fas fa-image"></i></div>';
                console.log('[Roulette] Placeholder displayed');
            }
        }
    }

    // Store item info for selling functionality with proper unique_id
    const itemWithId = { ...item };
    if (item.unique_id) {
        itemWithId.unique_id = item.unique_id;
        rouletteStateManager.setCurrentWinningItem(itemWithId);
        console.log('[Roulette] Item stored with unique_id:', item.unique_id);
    }

    // Ensure the overlay is visible and result is shown
    resultScreen.classList.add('active');
    console.log('[Roulette] Roulette result displayed successfully.');
}

// Function to handle closing the roulette (called by event listener in uiHandlers.js)
function handleRouletteClose() {
    console.log('[Roulette] Roulette close button clicked');
    const rouletteOverlay = document.getElementById('roulette-overlay');
    if (rouletteOverlay) {
        rouletteOverlay.classList.remove('active');
    }
    rouletteStateManager.clearState(); // Clear any active Lottie players and winning item
    currentResultSkin = null; // currentResultSkin from config.js
    console.log('[Roulette] Cleared currentResultSkin and SM state after closing roulette');
}

// Function to handle selling from roulette (called by event listener in uiHandlers.js)
async function handleRouletteSell() {
    console.log('[Roulette] Roulette sell button clicked');
    const itemToSell = rouletteStateManager.getCurrentWinningItem();
    
    if (!itemToSell || !itemToSell.unique_id) {
        console.error('[Roulette] No current result skin or unique_id available in StateManager to sell from roulette.', itemToSell);
        showToast('Cannot sell this item right now. Please try again later.', 'error'); // from utils.js
        return;
    }
    
    try {
        // sellNFT is from inventory.js
        const success = await sellNFT(itemToSell.name, itemToSell.tier, itemToSell.unique_id);
        if (success) {
            console.log('[Roulette] Item sold successfully from roulette, closing roulette.');
            const rouletteOverlayEl = document.getElementById('roulette-overlay');
            if (rouletteOverlayEl) rouletteOverlayEl.classList.remove('active');
            rouletteStateManager.clearState();
            currentResultSkin = null; // currentResultSkin from config.js
        }
    } catch (err) {
        console.error('[Roulette] Error in sell button click handler (roulette):', err);
        showToast('An error occurred while selling. Please try again.', 'error'); // from utils.js
    }
}

console.log('[Roulette] roulette.js loaded'); 