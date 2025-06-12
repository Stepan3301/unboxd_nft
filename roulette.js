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
        { name: 'darkAuraItems', data: window.darkAuraItems },
        { name: 'girlishItems', data: window.girlishItems },
        { name: 'newMoneyItems', data: window.newMoneyItems },
        { name: 'mainCharacterItems', data: window.mainCharacterItems },
        { name: 'coldBloodedItems', data: window.coldBloodedItems }
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

// NEW: Generate roulette track items dynamically
function generateRouletteTrack(items) {
    console.log('[Roulette] Generating roulette track with', items.length, 'items');
    
    const rouletteTrack = document.getElementById('roulette-track');
    if (!rouletteTrack) {
        console.error('[Roulette] roulette-track element not found');
        return;
    }
    
    // Clear existing items
    rouletteTrack.innerHTML = '';
    
    // Create roulette items - add multiple copies for smooth scrolling effect
    const itemsToShow = [];
    
    // Create 5 sets of items for smooth scrolling (total of items.length * 5 items)
    for (let set = 0; set < 5; set++) {
        items.forEach((item, index) => {
            itemsToShow.push({
                ...item,
                setIndex: set,
                originalIndex: index,
                uniqueTrackId: `${set}-${index}`
            });
        });
    }
    
    itemsToShow.forEach((item, trackIndex) => {
        const rouletteItem = document.createElement('div');
        rouletteItem.className = 'roulette-item';
        rouletteItem.dataset.itemName = item.name;
        rouletteItem.dataset.itemTier = item.tier;
        rouletteItem.dataset.trackIndex = trackIndex;
        
        // Add tier class for styling
        rouletteItem.classList.add(`tier-${item.tier}`);
        
        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'roulette-item-image';
        
        if (item.type === 'lottie' && item.image) {
            // For lottie files, create lottie-player element
            const lottiePlayer = document.createElement('lottie-player');
            lottiePlayer.src = item.image;
            lottiePlayer.background = 'transparent';
            lottiePlayer.speed = 1;
            lottiePlayer.style.width = '60px';
            lottiePlayer.style.height = '60px';
            lottiePlayer.loop = true;
            lottiePlayer.autoplay = true;
            imageContainer.appendChild(lottiePlayer);
        } else if (item.image) {
            // For regular images
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.name;
            img.style.width = '60px';
            img.style.height = '60px';
            img.style.objectFit = 'cover';
            imageContainer.appendChild(img);
        } else {
            // Fallback placeholder
            const placeholder = document.createElement('div');
            placeholder.innerHTML = '<i class="fas fa-image"></i>';
            placeholder.style.width = '60px';
            placeholder.style.height = '60px';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.style.backgroundColor = '#333';
            placeholder.style.borderRadius = '8px';
            placeholder.style.color = '#fff';
            imageContainer.appendChild(placeholder);
        }
        
        // Create name element
        const nameElement = document.createElement('div');
        nameElement.className = 'roulette-item-name';
        nameElement.textContent = item.name;
        
        rouletteItem.appendChild(imageContainer);
        rouletteItem.appendChild(nameElement);
        rouletteTrack.appendChild(rouletteItem);
    });
    
    console.log(`[Roulette] Generated ${itemsToShow.length} track items`);
}

