// Initialize the app
async function initApp() {
    console.log('=== INITIALIZING APP ===');
    try {
        // Initialize TON Connect first (from tonConnect.js)
        await initializeTonConnect();
        
        // Setup the app (main logic of this function)
        await setupApp();
        
        console.log('App initialization completed');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        alert('Failed to initialize the app. Please refresh and try again.');
    }
}

// Call initApp when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM is already ready
    initApp();
}

// Initialize and set up the app
async function setupApp() {
    try {
        console.log('Setting up app...');
        console.log('Telegram WebApp instance (from config.js):', tg);
        console.log('Telegram WebApp initDataUnsafe:', tg.initDataUnsafe);
        
        // Get user data from Telegram (uses tg from config.js)
        const user = tg.initDataUnsafe?.user || {};
        if (tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) {
            telegramId = tg.initDataUnsafe.user.id; // telegramId is global from config.js
            console.log('Successfully retrieved telegram ID:', telegramId);
        } else {
            console.warn('[Desktop Test Mode] Could not retrieve real telegram ID from initDataUnsafe. Proceeding with limited functionality for testing.');
            // For desktop testing, you might want to assign a mock telegramId
            // telegramId = '123456789'; // Example mock ID
        }
        
        // Populate global user name variables from config.js BEFORE calling registerUserAndGetBalance
        userFirstName = user.first_name || 'User'; 
        userLastName = user.last_name || '';
        userName = user.username ? `@${user.username}` : (userFirstName + (userLastName ? ` ${userLastName}` : '')).trim();
        userPhotoUrl = user.photo_url || 'https://picsum.photos/seed/profile/300'; // Though not directly used by registerUserAndGetBalance, good to set it here.
        
        // Debug: Log Telegram user data
        console.log('Telegram user data prepared:', { telegramId, userName, userFirstName, userLastName, userPhotoUrl });
        
        // Register user and get balance (user.js - needs telegramId, userName, userFirstName, userLastName from config.js)
        await registerUserAndGetBalance(); 
        console.log('User registered and balance retrieved (userBalance in config.js):', userBalance);
        
        // Get user stats (user.js)
        const stats = await getUserStats();
        console.log('User stats retrieved:', stats);
        
        // Get user inventory (inventory.js)
        await getUserInventory();
        
        // Update user data in UI (user.js - populates profile tab)
        await updateUserData();
        
        // Initialize daily rewards (dailyRewards.js)
        initDailyRewards();

        // Update activity log (activityLog.js)
        updateActivityLog();
        
        // Set initial rarity nav visibility (uiHandlers.js)
        updateRarityNavVisibility('cases-tab');
        
        // Make the first tab active (uiHandlers.js)
        activateTab('cases-tab'); // Assuming activateTab is in uiHandlers.js
        
        console.log('App setup completed successfully');
        
        // Attach tab navigation event listeners (uiHandlers.js)
        attachEventListeners();
        
        // Preload Dark Aura Lottie animations for better performance (roulette.js or caseOpening.js)
        preloadLottieAnimations().catch(error => {
            console.warn('[App Setup] Failed to preload Lottie animations:', error);
        });

        // Load case opening data from local storage (caseOpening.js)
        loadCaseOpeningData();

    } catch (error) {
        console.error('Error in setupApp:', error);
        alert('Error setting up the app. Please try again later.');
    }
}

// This function was removed in a previous step but is part of app setup flow.
// It should be in this file or called from initApp if it's distinct.
// For now, keeping it commented out as its direct call was removed.
// function startApp() {
//     if (document.readyState === 'loading') {
//         document.addEventListener('DOMContentLoaded', initializeApp); // initializeApp might be an old name for initApp
//     } else {
//         // DOM is already ready
//         initializeApp();
//     }
// }
// startApp(); // Call was also removed.

console.log('[App Setup] appSetup.js loaded'); 