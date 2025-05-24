/**
 * Improved Roulette Animation and Randomization
 * 
 * This script implements:
 * 1. Randomized NFT positions for each spin
 * 2. Enhanced smooth animation using cubic-bezier and advanced easing
 * 3. Fixes for common animation issues (disappearing items, jerky motion)
 */

// Function to shuffle an array using Fisher-Yates algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Improved roulette initialization with randomized order
function initializeRoulette() {
    // Clear previous items
    rouletteTrack.innerHTML = '';
    
    // We'll create three sets of shuffled skins for a better experience
    // This ensures a longer track and more variability
    
    // First set - completely random
    const firstSet = shuffleArray(labubuSkins);
    // Second set - different shuffle
    const secondSet = shuffleArray(labubuSkins);
    // Third set - different shuffle again
    const thirdSet = shuffleArray(labubuSkins);
    
    // Combine all sets
    const allSets = [...firstSet, ...secondSet, ...thirdSet];
    
    // Create roulette items
    allSets.forEach(skin => {
        const item = document.createElement('div');
        item.className = 'roulette-item';
        item.dataset.skinName = skin.name; // Store the skin name for reference
        item.dataset.skinTier = skin.tier; // Store the tier for reference
        
        const img = document.createElement('img');
        img.src = skin.image;
        img.alt = skin.name;
        
        const name = document.createElement('div');
        name.className = `roulette-item-name tier-${skin.tier}`;
        name.textContent = skin.name;
        
        item.appendChild(img);
        item.appendChild(name);
        rouletteTrack.appendChild(item);
    });
    
    // Reset transition and transform
    rouletteTrack.style.transition = 'none';
    rouletteTrack.style.transform = 'translateX(0)';
    
    // Force a reflow to ensure the transition reset is applied
    rouletteTrack.offsetHeight;
    
    console.log('Roulette initialized with randomized items');
}

// Enhanced roulette animation with improved physics and smoothness
function startRouletteAnimation(selectedSkin) {
    // Store the current selected skin
    currentResultSkin = selectedSkin;
    
    // Set the sell price with coin icon
    const sellPrice = skinPrices[selectedSkin.tier];
    const sellPriceElement = document.getElementById('sell-price');
    sellPriceElement.innerHTML = `<img src="ucoin2.png" alt="UCoin" style="width: 18px; height: 18px; margin: 0 5px;"> ${sellPrice}`;
    
    // Style the result name according to tier
    const resultNameElement = document.getElementById('result-name');
    resultNameElement.className = `tier-${selectedSkin.tier}`;
    resultNameElement.textContent = selectedSkin.name;
    
    // Get all roulette items
    const items = document.querySelectorAll('.roulette-item');
    
    // Find the item that matches our selected skin
    let targetItem = null;
    let targetIndex = -1;
    
    items.forEach((item, index) => {
        if (item.dataset.skinName === selectedSkin.name) {
            // We want to find one in the middle section ideally
            if (targetItem === null || 
                (index >= items.length / 3 && index <= (items.length * 2) / 3)) {
                targetItem = item;
                targetIndex = index;
            }
        }
    });
    
    // If we couldn't find the exact item (shouldn't happen), use the first match
    if (targetItem === null) {
        for (let i = 0; i < items.length; i++) {
            if (items[i].dataset.skinName === selectedSkin.name) {
                targetItem = items[i];
                targetIndex = i;
                break;
            }
        }
    }
    
    // Still no target? Use a fallback (shouldn't happen)
    if (targetItem === null) {
        console.error('Could not find target item in roulette:', selectedSkin.name);
        targetItem = items[Math.floor(items.length / 2)]; // Use middle item as fallback
        targetIndex = Math.floor(items.length / 2);
    }
    
    // Calculate dimensions
    const itemWidth = 130; // Width of each item including margins
    const viewportWidth = window.innerWidth;
    const centerPosition = viewportWidth / 2;
    
    // Calculate the position needed to center the target item
    const itemOffsetLeft = targetIndex * itemWidth;
    const finalPosition = itemOffsetLeft - centerPosition + (itemWidth / 2);
    
    // Ensure we have enough spin distance for a satisfying effect
    const minSpinDistance = viewportWidth * 2; // At least 2 viewport widths
    
    // Calculate the total distance to spin
    let totalSpinDistance = finalPosition;
    
    // If the distance is too small, add additional revolutions
    if (totalSpinDistance < minSpinDistance) {
        // Add enough full revolutions to exceed minimum distance
        const additionalDistance = Math.ceil((minSpinDistance - totalSpinDistance) / (items.length * itemWidth)) * (items.length * itemWidth);
        totalSpinDistance += additionalDistance;
    }
    
    // Add a small random variance for natural feel (within 20px)
    const randomVariance = (Math.random() * 40 - 20);
    totalSpinDistance += randomVariance;
    
    // Reset animation state
    rouletteTrack.style.transition = 'none';
    rouletteTrack.style.transform = 'translateX(0)';
    rouletteTrack.offsetHeight; // Force a reflow
    
    // Set the total duration and easing
    const duration = 7000; // Exactly 7 seconds as requested
    
    // Use an advanced cubic-bezier curve for realistic physics
    // This curve starts fast and gradually slows down in a natural way
    const easingFunction = 'cubic-bezier(0.17, 0.67, 0.83, 0.67)';
    
    // Start the animation after a brief delay to ensure transition is properly reset
    setTimeout(() => {
        console.log(`Starting animation to position: ${totalSpinDistance}px`);
        rouletteTrack.style.transition = `transform ${duration}ms ${easingFunction}`;
        rouletteTrack.style.transform = `translateX(-${totalSpinDistance}px)`;
        
        // When animation ends, show the result
        setTimeout(() => {
            // Update result display
            const resultImage = document.getElementById('result-image');
            resultImage.src = selectedSkin.image;
            
            // Show result
            const rouletteResult = document.getElementById('roulette-result');
            rouletteResult.classList.add('active');
            
            // If legendary or epic, update stats
            if (selectedSkin.tier >= 4) { // Tier 4 or higher is legendary
                updateUserStat('legendary_count', 1);
            }
            
            // Update NFT count
            updateUserStat('nft_count', 1);
            
            // Add to user's inventory
            addToInventory(selectedSkin);
        }, duration + 200); // Add a small buffer for animation completion
    }, 50);
}