// NEW: Animate roulette track to winning item
function animateRouletteTrack(winningItem, items) {
    return new Promise((resolve, reject) => {
        console.log('[Roulette] Starting roulette track animation to:', winningItem.name);
        
        const rouletteTrack = document.getElementById('roulette-track');
        const rouletteMarker = document.querySelector('.roulette-marker');
        
        if (!rouletteTrack || !rouletteMarker) {
            console.error('[Roulette] Required elements not found');
            reject(new Error('Roulette elements not found'));
            return;
        }
        
        // Find the winning item in the track (use an item from the middle sets for good visual effect)
        const trackItems = rouletteTrack.querySelectorAll('.roulette-item');
        let winningElement = null;
        
        // Look for the winning item in sets 2 or 3 (middle of the track)
        for (let item of trackItems) {
            const itemName = item.dataset.itemName;
            const trackIndex = parseInt(item.dataset.trackIndex);
            
            if (itemName === winningItem.name) {
                // Calculate which set this item belongs to
                const setIndex = Math.floor(trackIndex / items.length);
                if (setIndex >= 2 && setIndex <= 3) {
                    winningElement = item;
                    break;
                }
            }
        }
        
        // Fallback: use any matching item if middle sets don't have it
        if (!winningElement) {
            for (let item of trackItems) {
                if (item.dataset.itemName === winningItem.name) {
                    winningElement = item;
                    break;
                }
            }
        }
        
        if (!winningElement) {
            console.error('[Roulette] Winning item not found in track');
            reject(new Error('Winning item not found'));
            return;
        }
        
        // Calculate the offset to center the winning item under the marker
        const markerRect = rouletteMarker.getBoundingClientRect();
        const markerCenter = markerRect.left + markerRect.width / 2;
        
        const trackRect = rouletteTrack.getBoundingClientRect();
        const winningRect = winningElement.getBoundingClientRect();
        const winningCenter = winningRect.left + winningRect.width / 2;
        
        // Calculate offset needed to center winning item under marker
        const offset = markerCenter - winningCenter;
        
        console.log('[Roulette] Animation details:', {
            markerCenter,
            winningCenter,
            offset,
            trackRect: trackRect.width
        });
        
        // Reset track position
        rouletteTrack.style.transform = 'translateX(0px)';
        rouletteTrack.style.transition = 'none';
        
        // Force reflow
        rouletteTrack.offsetHeight;
        
        // Add spinning animation with easing
        rouletteTrack.style.transition = 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        rouletteTrack.style.transform = `translateX(${offset}px)`;
        
        // Listen for animation end
        const handleTransitionEnd = () => {
            rouletteTrack.removeEventListener('transitionend', handleTransitionEnd);
            console.log('[Roulette] Track animation completed');
            resolve(winningItem);
        };
        
        rouletteTrack.addEventListener('transitionend', handleTransitionEnd);
        
        // Failsafe timeout
        setTimeout(() => {
            rouletteTrack.removeEventListener('transitionend', handleTransitionEnd);
            console.log('[Roulette] Track animation completed (timeout)');
            resolve(winningItem);
        }, 3500);
    });
}

// Enhanced Dark Aura roulette animation with proper DOM animation
async function startEnhancedDarkAuraRouletteAnimation(items, probabilities, winningItemName, casePrice, caseType) {
    console.log('[Roulette] Starting Dark Aura Roulette Animation. Winning item:', winningItemName);
    
    // Ensure currentResultSkin is properly set
    if (!currentResultSkin || currentResultSkin.name !== winningItemName) {
        console.error('[Roulette] Mismatch or missing currentResultSkin for Dark Aura. Expected:', winningItemName, 'Got:', currentResultSkin);
        currentResultSkin = items.find(item => item.name === winningItemName) || items[0];
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
        if (rouletteResult) rouletteResult.classList.remove('active');
    }
    
    rouletteStateManager.setCurrentWinningItem(currentResultSkin);
    
    try {
        // Generate the roulette track
        generateRouletteTrack(items);
        
        // Animate to winning item
        await animateRouletteTrack(currentResultSkin, items);
        
        // Show result
        showRouletteResult(currentResultSkin, caseType);
        
        return currentResultSkin;
    } catch (error) {
        console.error('[Roulette] Error in Dark Aura roulette animation:', error);
        showRouletteResult(currentResultSkin, caseType);
        throw error;
    }
}

