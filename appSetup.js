// Initialize the app
async function initApp() {
    console.log('[AppSetup] Step 0: initApp() called.');
    console.log('=== APP INITIALIZATION SEQUENCE START ===');
    
    try {
        console.log('[AppSetup] Step 1: Starting main setupApp()...');
        await setupApp();
        console.log('[AppSetup] Step 2: Main setupApp() finished.');
        
        console.log('[AppSetup] Step 3: Starting TON Connect initialization...');
        
        try {
            console.log('[AppSetup] Step 3: Attaching event listeners...');
            attachEventListeners();
            console.log('[AppSetup] Step 3 Complete: Event listeners attached.');

            // Initialize TON Connect with proper error handling
            try {
                console.log('[AppSetup] Step 4: Initializing TON Connect...');
                
                // Check if TON Connect is available
                if (window.tonConnectUnavailable) {
                    console.warn('[AppSetup] TON Connect marked as unavailable, skipping initialization');
                } else if (window.TonConnectWallet && typeof window.TonConnectWallet.isReady === 'function') {
                    console.log('[AppSetup] TonConnectWallet module found. Initializing...');
                    
                    // Initialize with timeout
                    const initPromise = window.TonConnectWallet.initialize();
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Initialization timeout')), 10000)
                    );
                    
                    await Promise.race([initPromise, timeoutPromise]);
                    console.log('[AppSetup] TON Connect initialization completed successfully');
                    
                } else {
                    console.warn('[AppSetup] TonConnectWallet module not ready yet. Will initialize on first user interaction.');
                    
                    // Set up delayed initialization
                    window.addEventListener('load', () => {
                        setTimeout(async () => {
                            if (window.TonConnectWallet && !window.tonConnectUnavailable) {
                                try {
                                    await window.TonConnectWallet.initialize();
                                    console.log('[AppSetup] Delayed TON Connect initialization successful');
                                } catch (error) {
                                    console.warn('[AppSetup] Delayed TON Connect initialization failed:', error);
                                }
                            }
                        }, 3000);
                    });
                }
            } catch (tonConnectError) {
                console.error('[AppSetup] TON Connect initialization error:', tonConnectError);
                console.warn('[AppSetup] App will continue without TON Connect functionality');
            }
        } catch (error) {
            console.error('[AppSetup] CRITICAL ERROR in initApp():', error);
            
            // Show user-friendly error message
            if (typeof showToast === 'function') {
                showToast('Failed to initialize the app. Please refresh and try again.', 'error');
            } else {
                console.error('[AppSetup] App initialization failed. Please refresh and try again.');
            }
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

        // Defer TON Connect initialization until after the main app is fully set up and rendered.
        setTimeout(() => {
            if (window.TonConnectWallet) {
                console.log('[AppSetup] Initializing TON Connect Wallet after main setup...');
                window.TonConnectWallet.initialize().catch(err => {
                    console.error('[AppSetup] Deferred TON Connect initialization failed:', err);
                });
            } else {
                console.warn('[AppSetup] TonConnectWallet module not found for deferred initialization.');
            }
        }, 100); // A short delay to ensure the main thread is free.

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