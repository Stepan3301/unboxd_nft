// Initialize the app
async function initApp() {
    console.log('[AppSetup] Step 0: initApp() called.');
    console.log('=== APP INITIALIZATION SEQUENCE START ===');
    
    try {
        console.log('[AppSetup] Step 1: Starting main setupApp()...');
        await setupApp();
        console.log('[AppSetup] Step 2: Main setupApp() finished.');
        
        console.log('[AppSetup] Step 3: Starting TON Connect initialization...');
        
        // Add a small delay to ensure TonConnect SDK is fully loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            // Check if initializeTonConnect function is available with multiple attempts
            let tonConnectSuccess = false;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (!tonConnectSuccess && attempts < maxAttempts) {
                attempts++;
                console.log(`[AppSetup] Step 4: Attempting TON Connect initialization (attempt ${attempts}/${maxAttempts})`);
                
                if (typeof initializeTonConnect === 'function') {
                    tonConnectSuccess = await initializeTonConnect();
                } else if (typeof window.initializeTonConnect === 'function') {
                    tonConnectSuccess = await window.initializeTonConnect();
                } else {
                    console.warn(`[AppSetup] Step 4: initializeTonConnect function not available (attempt ${attempts}/${maxAttempts})`);
                    if (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                        continue;
                    }
                }
                
                if (tonConnectSuccess) {
                    console.log('[AppSetup] Step 4: TON Connect initialized successfully.');
                    break;
                } else {
                    console.warn(`[AppSetup] Step 4: TON Connect initialization failed (attempt ${attempts}/${maxAttempts})`);
                    if (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                    }
                }
            }
            
            if (!tonConnectSuccess) {
                console.warn('[AppSetup] Step 4: TON Connect initialization failed after all attempts, but app will continue.');
                console.warn('[AppSetup] TON Connect will be initialized on first user interaction.');
            }
        } catch (tonConnectError) {
            console.error('[AppSetup] Step 4: TON Connect initialization threw an error:', tonConnectError);
            console.warn('[AppSetup] App will continue without TON Connect functionality.');
        }
        
        console.log('=== APP INITIALIZATION SEQUENCE COMPLETED ===');
    } catch (error) {
        console.error('[AppSetup] CRITICAL ERROR in initApp():', error);
        
        // Show user-friendly error message
        if (typeof showToast === 'function') {
            showToast('Failed to initialize the app. Please refresh and try again.', 'error');
        } else {
            console.error('[AppSetup] App initialization failed. Please refresh and try again.');
        }
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
        console.log('[AppSetup] setupApp() - Step 6: Displaying loading state (if any)...');
        // showLoadingState(); // Example if you have a visual loader

        console.log('[AppSetup] setupApp() - Step 7: Preloading Lottie animations (non-blocking)...');
        preloadLottieAnimations(); // FROM ROULETTE.JS - Call without await
        console.log('[AppSetup] setupApp() - Lottie preloading initiated in background.');

        console.log('[AppSetup] setupApp() - Step 8: Initializing Telegram User Data...');
        console.log('[AppSetup] setupApp() - Telegram WebApp SDK instance from config.js (tg):', tg);
        console.log('[AppSetup] setupApp() - Telegram WebApp initDataUnsafe from tg:', tg ? tg.initDataUnsafe : 'tg is null');
        
        console.log('[AppSetup] setupApp() - Step 9: Preparing Telegram user data...');
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
        
        console.log('[AppSetup] setupApp() - Step 10: Calling registerUserAndGetBalance()...');
        await registerUserAndGetBalance(); 
        console.log('[AppSetup] setupApp() - registerUserAndGetBalance() finished. Current userBalance (from config.js):', userBalance);
        
        console.log('[AppSetup] setupApp() - Step 11: Calling getUserStats()...');
        const stats = await getUserStats();
        console.log('[AppSetup] setupApp() - getUserStats() finished. Stats retrieved:', stats);
        
        console.log('[AppSetup] setupApp() - Step 12: Calling getUserInventory()...');
        await getUserInventory();
        console.log('[AppSetup] setupApp() - getUserInventory() finished.');
        
        console.log('[AppSetup] setupApp() - Step 13: Calling updateUserData()...');
        await updateUserData();
        console.log('[AppSetup] setupApp() - updateUserData() finished.');
        
        console.log('[AppSetup] setupApp() - Step 14: Calling initDailyRewards()...');
        initDailyRewards();
        console.log('[AppSetup] setupApp() - initDailyRewards() finished.');

        console.log('[AppSetup] setupApp() - Step 15: Calling updateActivityLogUI()...');
        updateActivityLogUI();
        console.log('[AppSetup] setupApp() - updateActivityLogUI() finished.');
        
        console.log('[AppSetup] setupApp() - Step 16: Setting initial UI elements (rarity nav, activate tab)...');
        updateRarityNavVisibility('home-tab');
        activateTab('home-tab');
        console.log('[AppSetup] setupApp() - Initial UI elements set.');
        
        console.log('[AppSetup] setupApp() - Step 17: Attaching event listeners...');
        attachEventListeners();
        console.log('[AppSetup] setupApp() - Event listeners attached.');

        console.log('[AppSetup] setupApp() - Step 17b: Setting up Cases tab sub-navigation...');
        setupCasesSubNavigation(); // Call the new function
        console.log('[AppSetup] setupApp() - Cases tab sub-navigation setup.');
        
        console.log('[AppSetup] setupApp() - Step 18: Loading case opening data...');
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