// Enhanced Labubu roulette animation
async function startEnhancedLabubuRouletteAnimation(items, probabilities, winningItemName, casePrice, caseType) {
    console.log('[Roulette] Starting Labubu Roulette Animation. Winning item:', winningItemName);
    
    if (!currentResultSkin || currentResultSkin.name !== winningItemName) {
        console.error('[Roulette] Mismatch or missing currentResultSkin for Labubu. Expected:', winningItemName, 'Got:', currentResultSkin);
        currentResultSkin = items.find(item => item.name === winningItemName) || items[0];
        if (!currentResultSkin.type) currentResultSkin.type = 'image';
        if (!currentResultSkin.caseType) currentResultSkin.caseType = caseType;
    }

    const rouletteOverlay = document.getElementById('roulette-overlay');
    if (rouletteOverlay) {
        rouletteOverlay.classList.add('active');
        
        const rouletteTrack = document.getElementById('roulette-track');
        const rouletteResult = document.getElementById('roulette-result');
        if (rouletteTrack) rouletteTrack.style.display = 'block';
        if (rouletteResult) rouletteResult.classList.remove('active');
    }
    
    rouletteStateManager.setCurrentWinningItem(currentResultSkin);
    
    try {
        generateRouletteTrack(items);
        await animateRouletteTrack(currentResultSkin, items);
        showRouletteResult(currentResultSkin, caseType);
        return currentResultSkin;
    } catch (error) {
        console.error('[Roulette] Error in Labubu roulette animation:', error);
        showRouletteResult(currentResultSkin, caseType);
        throw error;
    }
}

// Enhanced Girlish roulette animation
async function startEnhancedGirlishRouletteAnimation(items, probabilities, winningItemName, casePrice, caseType) {
    console.log('[Roulette] Starting Girlish Roulette Animation. Winning item:', winningItemName);
    
    if (!currentResultSkin || currentResultSkin.name !== winningItemName) {
        currentResultSkin = items.find(item => item.name === winningItemName) || items[0];
        if (!currentResultSkin.type) currentResultSkin.type = 'lottie';
        if (!currentResultSkin.caseType) currentResultSkin.caseType = caseType;
    }

    const rouletteOverlay = document.getElementById('roulette-overlay');
    if (rouletteOverlay) {
        rouletteOverlay.classList.add('active');
        
        const rouletteTrack = document.getElementById('roulette-track');
        const rouletteResult = document.getElementById('roulette-result');
        if (rouletteTrack) rouletteTrack.style.display = 'block';
        if (rouletteResult) rouletteResult.classList.remove('active');
    }
    
    rouletteStateManager.setCurrentWinningItem(currentResultSkin);
    
    try {
        generateRouletteTrack(items);
        await animateRouletteTrack(currentResultSkin, items);
        showRouletteResult(currentResultSkin, caseType);
        return currentResultSkin;
    } catch (error) {
        console.error('[Roulette] Error in Girlish roulette animation:', error);
        showRouletteResult(currentResultSkin, caseType);
        throw error;
    }
}

// Enhanced New Money roulette animation  
async function startEnhancedNewMoneyRouletteAnimation(items, probabilities, winningItemName, casePrice, caseType) {
    console.log('[Roulette] Starting New Money Roulette Animation. Winning item:', winningItemName);
    
    if (!currentResultSkin || currentResultSkin.name !== winningItemName) {
        currentResultSkin = items.find(item => item.name === winningItemName) || items[0];
        if (!currentResultSkin.type) currentResultSkin.type = 'lottie';
        if (!currentResultSkin.caseType) currentResultSkin.caseType = caseType;
    }

    const rouletteOverlay = document.getElementById('roulette-overlay');
    if (rouletteOverlay) {
        rouletteOverlay.classList.add('active');
        
        const rouletteTrack = document.getElementById('roulette-track');
        const rouletteResult = document.getElementById('roulette-result');
        if (rouletteTrack) rouletteTrack.style.display = 'block';
        if (rouletteResult) rouletteResult.classList.remove('active');
    }
    
    rouletteStateManager.setCurrentWinningItem(currentResultSkin);
    
    try {
        generateRouletteTrack(items);
        await animateRouletteTrack(currentResultSkin, items);
        showRouletteResult(currentResultSkin, caseType);
        return currentResultSkin;
    } catch (error) {
        console.error('[Roulette] Error in New Money roulette animation:', error);
        showRouletteResult(currentResultSkin, caseType);
        throw error;
    }
}