// Modified open case function to use the improved roulette
function openCase(caseId) {
    return new Promise(async (resolve, reject) => {
        try {
            // Get fresh balance data first
            const { data: balanceData, error: balanceError } = await supabase.rpc('get_balance', {
                p_telegram_id: telegramId
            });
                
            if (balanceError) {
                console.error('Error getting balance:', balanceError);
                showCustomDialog('Error retrieving your balance. Please try again.');
                reject(balanceError);
                return;
            }
                
            // Update the local userBalance variable with fresh data
            userBalance = balanceData || 0;
            updateBalanceDisplay();
            
            // Now check if user has enough balance
            if (userBalance < 100) {
                showNotEnoughBalanceDialog();
                reject(new Error('Insufficient balance'));
                return;
            }
            
            // Initialize roulette with randomized order
            initializeRoulette();
            
            // Hide result
            const rouletteResult = document.getElementById('roulette-result');
            rouletteResult.classList.remove('active');
            
            // Show roulette overlay
            const rouletteOverlay = document.getElementById('roulette-overlay');
            rouletteOverlay.classList.add('active');
            
            // Deduct balance
            const success = await updateUserBalance(-100, `Opened Labubu case`, 'purchase');
            
            if (!success) {
                showCustomDialog('Failed to process the transaction. Please try again.');
                rouletteOverlay.classList.remove('active');
                reject(new Error('Transaction failed'));
                return;
            }
            
            // Update cases opened stat
            await updateUserStat('cases_opened', 1);
            
            // Pick a random skin based on probability
            const selectedSkin = getRandomSkinByProbability();
            console.log('Selected skin:', selectedSkin);
            
            // Start the enhanced animation
            startRouletteAnimation(selectedSkin);
            
            resolve(selectedSkin);
        } catch (err) {
            console.error('Error in openCase:', err);
            showCustomDialog('An error occurred. Please try again.');
            document.getElementById('roulette-overlay').classList.remove('active');
            reject(err);
        }
    });
} 