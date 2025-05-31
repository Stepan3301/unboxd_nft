// === DAILY REWARDS SYSTEM ===

// Constants for daily rewards (REWARD_AMOUNT is global from config.js)
const REWARD_COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

// DOM elements (Ensure these are consistently named and present in HTML)
// It's good practice to query these once, perhaps at the start of initDailyRewards
let dailyRewardBtn;     // Initialized in initDailyRewards
let dailyRewardReady;   // Initialized in initDailyRewards
let dailyRewardTimer;   // Initialized in initDailyRewards
let rewardCountdown;    // Initialized in initDailyRewards
let dailyRewardDialog;  // Initialized in initDailyRewards
// dailyRewardDialogBtn is handled by uiHandlers.js for closing the dialog

// countdownInterval is a global from config.js, managed here

// Initialize daily reward system
function initDailyRewards() {
    if (!telegramId) { // telegramId from config.js
        console.error('[Daily Rewards] No Telegram ID available for daily rewards');
        return;
    }
    console.log("[Daily Rewards] Initializing daily rewards system...");

    // Initialize DOM elements here to ensure they are found after DOM is ready
    dailyRewardBtn = document.getElementById('daily-reward-btn');
    dailyRewardReady = document.getElementById('daily-reward-ready');
    dailyRewardTimer = document.getElementById('daily-reward-timer');
    rewardCountdown = document.getElementById('reward-countdown');
    dailyRewardDialog = document.getElementById('daily-reward-dialog');

    if (!dailyRewardBtn || !dailyRewardReady || !dailyRewardTimer || !rewardCountdown || !dailyRewardDialog) {
        console.error('[Daily Rewards] One or more DOM elements for daily rewards not found.');
        return; // Prevent further execution if elements are missing
    }

    checkRewardAvailability();
}

// Check reward availability from database
async function checkRewardAvailability() {
    try {
        const { data, error } = await supabase.rpc('check_reward_availability', {
            p_telegram_id: telegramId
        });
        
        if (error) {
            console.error('[Daily Rewards] Error checking reward availability:', error);
            // Fallback to local storage if database call fails
            const rewardData = loadRewardDataFromLocalStorage();
            updateRewardUI(rewardData);
            return;
        }
        
        console.log('[Daily Rewards] Reward availability data from DB:', data);
        
        const rewardData = {
            lastClaimed: data.last_claimed ? new Date(data.last_claimed).getTime() : 0,
            nextAvailable: new Date(data.next_available).getTime()
        };
        
        updateRewardUI(rewardData);
        saveRewardDataToLocalStorage(rewardData); // Also update localStorage as a backup
    } catch (err) {
        console.error('[Daily Rewards] Error in checkRewardAvailability:', err);
        const rewardData = loadRewardDataFromLocalStorage();
        updateRewardUI(rewardData);
    }
}

// Load reward data from localStorage (backup)
function loadRewardDataFromLocalStorage() {
    const savedData = localStorage.getItem(`dailyReward_${telegramId}`);
    if (!savedData) {
        return { lastClaimed: 0, nextAvailable: 0 }; // First time user - reward is ready
    }
    try {
        return JSON.parse(savedData);
    } catch (e) {
        console.error('[Daily Rewards] Error parsing reward data from localStorage:', e);
        return { lastClaimed: 0, nextAvailable: 0 }; // Fallback on parsing error
    }
}

// Save reward data to localStorage (backup)
function saveRewardDataToLocalStorage(data) {
    try {
        localStorage.setItem(`dailyReward_${telegramId}`, JSON.stringify(data));
    } catch (e) {
        console.error('[Daily Rewards] Error saving reward data to localStorage:', e);
    }
}

// Update the UI based on reward availability
function updateRewardUI(rewardData) {
    if (!dailyRewardReady || !dailyRewardTimer || !dailyRewardBtn) {
        console.warn('[Daily Rewards] UI elements not ready for updateRewardUI.');
        return;
    }
    const now = Date.now();
    const isRewardAvailable = now >= rewardData.nextAvailable;
    
    if (isRewardAvailable) {
        dailyRewardReady.style.display = 'flex';
        dailyRewardTimer.style.display = 'none';
        dailyRewardBtn.classList.remove('disabled');
        dailyRewardBtn.disabled = false;
    } else {
        dailyRewardReady.style.display = 'none';
        dailyRewardTimer.style.display = 'flex';
        dailyRewardBtn.classList.add('disabled');
        dailyRewardBtn.disabled = true;
        startCountdown(rewardData.nextAvailable);
    }
}

// Start countdown timer
function startCountdown(targetTime) {
    if (countdownInterval) { // countdownInterval from config.js
        clearInterval(countdownInterval);
    }
    
    function update() {
        const timeLeft = updateCountdownDisplay(targetTime);
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            checkRewardAvailability(); // Re-check from database
        }
    }
    update(); // Update immediately
    countdownInterval = setInterval(update, 1000);
}

// Update countdown display and return time left
function updateCountdownDisplay(targetTime) {
    if (!rewardCountdown) {
        console.warn('[Daily Rewards] rewardCountdown element not found for display update.');
        return 0;
    }
    const now = Date.now();
    const timeLeft = Math.max(0, targetTime - now);
    
    if (timeLeft > 0) {
        const hours = Math.floor(timeLeft / REWARD_COOLDOWN_MS) % 24; // Corrected for hours in cooldown
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
        rewardCountdown.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        rewardCountdown.textContent = '00:00:00';
    }
    return timeLeft;
}

// Claim daily reward
async function claimDailyReward() {
    try {
        console.log("[Daily Rewards] Attempting to claim daily reward for telegramId:", telegramId);
        
        // Call the database function to claim reward
        // REWARD_AMOUNT is global from config.js
        const { data, error } = await supabase.rpc('claim_reward', {
            p_telegram_id: telegramId,
            p_amount: REWARD_AMOUNT 
        });
        
        if (error) {
            console.error('[Daily Rewards] Error claiming reward from DB:', error);
            showToast('Failed to claim your reward. Please try again.', 'error');
            return;
        }
        
        if (!data.success) {
            console.log('[Daily Rewards] Reward not available:', data.message);
            showToast(data.message, 'warning'); 
            checkRewardAvailability(); // Re-check to update UI based on server state
            return;
        }
        
        console.log('[Daily Rewards] Reward claimed successfully:', data);
        
        if (typeof data.balance !== 'undefined') {
            userBalance = parseFloat(data.balance); // userBalance from config.js
        } else {
            await getUserBalance(); // from user.js - ensure it updates global userBalance
        }
        updateBalanceDisplay(); // from user.js - updates UI
        
        const rewardData = {
            lastClaimed: new Date().getTime(),
            nextAvailable: new Date(data.next_available).getTime()
        };
        updateRewardUI(rewardData);
        saveRewardDataToLocalStorage(rewardData);
        
        if (dailyRewardDialog) dailyRewardDialog.classList.add('active');
        
        addActivity('daily_reward', { amount: REWARD_AMOUNT }); // addActivity from activityLog.js
        
    } catch (err) {
        console.error('[Daily Rewards] Error in claimDailyReward function:', err);
        showToast('An error occurred while claiming reward. Please try again.', 'error');
    }
}

console.log('[Daily Rewards] dailyRewards.js loaded'); 