// Initialize the app
async function initApp() {
    console.log('[AppSetup] Step 0: initApp() called.');
    console.log('=== APP INITIALIZATION SEQUENCE START ===');
    try {
        console.log('[AppSetup] Step 1: Attempting to initialize TON Connect...');
        await initializeTonConnect();
        console.log('[AppSetup] Step 2: TON Connect initialization finished (or attempted).');
        
        console.log('[AppSetup] Step 3: Attempting to run main setupApp()...');
        await setupApp();
        console.log('[AppSetup] Step 4: Main setupApp() finished.');
        
        console.log('=== APP INITIALIZATION SEQUENCE COMPLETED ===');
    } catch (error) {
        console.error('[AppSetup] CRITICAL ERROR in initApp():', error);
        alert('Failed to initialize the app. Please refresh and try again.');
    }
}

// Call initApp when the page loads
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initApp);
// } else {
//     // DOM is already ready
//     initApp();
// }

window.addEventListener('load', initApp);

// Initialize and set up the app
async function setupApp() {
    try {
        console.log('[AppSetup] setupApp() - Step 5: Starting main application setup...');
        console.log('[AppSetup] setupApp() - Telegram WebApp SDK instance from config.js (tg):', tg);
        console.log('[AppSetup] setupApp() - Telegram WebApp initDataUnsafe from tg:', tg ? tg.initDataUnsafe : 'tg is null');
        
        console.log('[AppSetup] setupApp() - Step 6: Preparing Telegram user data...');
        const user = tg && tg.initDataUnsafe ? tg.initDataUnsafe.user : {};
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) {
            telegramId = tg.initDataUnsafe.user.id; 
            console.log('[AppSetup] setupApp() - Successfully retrieved telegram ID:', telegramId);
        } else {
            console.warn('[AppSetup] setupApp() - Could not retrieve real telegram ID. User object from TG:', user);
        }
        
        userFirstName = user.first_name || 'User'; 
        userLastName = user.last_name || '';
        userName = user.username ? `@${user.username}` : (userFirstName + (userLastName ? ` ${userLastName}` : '')).trim();
        userPhotoUrl = user.photo_url || 'https://picsum.photos/seed/profile/300';
        console.log('[AppSetup] setupApp() - Telegram user data prepared:', { telegramId, userName, userFirstName, userLastName, userPhotoUrl });
        
        console.log('[AppSetup] setupApp() - Step 7: Calling registerUserAndGetBalance()...');
        await registerUserAndGetBalance(); 
        console.log('[AppSetup] setupApp() - registerUserAndGetBalance() finished. Current userBalance (from config.js):', userBalance);
        
        console.log('[AppSetup] setupApp() - Step 8: Calling getUserStats()...');
        const stats = await getUserStats();
        console.log('[AppSetup] setupApp() - getUserStats() finished. Stats retrieved:', stats);
        
        console.log('[AppSetup] setupApp() - Step 9: Calling getUserInventory()...');
        await getUserInventory();
        console.log('[AppSetup] setupApp() - getUserInventory() finished.');
        
        console.log('[AppSetup] setupApp() - Step 10: Calling updateUserData()...');
        await updateUserData();
        console.log('[AppSetup] setupApp() - updateUserData() finished.');
        
        console.log('[AppSetup] setupApp() - Step 11: Calling initDailyRewards()...');
        initDailyRewards();
        console.log('[AppSetup] setupApp() - initDailyRewards() finished.');

        console.log('[AppSetup] setupApp() - Step 12: Calling updateActivityLog()...');
        updateActivityLog();
        console.log('[AppSetup] setupApp() - updateActivityLog() finished.');
        
        console.log('[AppSetup] setupApp() - Step 13: Setting initial UI elements (rarity nav, activate tab)...');
        updateRarityNavVisibility('cases-tab');
        activateTab('cases-tab');
        console.log('[AppSetup] setupApp() - Initial UI elements set.');
        
        console.log('[AppSetup] setupApp() - Step 14: Attaching event listeners...');
        attachEventListeners();
        console.log('[AppSetup] setupApp() - Event listeners attached.');
        
        console.log('[AppSetup] setupApp() - Step 15: Preloading Lottie animations...');
        preloadLottieAnimations().catch(error => {
            console.warn('[AppSetup] setupApp() - WARNING: Failed to preload Lottie animations:', error);
        });
        console.log('[AppSetup] setupApp() - Preloading Lottie animations initiated.');

        console.log('[AppSetup] setupApp() - Step 16: Loading case opening data...');
        loadCaseOpeningData();
        console.log('[AppSetup] setupApp() - Case opening data loaded.');

        console.log('[AppSetup] setupApp() - SUCCESSFULLY COMPLETED MAIN APPLICATION SETUP.');

    } catch (error) {
        console.error('[AppSetup] setupApp() - CRITICAL ERROR during main application setup:', error);
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

console.log('[AppSetup] appSetup.js script finished loading.'); 