// Enhanced Cold Blooded roulette animation
async function startEnhancedColdBloodedRouletteAnimation(items, probabilities, winningItemName, casePrice, caseType) {
    console.log('[Roulette] Starting Cold Blooded Roulette Animation. Winning item:', winningItemName);
    
    if (!currentResultSkin || currentResultSkin.name !== winningItemName) {
        currentResultSkin = items.find(item => item.name === winningItemName) || items[0];
        if (!currentResultSkin.type) currentResultSkin.type = 'lottie';
        if (!currentResultSkin.caseType) currentResultSkin.caseType = caseType;
    }

    const rouletteOverlay = document.getElementById('roulette-overlay');
    if (rouletteOverlay) {
        rouletteOverlay.classList.add('active');
        
        const rouletteTrack = document.getElementById('roulette-track');
        const rouletteResult = document.getElementById('roulette-result');
        if (rouletteTrack) rouletteTrack.style.display = 'block';
        if (rouletteResult) rouletteResult.classList.remove('active');
    }
    
    rouletteStateManager.setCurrentWinningItem(currentResultSkin);
    
    try {
        generateRouletteTrack(items);
        await animateRouletteTrack(currentResultSkin, items);
        showRouletteResult(currentResultSkin, caseType);
        return currentResultSkin;
    } catch (error) {
        console.error('[Roulette] Error in Cold Blooded roulette animation:', error);
        showRouletteResult(currentResultSkin, caseType);
        throw error;
    }
}

// Enhanced Main Character roulette animation
async function startEnhancedMainCharacterRouletteAnimation(items, probabilities, winningItemName, casePrice, caseType) {
    console.log('[Roulette] Starting Main Character Roulette Animation. Winning item:', winningItemName);
    
    if (!currentResultSkin || currentResultSkin.name !== winningItemName) {
        currentResultSkin = items.find(item => item.name === winningItemName) || items[0];
        if (!currentResultSkin.type) currentResultSkin.type = 'lottie';
        if (!currentResultSkin.caseType) currentResultSkin.caseType = caseType;
    }

    const rouletteOverlay = document.getElementById('roulette-overlay');
    if (rouletteOverlay) {
        rouletteOverlay.classList.add('active');
        
        const rouletteTrack = document.getElementById('roulette-track');
        const rouletteResult = document.getElementById('roulette-result');
        if (rouletteTrack) rouletteTrack.style.display = 'block';
        if (rouletteResult) rouletteResult.classList.remove('active');
    }
    
    rouletteStateManager.setCurrentWinningItem(currentResultSkin);
    
    try {
        generateRouletteTrack(items);
        await animateRouletteTrack(currentResultSkin, items);
        showRouletteResult(currentResultSkin, caseType);
        return currentResultSkin;
    } catch (error) {
        console.error('[Roulette] Error in Main Character roulette animation:', error);
        showRouletteResult(currentResultSkin, caseType);
        throw error;
    }
}

