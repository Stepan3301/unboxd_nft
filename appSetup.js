// Initialize the app
async function initApp() {
    console.log('[AppSetup] Step 0: initApp() called.');
    console.log('=== APP INITIALIZATION SEQUENCE START ===');
    
    try {
        console.log('[AppSetup] Step 1: Starting main setupApp()...');
        // The setupApp function will now handle UI rendering and deferring TonConnect
        await setupApp();
        console.log('[AppSetup] Step 2: Main setupApp() finished.');
        
        console.log('=== APP INITIALIZATION SEQUENCE COMPLETED ===');
        
    } catch (error) {
        console.error('[AppSetup] CRITICAL ERROR in initApp():', error);
        if (typeof showToast === 'function') {
            showToast('Failed to initialize the app. Please refresh and try again.', 'error');
        } else {
            // Fallback for when toast is not available
            document.body.innerHTML = `<div style="color: red; padding: 20px;">Critical Error: Failed to initialize. Please refresh.</div>`;
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

        // Preload assets in the background
        preloadLottieAnimations();

        // Prepare Telegram user data
        const user = window.Telegram?.WebApp?.initDataUnsafe?.user || {};
        window.telegramId = user.id;
        window.userFirstName = user.first_name || 'User';
        window.userLastName = user.last_name || '';
        window.userName = user.username ? `@${user.username}` : `${window.userFirstName} ${window.userLastName}`.trim();
        window.userPhotoUrl = user.photo_url || 'https://picsum.photos/seed/profile/300';
        
        console.log('[AppSetup] setupApp() - User data prepared:', {
            telegramId,
            userName,
            userPhotoUrl
        });
        
        // Register user and get initial data
        await registerUserAndGetBalance();
        await getUserStats();
        await getUserInventory();
        
        // Update the UI with the fetched data
        await updateUserData();
        
        // Initialize UI components and event listeners
        initDailyRewards();
        updateActivityLogUI();
        updateRarityNavVisibility('home-tab');
        activateTab('home-tab');
        attachEventListeners();
        setupCasesSubNavigation();
        loadCaseOpeningData();

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
        // Use the toast function for user-facing errors
        if (typeof showToast === 'function') {
            showToast('Error setting up the app. Please try again later.', 'error');
        } else {
            alert('Error setting up the app. Please try again later.');
        }
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