// Show roulette result with CSS class-based transitions
function showRouletteResult(item, caseType) {
    console.log('[Roulette] Showing roulette result:', item, 'Case Type:', caseType);
    rouletteStateManager.setCurrentWinningItem(item);

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

    // Hide the spinning track and show result using CSS classes
    if (rouletteTrack) {
        rouletteTrack.style.display = 'none';
    }
    if (rouletteResult) {
        rouletteResult.classList.add('active');
    }

    // Set item name
    if (resultItemName) {
        resultItemName.textContent = item.name || 'Unknown Item';
    }
    
    // Set sell price if element exists
    if (sellPriceElement && item.price) {
        sellPriceElement.textContent = item.price.toLocaleString();
    }

    // Handle image display
    if (resultImage) {
        const imageContainer = resultImage.parentElement;
        if (imageContainer) {
            imageContainer.innerHTML = ''; // Clear previous
            
            if (item.type === 'lottie' && item.image && lottieAnimations[item.image]) {
                const player = document.createElement('lottie-player');
                player.autoplay = true;
                player.loop = true;
                player.mode = "normal";
                player.style.width = '120px';
                player.style.height = '120px';
                player.style.maxWidth = '100%';
                player.style.maxHeight = '100%';
                
                try {
                    player.load(lottieAnimations[item.image]);
                    imageContainer.appendChild(player);
                    rouletteStateManager.setActiveRoulette(caseType + '_result', player);
                    console.log('[Roulette] Lottie animation displayed successfully');
                } catch (error) {
                    console.error('[Roulette] Error setting Lottie animation:', error);
                    // Fallback to image
                    const img = document.createElement('img');
                    img.src = item.image || 'placeholder.png';
                    img.alt = item.name;
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '120px';
                    img.style.display = 'block';
                    imageContainer.appendChild(img);
                }
            } else if (item.image) {
                const img = document.createElement('img');
                img.src = item.image;
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

    // Store item info for selling functionality
    const itemWithId = { ...item };
    if (item.unique_id) {
        itemWithId.unique_id = item.unique_id;
        rouletteStateManager.setCurrentWinningItem(itemWithId);
        console.log('[Roulette] Item stored with unique_id:', item.unique_id);
    }

    // Ensure the overlay is visible
    resultScreen.classList.add('active');
    console.log('[Roulette] Roulette result displayed successfully.');
}

// Function to handle closing the roulette
function handleRouletteClose() {
    console.log('[Roulette] Roulette close button clicked');
    const rouletteOverlay = document.getElementById('roulette-overlay');
    const rouletteResult = document.getElementById('roulette-result');
    const rouletteTrack = document.getElementById('roulette-track');
    
    if (rouletteOverlay) {
        rouletteOverlay.classList.remove('active');
    }
    if (rouletteResult) {
        rouletteResult.classList.remove('active');
    }
    if (rouletteTrack) {
        // Reset track transform
        rouletteTrack.style.transform = 'translateX(0px)';
        rouletteTrack.style.transition = 'none';
    }
    
    rouletteStateManager.clearState();
    currentResultSkin = null;
    console.log('[Roulette] Cleared currentResultSkin and SM state after closing roulette');
}

// Function to handle selling from roulette
async function handleRouletteSell() {
    console.log('[Roulette] Roulette sell button clicked');
    const itemToSell = rouletteStateManager.getCurrentWinningItem();
    
    if (!itemToSell || !itemToSell.unique_id) {
        console.error('[Roulette] No current result skin or unique_id available to sell from roulette.', itemToSell);
        showToast('Cannot sell this item right now. Please try again later.', 'error');
        return;
    }
    
    try {
        const success = await sellNFT(itemToSell.name, itemToSell.tier, itemToSell.unique_id);
        if (success) {
            console.log('[Roulette] Item sold successfully from roulette, closing roulette.');
            
            const rouletteOverlay = document.getElementById('roulette-overlay');
            const rouletteResult = document.getElementById('roulette-result');
            const rouletteTrack = document.getElementById('roulette-track');
            
            if (rouletteOverlay) rouletteOverlay.classList.remove('active');
            if (rouletteResult) rouletteResult.classList.remove('active');
            if (rouletteTrack) {
                rouletteTrack.style.transform = 'translateX(0px)';
                rouletteTrack.style.transition = 'none';
            }
            
            rouletteStateManager.clearState();
            currentResultSkin = null;
        }
    } catch (err) {
        console.error('[Roulette] Error in sell button click handler (roulette):', err);
        showToast('An error occurred while selling. Please try again.', 'error');
    }
}

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Roulette] Setting up roulette event listeners');
    
    // Case opening buttons with data-case attribute
    const caseButtons = document.querySelectorAll('.open-case-btn[data-case], .open-btn[data-case]');
    caseButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent clicks from bubbling up to parent elements
            const caseType = this.dataset.case;
            const functionName = `open${caseType.charAt(0).toUpperCase() + caseType.slice(1)}Case`;
            
            if (typeof window[functionName] === 'function') {
                console.log(`[Roulette] Opening ${caseType} case via button click`);
                window[functionName]();
            } else {
                console.error(`[Roulette] Function ${functionName} not found`);
            }
        });
    });
    
    // Roulette control buttons
    const rouletteSellBtn = document.getElementById('roulette-sell');
    const rouletteCloseBtn = document.getElementById('roulette-close');
    
    if (rouletteSellBtn) {
        rouletteSellBtn.addEventListener('click', handleRouletteSell);
    } else {
        console.warn('[Roulette] roulette-sell button not found');
    }
    
    if (rouletteCloseBtn) {
        rouletteCloseBtn.addEventListener('click', handleRouletteClose);
    } else {
        console.warn('[Roulette] roulette-close button not found');
    }
});

console.log('[Roulette] roulette.js loaded'); 