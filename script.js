// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Supabase configuration
const SUPABASE_URL = 'https://qkuqlxwqblmegyhrdwgm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdXFseHdxYmxtZWd5aHJkd2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg4NDc1NjcsImV4cCI6MjA0NDQyMzU2N30.x-9N3O1g0qT88GvSy-LHlOXczGt9vQUCT2vU0u0x4ZM';

// Global Variables (Caution: Review these)
let userBalance = 0;
let dailyStreak = 0;
let telegramId = null;
let userName = '';
let userFirstName = '';
let userLastName = '';
let userPhotoUrl = '';
let currentResultSkin = null;

// Daily rewards
const REWARD_AMOUNT = 1000;
let countdownInterval = null;

// Case opening tracking
let caseOpeningsCount = 0;
let guaranteedTier3NextOpening = false;

// Activity log constants
const MAX_ACTIVITIES = 5;
const MAX_STORED_ACTIVITIES = 20;

// TON Connect
let tonConnectUI = null;

// Skin prices per tier (common, rare, epic, legendary, mythic, divine)
const skinPrices = {
    1: 20,   // Common
    2: 50,   // Rare
    3: 120,  // Epic
    4: 300,  // Legendary
    5: 750,  // Mythic
    6: 10000 // Divine
};

// Dark Aura skins data for preloading
const darkAuraSkins = [
    { name: 'Haunted Desk Calendar', tier: 1, price: 20, image: 'cleaned-deskcalendar-280571.json', type: 'lottie' },
    { name: 'Mad Pumpkin Spirit', tier: 2, price: 50, image: 'cleaned-madpumpkin-7551.json', type: 'lottie' },
    { name: 'Electric Skull', tier: 3, price: 120, image: 'cleaned-electricskull-8221.json', type: 'lottie' },
    { name: 'Cursed Voodoo Doll', tier: 4, price: 300, image: 'cleaned-voodoodoll-7970.json', type: 'lottie' },
    { name: 'Bewitched Ginger Cookie', tier: 4, price: 300, image: 'cleaned-gingercookie-20477.json', type: 'lottie' },
    { name: 'Mystical Signet Ring', tier: 5, price: 750, image: 'cleaned-signetring-14328.json', type: 'lottie' },
    { name: 'Mini Oscar Phantom', tier: 6, price: 10000, image: 'cleaned-minioscar-1983.json', type: 'lottie' },
    { name: 'Scared Cat Obelisk', tier: 6, price: 10000, image: 'cleaned-scaredcat-18595.json', type: 'lottie' }
];

// Initialize Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabase = supabaseClient;

// Initialize TON Connect when the script loads
async function initializeTonConnect() {
    console.log('[TON Connect] Starting initialization...');
    
    try {
        if (typeof TonConnectUI === 'undefined') {
            console.error('[TON Connect] TonConnectUI is not defined. Make sure the SDK is loaded.');
            return;
        }
        
        tonConnectUI = new TonConnectUI({
            manifestUrl: 'https://yourdomain.com/tonconnect-manifest.json',
            buttonRootId: 'ton-connect-button'
        });
        
        // Subscribe to wallet connection changes
        tonConnectUI.onStatusChange(wallet => {
            if (wallet) {
                console.log('[TON Connect] Wallet connected:', wallet);
                // Update UI to show connected state
                const button = document.getElementById('ton-connect-wallet-button');
                if (button) {
                    button.textContent = 'Disconnect TON Wallet';
                    button.classList.add('connected');
                }
                // Update modal if it's open
                updateBuyUcoinsModalForConnectedWallet();
            } else {
                console.log('[TON Connect] Wallet disconnected');
                // Update UI to show disconnected state
                const button = document.getElementById('ton-connect-wallet-button');
                if (button) {
                    button.textContent = 'Connect TON Wallet';
                    button.classList.remove('connected');
                }
                updateBuyUcoinsModalForDisconnectedWallet();
            }
        });
        
        console.log('[TON Connect] Initialization complete');
    } catch (error) {
        console.error('[TON Connect] Initialization error:', error);
    }
}

// Update Buy UCoins modal when wallet is connected
function updateBuyUcoinsModalForConnectedWallet() {
    const packagesList = document.getElementById('ucoin-packages-list');
    const connectPrompt = document.getElementById('ucoin-connect-prompt');
    
    if (packagesList && connectPrompt) {
        packagesList.style.display = 'block';
        connectPrompt.style.display = 'none';
    }
}

// Update Buy UCoins modal when wallet is disconnected
function updateBuyUcoinsModalForDisconnectedWallet() {
    const packagesList = document.getElementById('ucoin-packages-list');
    const connectPrompt = document.getElementById('ucoin-connect-prompt');
    
    if (packagesList && connectPrompt) {
        packagesList.style.display = 'none';
        connectPrompt.style.display = 'block';
    }
}

// Initialize the app
async function initApp() {
    console.log('=== INITIALIZING APP ===');
    try {
        // Initialize TON Connect first
        await initializeTonConnect();
        
        // Setup the app
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
        console.log('Telegram WebApp instance:', tg);
        console.log('Telegram WebApp initDataUnsafe:', tg.initDataUnsafe);
        
        // Get user data from Telegram
        const user = tg.initDataUnsafe?.user || {};
        if (tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) {
            telegramId = tg.initDataUnsafe.user.id;
            console.log('Successfully retrieved telegram ID:', telegramId);
        } else {
            console.warn('[Desktop Test Mode] Could not retrieve real telegram ID from initDataUnsafe. Proceeding with limited functionality for testing.');
        }
        
        // Debug: Log Telegram user data
        console.log('Telegram user data:', user);
        console.log('Telegram ID:', telegramId);
        
        // Register user and get balance from Supabase
        await registerUserAndGetBalance();
        console.log('User registered and balance retrieved:', userBalance);
        
        // Get user stats
        const stats = await getUserStats();
        console.log('User stats retrieved:', stats);
        
        // Get user inventory
        await getUserInventory();
        
        // Update user data
        await updateUserData();
        
        // Initialize daily rewards
        initDailyRewards();

        // Update activity log
        updateActivityLog();
        
        // Set initial rarity nav visibility
        updateRarityNavVisibility('cases-tab');
        
        // Make the first tab active
        const casesNavBtn = document.querySelector('.nav-btn[data-tab="cases-tab"]');
        const casesTab = document.getElementById('cases-tab');
        
        if (casesNavBtn) {
            casesNavBtn.classList.add('active');
        } else {
            console.warn('Cases navigation button not found');
        }
        
        if (casesTab) {
            casesTab.classList.add('active');
        } else {
            console.warn('Cases tab content not found');
        }
        
        console.log('App setup completed successfully');
        
        // Attach tab navigation event listeners
        attachEventListeners();
        
        // Preload Dark Aura Lottie animations for better performance
        preloadLottieAnimations().catch(error => {
            console.warn('[App Setup] Failed to preload Lottie animations:', error);
        });
    } catch (error) {
        console.error('Error in setupApp:', error);
        alert('Error setting up the app. Please try again later.');
    }
}

// Initialize the app when DOM is ready
function startApp() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        // DOM is already ready
        initializeApp();
    }
}

// Start the app
startApp();

// Function to attach event listeners
function attachEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            console.log('Nav button clicked:', btn.getAttribute('data-tab'));
            
            const bottomNav = document.querySelector('.bottom-nav');
            // Check if we're in case detail view first and close it
            if (bottomNav.hasAttribute('data-case-detail-open')) {
                console.log('Closing case detail view from nav click');
                document.querySelectorAll('.case-detail').forEach(detail => {
                    detail.classList.remove('active');
                });
                bottomNav.removeAttribute('data-case-detail-open');
                // Restore main content visibility
                document.querySelector('.main').style.display = 'block'; 
            }
            
            // Remove active class from all buttons
            document.querySelectorAll('.nav-btn').forEach(nav => {
                nav.classList.remove('active');
            });
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Get the tab ID
            const tabId = btn.getAttribute('data-tab');
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show the selected tab
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                console.log('Showing tab:', tabId);
                targetTab.classList.add('active');
            } else {
                console.error('Target tab not found:', tabId);
            }
            
            // Update rarity navigation visibility based on tab
            updateRarityNavVisibility(tabId);
            
            // Perform tab-specific actions
            if (tabId === 'inventory-tab') {
                console.log('Inventory tab selected, refreshing inventory');
                await getUserInventory();
            }
            
            if (tabId === 'profile-tab') {
                console.log('Profile tab selected, updating user data');
                await updateUserData();
            }
            
            if (tabId === 'cases-tab') {
                console.log('Home tab selected, updating activity log');
                updateActivityLog();
            }
        });
    });

    // Case view buttons (Featured and Popular)
    document.querySelectorAll('.featured-btn[data-case="labubu"], .open-btn[data-case="labubu"]').forEach(button => {
        button.addEventListener('click', () => {
            const caseId = button.dataset.case;
            console.log('View Case button clicked for:', caseId);
            if (caseId === 'labubu') {
                const labubuCaseDetail = document.getElementById('labubu-case-detail');
                if (labubuCaseDetail) {
                    labubuCaseDetail.classList.add('active');
                    document.querySelector('.main').style.display = 'none'; // Hide main content
                    document.querySelector('.bottom-nav').setAttribute('data-case-detail-open', 'true');
                } else {
                    console.error('Labubu case detail element not found');
                }
            }
        });
    });

    // Case detail back button
    const labubuCaseBack = document.getElementById('labubu-case-back');
    if (labubuCaseBack) {
        labubuCaseBack.addEventListener('click', () => {
            const labubuCaseDetail = document.getElementById('labubu-case-detail');
            if (labubuCaseDetail) {
                labubuCaseDetail.classList.remove('active');
                document.querySelector('.main').style.display = 'block'; // Show main content
                document.querySelector('.bottom-nav').removeAttribute('data-case-detail-open');
            }
        });
    }

    // Dark Aura Case view buttons (only for buttons that should open the case detail view)
    document.querySelectorAll('.featured-btn[data-case="darkaura"]:not(.open-case-btn), .open-btn[data-case="darkaura"]:not(.open-case-btn)').forEach(button => {
        button.addEventListener('click', () => {
            const caseId = button.dataset.case;
            console.log('View Case button clicked for:', caseId);
            if (caseId === 'darkaura') {
                const darkauraCaseDetail = document.getElementById('darkaura-case-detail');
                if (darkauraCaseDetail) {
                    darkauraCaseDetail.classList.add('active');
                    document.querySelector('.main').style.display = 'none'; // Hide main content
                    document.querySelector('.bottom-nav').setAttribute('data-case-detail-open', 'true');
                } else {
                    console.error('Dark Aura case detail element not found');
                }
            }
        });
    });

    // Dark Aura Case detail back button
    const darkauraCaseBack = document.getElementById('darkaura-case-back');
    if (darkauraCaseBack) {
        darkauraCaseBack.addEventListener('click', () => {
            const darkauraCaseDetail = document.getElementById('darkaura-case-detail');
            if (darkauraCaseDetail) {
                darkauraCaseDetail.classList.remove('active');
                document.querySelector('.main').style.display = 'block'; // Show main content
                document.querySelector('.bottom-nav').removeAttribute('data-case-detail-open');
            }
        });
    }

    // Daily reward button
    const dailyRewardBtnEl = document.getElementById('daily-reward-btn');
    if (dailyRewardBtnEl) {
         dailyRewardBtnEl.addEventListener('click', claimDailyReward);
    } else {
        console.error("Daily reward button not found for event listener attachment.");
    }

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

    // Custom dialog close button
    const dialogBtn = document.getElementById('dialog-btn');
    if (dialogBtn) {
        dialogBtn.addEventListener('click', () => {
            const dialog = document.getElementById('custom-dialog');
            if (dialog) dialog.classList.remove('active');
        });
    }
    
    // Roulette close button
    const rouletteCloseBtn = document.getElementById('roulette-close');
    if (rouletteCloseBtn) {
        rouletteCloseBtn.addEventListener('click', () => {
            console.log('Roulette close button clicked');
            const rouletteOverlay = document.getElementById('roulette-overlay');
            if (rouletteOverlay) {
                rouletteOverlay.style.display = 'none';
                rouletteOverlay.classList.remove('active');
            }
            
            // Clear current result
            currentResultSkin = null;
            console.log('Cleared currentResultSkin after closing roulette');
        });
    } else {
        console.error('Roulette close button not found');
    }

    // Roulette sell button
    const rouletteSellBtn = document.getElementById('roulette-sell');
    if (rouletteSellBtn) {
        rouletteSellBtn.addEventListener('click', async () => {
            console.log('Roulette sell button clicked');
            console.log('Current result skin:', currentResultSkin);
            
            if (!currentResultSkin) {
                console.error('No current result skin available');
                alert('Cannot sell this item right now. Please try again later.');
                return;
            }
            
            try {
                const success = await sellNFT(currentResultSkin.name, currentResultSkin.tier, currentResultSkin.unique_id);
                if (success) {
                    console.log('Item sold successfully, closing roulette');
                    const rouletteOverlayEl = document.getElementById('roulette-overlay');
                    if (rouletteOverlayEl) rouletteOverlayEl.classList.remove('active');
                }
            } catch (err) {
                console.error('Error in sell button click handler:', err);
                alert('An error occurred while selling. Please try again.');
            }
        });
    } else {
        console.error('Roulette sell button not found');
    }

    // Labubu Case Open Button (inside the case detail view)
    const openLabubuCaseButton = document.querySelector('.case-detail#labubu-case-detail .open-case-btn');
    if (openLabubuCaseButton) {
        openLabubuCaseButton.removeEventListener('click', openLabubuCase); // remove old if exists
        openLabubuCaseButton.addEventListener('click', openLabubuCase);
    } else {
        console.warn('Open Labubu Case button inside detail view not found for event listener.');
    }

    // Dark Aura Case Open Button (inside the case detail view)
    const openDarkAuraCaseButton = document.querySelector('.case-detail#darkaura-case-detail .open-case-btn');
    if (openDarkAuraCaseButton) {
        openDarkAuraCaseButton.addEventListener('click', openDarkAuraCase);
    } else {
        console.warn('Open Dark Aura Case button inside detail view not found for event listener.');
    }

    // TON Connect Wallet Button
    const tonConnectWalletButton = document.getElementById('ton-connect-wallet-button');
    if (tonConnectWalletButton) {
        tonConnectWalletButton.addEventListener('click', async () => {
            if (tonConnectUI) {
                if (tonConnectUI.connected) {
                    try {
                        await tonConnectUI.disconnect();
                        console.log('[TON Connect] Disconnect triggered.');
                    } catch (e) {
                        console.error('[TON Connect] Error during disconnect:', e);
                    }
                } else {
                    console.log('[TON Connect] openModal triggered.');
                    tonConnectUI.openModal();
                }
            } else {
                console.error('[TON Connect] tonConnectUI not initialized.');
                alert('TON Wallet connection service is not available. Please try reloading.');
            }
        });
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

    // Add event listeners for each buy button in the UCoins modal
    document.querySelectorAll('.ucoin-package-buy-btn').forEach(button => {
        button.addEventListener('click', function() {
            const ucoins = this.dataset.ucoins;
            const tonAmount = this.dataset.ton;
            console.log(`Attempting to buy ${ucoins} UCoins for ${tonAmount} TON.`);
            
            if (tonConnectUI && tonConnectUI.connected) {
                 // Placeholder: actual transaction logic will go here
                alert(`Transaction for ${ucoins} UCoins not yet implemented. Wallet is connected.`);
            } else {
                // Show connect prompt within the modal
                document.getElementById('ucoin-packages-list').style.display = 'none';
                document.getElementById('ucoin-connect-prompt').style.display = 'block';
            }
        });
    });

    // Event listener for the new Connect Wallet button inside the UCoins modal
    const ucoinModalConnectBtn = document.getElementById('ucoin-modal-connect-wallet-btn');
    if (ucoinModalConnectBtn && tonConnectUI) {
        ucoinModalConnectBtn.addEventListener('click', () => {
            tonConnectUI.openModal();
        });
    }

    // Dark Aura Lottie animations click handlers
    setupDarkAuraLottieClickHandlers();
}

// Setup click handlers for Dark Aura Lottie animations
async function setupDarkAuraLottieClickHandlers() {
    try {
        // Wait for the lottie-player custom element to be defined
        await customElements.whenDefined('lottie-player');
        console.log('lottie-player element is defined, proceeding to set up click handlers.');

        // Find all static Lottie players in the Dark Aura case
        const darkAuraLotties = document.querySelectorAll('#darkaura-case-detail .static-lottie');
        
        darkAuraLotties.forEach(lottiePlayer => {
            // Ensure the lottiePlayer itself has the methods, sometimes it takes a moment after definition
            if (typeof lottiePlayer.play !== 'function' || typeof lottiePlayer.stop !== 'function') {
                console.warn('Lottie player methods not yet available on this instance, will try again shortly or skip:', lottiePlayer.src);
                return; // Skip this one for now if methods not ready
            }

            lottiePlayer.addEventListener('click', () => {
                console.log('Dark Aura Lottie clicked:', lottiePlayer.src);
                
                // Toggle between static and animated state
                if (lottiePlayer.classList.contains('static-lottie')) {
                    // Start animation
                    lottiePlayer.classList.remove('static-lottie');
                    lottiePlayer.classList.add('animated-lottie');
                    lottiePlayer.loop = true; // Set loop attribute
                    lottiePlayer.autoplay = true; // Set autoplay attribute
                    lottiePlayer.play();
                    
                    // Add visual feedback
                    lottiePlayer.style.transform = 'scale(1.1)';
                    lottiePlayer.style.transition = 'transform 0.3s ease';
                    
                    console.log('Started Lottie animation for:', lottiePlayer.src);
                } else {
                    // Stop animation and return to static
                    lottiePlayer.classList.remove('animated-lottie');
                    lottiePlayer.classList.add('static-lottie');
                    lottiePlayer.loop = false;
                    lottiePlayer.autoplay = false;
                    lottiePlayer.stop();
                    
                    // Remove visual feedback
                    lottiePlayer.style.transform = 'scale(1)';
                    
                    console.log('Stopped Lottie animation for:', lottiePlayer.src);
                }
            });
            
            // Add hover effects
            lottiePlayer.addEventListener('mouseenter', () => {
                lottiePlayer.style.cursor = 'pointer';
                if (lottiePlayer.classList.contains('static-lottie')) {
                    lottiePlayer.style.opacity = '0.8';
                    lottiePlayer.style.transition = 'opacity 0.2s ease';
                }
            });
            
            lottiePlayer.addEventListener('mouseleave', () => {
                if (lottiePlayer.classList.contains('static-lottie')) {
                    lottiePlayer.style.opacity = '1';
                }
            });
        });
        
        console.log(`Setup click handlers for ${darkAuraLotties.length} Dark Aura Lottie animations`);
    } catch (error) {
        console.error('Error setting up Dark Aura Lottie click handlers:', error);
    }
}

// Update profile wallet display to use ucoin img instead of "UCoin" text
function updateProfileWalletDisplay() {
    const profileWallet = document.querySelector('.profile-section .wallet');
    if (profileWallet) {
        profileWallet.innerHTML = `
            <img src="ucoin2.png" alt="UCoin" style="width: 18px; height: 18px; margin-right: 5px;">
            <span id="profile-balance">${userBalance.toLocaleString()}</span>
        `;
    }
}

// Function to control the visibility of the rarity nav
function updateRarityNavVisibility(tabId) {
    const rarityNav = document.getElementById('rarity-nav');
    if (tabId === 'shop-tab') {
        rarityNav.classList.add('show');
    } else {
        rarityNav.classList.remove('show');
    }
}

// Original update balance function
function updateBalanceDisplay() {
    const balanceElement = document.getElementById('user-balance');
    if (balanceElement) {
        balanceElement.textContent = userBalance.toLocaleString();
    }
    
    // Also update balance in profile
    const profileBalanceElement = document.getElementById('profile-balance');
    if (profileBalanceElement) {
        profileBalanceElement.textContent = userBalance.toLocaleString();
    }
    
    // Also update the profile section if it exists
    updateProfileWalletDisplay();
}

// Register user in Supabase and get their balance
async function registerUserAndGetBalance() {
    try {
        if (!telegramId) {
            console.error('No Telegram ID available');
            tg.showAlert('Unable to identify user. Please restart the app.');
            return;
        }
        
        console.log('Attempting to register user with ID:', telegramId);
        
        // Call the revised add_user_with_balance function
        const { data: userData, error: userError } = await supabase.rpc('add_user_with_balance', {
            p_telegram_id: telegramId,
            p_username: userName || '',
            p_first_name: userFirstName || '',
            p_last_name: userLastName || ''
        });
        
        if (userError) {
            console.error('Error registering user:', userError);
            tg.showAlert('Error connecting to database (user registration). Please try again later.');
            return;
        }
        
        console.log('User registered (or updated) successfully, user ID:', userData);
        
        // Get user balance using the revised get_balance function
        const { data: balanceData, error: balanceError } = await supabase.rpc('get_balance', {
            p_telegram_id: telegramId
        });
        
        if (balanceError) {
            console.error('Error getting balance:', balanceError);
            // Don't stop the app, but log it. Default to 0.
            userBalance = 0;
        } else {
            userBalance = parseFloat(balanceData) || 0; // Ensure balance is a number
        }
        
        updateBalanceDisplay();
        console.log('User balance retrieved:', userBalance);

    } catch (err) {
        console.error('Error in registerUserAndGetBalance:', err);
        tg.showAlert('Error connecting to the service. Please try again later.');
    }
}

// Update user balance in Supabase
async function updateUserBalance(amount, description, type) {
    try {
        if (!telegramId) {
            console.error('No Telegram ID available');
            tg.showAlert('Unable to identify user. Please restart the app.');
            return false;
        }
        
        console.log('Updating balance:', { telegramId, amount, description, type });
        
        // Uses the revised update_balance which interacts with the 'balances' table
        const { data, error } = await supabase.rpc('update_balance', {
            p_telegram_id: telegramId,
            p_amount_change: parseFloat(amount), // Ensure amount is numeric
            p_description: description,
            p_transaction_type: type
        });
        
        if (error) {
            console.error('Error updating balance:', error);
            tg.showAlert('Error processing transaction. Please try again.');
            return false;
        }
        
        userBalance = parseFloat(data) || 0;
        updateBalanceDisplay();
        console.log('Balance updated successfully:', userBalance);
        return true;
    } catch (err) {
        console.error('Error in updateUserBalance:', err);
        tg.showAlert('Error processing transaction. Please try again.');
        return false;
    }
}

// Create floating particles
const particlesContainer = document.getElementById('particles');
const particleCount = 30;

for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    // Random position
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    
    // Random size
    const size = Math.random() * 4 + 1;
    
    // Random opacity
    const opacity = Math.random() * 0.5 + 0.1;
    
    // Random animation duration
    const duration = Math.random() * 20 + 10;
    
    // Random delay
    const delay = Math.random() * 10;
    
    particle.style.left = `${posX}%`;
    particle.style.top = `${posY}%`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.opacity = opacity;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;
    
    if (particlesContainer) {
        particlesContainer.appendChild(particle);
    }
}

// Function to update user data in the profile tab
async function updateUserData() {
    try {
        console.log('[UnboxdNFT] Updating user data in profile tab for telegramId:', telegramId);
        
        if (!telegramId) {
            console.error('[UnboxdNFT] No telegram ID available for updating user data');
            return;
        }
        
        // Set user avatar and username from tg.initDataUnsafe (this part is likely fine)
        const user = tg.initDataUnsafe?.user || {};
        userFirstName = user.first_name || 'User';
        userLastName = user.last_name || '';
        userName = user.username ? `@${user.username}` : '';
        userPhotoUrl = user.photo_url || 'https://picsum.photos/seed/profile/300';

        const profileAvatar = document.getElementById('profile-avatar');
        if (profileAvatar && userPhotoUrl) {
            profileAvatar.src = userPhotoUrl;
        }
        const headerAvatar = document.getElementById('user-avatar');
        if (headerAvatar && userPhotoUrl) {
            // Assuming avatar is a div with background image
            headerAvatar.innerHTML = `<img src="${userPhotoUrl}" style="width:100%; height:100%; object-fit:cover;">`; 
        } else if (headerAvatar) {
            headerAvatar.textContent = (userFirstName.charAt(0) || 'U').toUpperCase();
        }

        const profileUsername = document.getElementById('profile-username');
        if (profileUsername) {
            profileUsername.textContent = userName || userFirstName;
        }
        
        // Fetch balance using the RPC function
        console.log('[UnboxdNFT] Calling get_balance RPC for profile...');
        const { data: balanceData, error: balanceError } = await supabase.rpc('get_balance', {
            p_telegram_id: telegramId
        });

        if (balanceError) {
            console.error('[UnboxdNFT] Error getting balance for profile:', balanceError);
        } else {
            console.log('[UnboxdNFT] Balance data for profile:', balanceData);
            const currentBalance = parseFloat(balanceData) || 0;
            userBalance = currentBalance; // Update global balance variable
            const profileBalanceEl = document.getElementById('profile-balance');
            if (profileBalanceEl) profileBalanceEl.textContent = currentBalance.toLocaleString();
            
            // Also update header balance
            const headerBalanceEl = document.getElementById('user-balance');
            if (headerBalanceEl) headerBalanceEl.textContent = currentBalance.toLocaleString();
        }

        // Fetch user stats using the RPC function
        console.log('[UnboxdNFT] Calling get_user_stats RPC for profile...');
        const { data: statsDataArray, error: statsError } = await supabase.rpc('get_user_stats', {
            p_telegram_id: telegramId
        });

        if (statsError) {
            console.error('[UnboxdNFT] Error getting user stats for profile:', statsError);
        } else {
            console.log('[UnboxdNFT] Stats data array for profile:', statsDataArray);
            let userStats = null;
            if (statsDataArray && statsDataArray.length > 0) {
                userStats = statsDataArray[0];
            } else if (statsDataArray && !Array.isArray(statsDataArray)) { // Handle if RPC returns single object
                userStats = statsDataArray;
            } else {
                 console.warn('[UnboxdNFT] No stats data returned or unexpected format for profile.');
                 userStats = { nft_count: 0, cases_opened: 0, legendary_count: 0 }; // Default
            }
            
            console.log('[UnboxdNFT] Processed userStats for profile:', userStats);

            const profileNftsCount = document.getElementById('profile-nfts-count');
            if (profileNftsCount) profileNftsCount.textContent = userStats.nft_count || 0;
            
            const profileCasesOpened = document.getElementById('profile-cases-opened');
            if (profileCasesOpened) profileCasesOpened.textContent = userStats.cases_opened || 0;
            
            const profileLegendaryCount = document.getElementById('profile-legendary-count');
            if (profileLegendaryCount) profileLegendaryCount.textContent = userStats.legendary_count || 0;
        }
        
        console.log('[UnboxdNFT] updateUserData completed.');
    } catch (err) {
        console.error('[UnboxdNFT] Error in updateUserData:', err);
         alert('Error updating user profile. Please try again later.');
    }
}

// Load opening count from localStorage
function loadCaseOpeningData() {
    if (telegramId) {
        const savedData = localStorage.getItem(`caseOpeningData_${telegramId}`);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            caseOpeningsCount = parsedData.count || 0;
            guaranteedTier3NextOpening = parsedData.guaranteed || false;
            console.log(`Loaded case opening data: Count=${caseOpeningsCount}, Guaranteed=${guaranteedTier3NextOpening}`);
        }
    }
}

// Save opening count to localStorage
function saveCaseOpeningData() {
    if (telegramId) {
        const dataToSave = {
            count: caseOpeningsCount,
            guaranteed: guaranteedTier3NextOpening
        };
        localStorage.setItem(`caseOpeningData_${telegramId}`, JSON.stringify(dataToSave));
        console.log(`Saved case opening data: Count=${caseOpeningsCount}, Guaranteed=${guaranteedTier3NextOpening}`);
    }
}

// === DAILY REWARDS SYSTEM ===

// Constants for daily rewards
const REWARD_COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

// DOM elements
const dailyRewardBtn = document.getElementById('daily-reward-btn');
const dailyRewardReady = document.getElementById('daily-reward-ready');
const dailyRewardTimer = document.getElementById('daily-reward-timer');
const rewardCountdown = document.getElementById('reward-countdown');
const dailyRewardDialog = document.getElementById('daily-reward-dialog');
const dailyRewardDialogBtn = document.getElementById('daily-reward-dialog-btn');

// Initialize daily reward system
function initDailyRewards() {
    if (!telegramId) {
        console.error('No Telegram ID available for daily rewards');
        return;
    }
    console.log("Initializing daily rewards system...");
    checkRewardAvailability();
}

// Check reward availability from database
async function checkRewardAvailability() {
    try {
        // Call the database function to check availability
        const { data, error } = await supabase.rpc('check_reward_availability', {
            p_telegram_id: telegramId
        });
        
        if (error) {
            console.error('Error checking reward availability:', error);
            // Fallback to local storage if database call fails
            const rewardData = loadRewardData();
            updateRewardUI(rewardData);
            return;
        }
        
        console.log('Reward availability data:', data);
        
        // Convert database response to a format compatible with our UI
        const rewardData = {
            lastClaimed: data.last_claimed ? new Date(data.last_claimed).getTime() : 0,
            nextAvailable: new Date(data.next_available).getTime()
        };
        
        // Update the UI with the retrieved data
        updateRewardUI(rewardData);
        
        // Also update localStorage as a backup
        saveRewardData(rewardData);
    } catch (err) {
        console.error('Error in checkRewardAvailability:', err);
        // Fallback to localStorage if there's an error
        const rewardData = loadRewardData();
        updateRewardUI(rewardData);
    }
}

// Load reward data from localStorage (backup)
function loadRewardData() {
    const savedData = localStorage.getItem(`dailyReward_${telegramId}`);
    if (!savedData) {
        // First time user - reward is ready immediately
        return {
            lastClaimed: 0,
            nextAvailable: 0
        };
    }
    
    return JSON.parse(savedData);
}

// Save reward data to localStorage (backup)
function saveRewardData(data) {
    localStorage.setItem(`dailyReward_${telegramId}`, JSON.stringify(data));
}

// Update the UI based on reward availability
function updateRewardUI(rewardData) {
    const now = Date.now();
    const isRewardAvailable = now >= rewardData.nextAvailable;
    
    if (isRewardAvailable) {
        // Reward is available
        if (dailyRewardReady) dailyRewardReady.style.display = 'flex';
        if (dailyRewardTimer) dailyRewardTimer.style.display = 'none';
        if (dailyRewardBtn) {
            dailyRewardBtn.classList.remove('disabled');
            dailyRewardBtn.disabled = false;
        }
    } else {
        // Reward is on cooldown
        if (dailyRewardReady) dailyRewardReady.style.display = 'none';
        if (dailyRewardTimer) dailyRewardTimer.style.display = 'flex';
        if (dailyRewardBtn) {
            dailyRewardBtn.classList.add('disabled');
            dailyRewardBtn.disabled = true;
        }
        
        // Start countdown
        startCountdown(rewardData.nextAvailable);
    }
}

// Start countdown timer
function startCountdown(targetTime) {
    // Clear any existing interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    // Update immediately
    updateCountdown(targetTime);
    
    // Set interval for updates
    countdownInterval = setInterval(() => {
        const timeLeft = updateCountdown(targetTime);
        
        // If countdown reached zero, refresh the UI
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            checkRewardAvailability(); // Check from database instead of local
        }
    }, 1000);
}

// Update countdown display and return time left
function updateCountdown(targetTime) {
    const now = Date.now();
    const timeLeft = Math.max(0, targetTime - now);
    
    if (timeLeft > 0 && rewardCountdown) {
        // Format time remaining
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
        
        rewardCountdown.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (rewardCountdown) {
        rewardCountdown.textContent = '00:00:00';
    }
    
    return timeLeft;
}

// Claim daily reward
async function claimDailyReward() {
    try {
        console.log("Attempting to claim daily reward for telegramId:", telegramId);
        // Call the database function to claim reward
        const { data, error } = await supabase.rpc('claim_reward', {
            p_telegram_id: telegramId,
            p_amount: REWARD_AMOUNT // Uses the single global REWARD_AMOUNT
        });
        
        if (error) {
            console.error('Error claiming reward:', error);
            showToast('Failed to claim your reward. Please try again.');
            return;
        }
        
        if (!data.success) {
            console.log('Reward not available:', data.message);
            showToast(data.message); // Show the message from the server (e.g., "Reward already claimed")
            // Ensure UI reflects the cooldown state if claim was denied due to cooldown
            checkRewardAvailability(); // Re-check to update UI based on server state
            return;
        }
        
        console.log('Reward claimed successfully:', data);
        
        // The 'claim_reward' SQL function returns a JSONB object that includes 'balance'
        if (typeof data.balance !== 'undefined') {
            userBalance = parseFloat(data.balance); 
        } else {
            // Fallback if balance is not directly in response, though SQL should provide it.
            await getUserBalance(); // This will also update display
        }
        updateBalanceDisplay(); // Ensure display is updated with the new balance
        
        const rewardData = {
            lastClaimed: new Date().getTime(), // Use current time for lastClaimed
            nextAvailable: new Date(data.next_available).getTime()
        };
        updateRewardUI(rewardData);
        saveRewardData(rewardData); // Save to localStorage
        
        // Show success dialog
        if (dailyRewardDialog) dailyRewardDialog.classList.add('active');
        
        // Add to activity log using the unified addActivity function
        addActivity('daily_reward', { amount: REWARD_AMOUNT });
        
    } catch (err) {
        console.error('Error in claimDailyReward:', err);
        showToast('An error occurred. Please try again.');
    }
}

// Unified Activity Log System (MAX_ACTIVITIES and MAX_STORED_ACTIVITIES are global)
function addActivity(type, data) {
    console.log('[Activity] Adding activity:', type, data);
    if (!telegramId) {
        console.warn('[Activity] No telegramId, cannot save activity.');
        return;
    }
    
    const activityKey = `unboxd_activityLog_${telegramId}`;
    let activities = [];
    try {
        activities = JSON.parse(localStorage.getItem(activityKey) || '[]');
    } catch (e) {
        console.error('[Activity] Error parsing stored activities:', e);
        activities = []; // Reset if parsing fails
    }

    let text;
    let iconClass;

    switch(type) {
        case 'case_open':
            iconClass = 'fas fa-box-open';
            text = `Opened ${data.caseName} and got ${data.skinName}`;
            break;
        case 'sale':
            iconClass = 'fas fa-coins';
            text = `Sold ${data.skinName} for ${data.price} UCoins`;
            break;
        case 'daily_reward':
            iconClass = 'fas fa-gift';
            text = `Claimed daily reward: ${data.amount} UCoins`;
            break;
        case 'purchase': // Example, if you add purchases later
            iconClass = 'fas fa-shopping-cart';
            text = `Purchased ${data.itemName} for ${data.price} UCoins`;
            break;
        default:
            iconClass = 'fas fa-info-circle';
            text = data.text || 'Activity recorded';
    }
    
    activities.unshift({
        type,
        text, // Store the processed text
        iconClass, // Store the icon class
        timestamp: new Date().toISOString()
    });
    
    // Keep only the last MAX_STORED_ACTIVITIES
    if (activities.length > MAX_STORED_ACTIVITIES) {
        activities = activities.slice(0, MAX_STORED_ACTIVITIES);
    }
    
    localStorage.setItem(activityKey, JSON.stringify(activities));
    updateActivityLog(); // Refresh UI
}

function updateActivityLog() {
    console.log('[Activity] Updating activity log UI');
    const activityList = document.getElementById('activity-list');
    if (!activityList) {
        console.error('[Activity] activity-list element not found in DOM');
        return;
    }
    
    activityList.innerHTML = ''; // Clear existing activities
    
    if (!telegramId) {
        console.warn('[Activity] No telegramId, cannot load activities for UI.');
        // Show empty message (optional, or could show generic loading/error)
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-activity-message';
        emptyMessage.innerHTML = `<i class="fas fa-history"></i><p>Activity will appear here once you log in.</p>`;
        activityList.appendChild(emptyMessage);
        return;
    }

    const activityKey = `unboxd_activityLog_${telegramId}`;
    let activities = [];
    try {
        activities = JSON.parse(localStorage.getItem(activityKey) || '[]');
    } catch (e) {
        console.error('[Activity] Error parsing stored activities for UI:', e);
    }
    
    if (activities.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-activity-message';
        emptyMessage.innerHTML = `<i class="fas fa-history"></i><p>Your recent activity will appear here</p>`;
        activityList.appendChild(emptyMessage);
        return;
    }
    
    const recentActivities = activities.slice(0, MAX_ACTIVITIES);
    
    recentActivities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const timestamp = new Date(activity.timestamp);
        // Use toLocaleString for a more user-friendly date/time format
        const timeString = timestamp.toLocaleString(undefined, { hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'short' });

        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="${activity.iconClass || 'fas fa-history'}"></i>
            </div>
            <div class="activity-details">
                <div class="activity-title">${activity.text}</div>
                <div class="activity-time">${timeString}</div>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

// Function to get user balance from database
async function getUserBalance() {
    try {
        console.log('Getting user balance');
        
        if (!telegramId) {
            console.error('No telegram ID available for getting user balance');
            return 0;
        }
        
        // Uses the revised get_balance function
        const { data, error } = await supabase.rpc('get_balance', {
            p_telegram_id: telegramId
        });
        
        if (error) {
            console.error('Error getting user balance:', error);
            return 0;
        }
        
        const newBalance = parseFloat(data) || 0;
        userBalance = newBalance; // Update global variable
        updateBalanceDisplay(); // Update all UI elements
        
        console.log('Current balance from getUserBalance:', newBalance);
        return newBalance;
    } catch (err) {
        console.error('Error in getUserBalance:', err);
        return 0;
    }
}

// Function to update a user stat
async function updateUserStat(statName, increment) {
    try {
        console.log(`Updating user stat: ${statName} by ${increment} (Note: review if this JS function is still needed or if SQL handles it)`);
        
        if (!telegramId) {
            console.error('No telegram ID available for updating user stat');
            return false;
        }

        // For now, we assume SQL functions for adding/removing skins handle stat updates.
        // We will rely on getUserStats() to refresh the profile display.
        console.warn('updateUserStat in JS is not calling an RPC. Stat updates are expected via SQL functions like add_skin_to_inventory.');
        await getUserStats(); // Refresh stats after an action that might change them
        return true; 
    } catch (err) {
        console.error(`Error in updateUserStat (${statName}):`, err);
        return false;
    }
}

// Function to get user stats from database
async function getUserStats() {
    try {
        console.log('Getting user stats');
        
        if (!telegramId) {
            console.error('No telegram ID available for getting user stats');
            return null;
        }
        
        // Calls the revised get_user_stats, which reads from the user_stats table
        const { data, error } = await supabase.rpc('get_user_stats', {
            p_telegram_id: telegramId
        });
        
        if (error) {
            console.error('Error getting user stats:', error);
            return null;
        }
        
        console.log('User stats retrieved (raw data from RPC):', data);
        
        // The get_user_stats function is defined to RETURN TABLE, so data should be an array of objects.
        // If it returns a single object or an empty array if no stats, adjust accordingly.
        let userStatsData = null;
        if (data && data.length > 0) {
            userStatsData = data[0]; // Expecting a single row for the user
        } else if (data && !Array.isArray(data)) {
            userStatsData = data; // If RPC returns a single object directly
        }

        if (!userStatsData) {
            console.warn('No stats data returned for user or data is in unexpected format.');
            userStatsData = { nft_count: 0, cases_opened: 0, legendary_count: 0 }; // Default if no data
        }

        // Update UI with the stats
        const profileNftsCount = document.getElementById('profile-nfts-count');
        if (profileNftsCount) {
            profileNftsCount.textContent = userStatsData.nft_count || 0;
        }
        
        const profileCasesOpened = document.getElementById('profile-cases-opened');
        if (profileCasesOpened) {
            profileCasesOpened.textContent = userStatsData.cases_opened || 0;
        }
        
        const profileLegendaryCount = document.getElementById('profile-legendary-count');
        if (profileLegendaryCount) {
            profileLegendaryCount.textContent = userStatsData.legendary_count || 0;
        }
        
        return userStatsData;
    } catch (err) {
        console.error('Error in getUserStats:', err);
        return null;
    }
}

// Function to get user inventory from database
async function getUserInventory() {
    try {
        console.log('[Inventory] getUserInventory called');
        
        if (!telegramId) {
            console.error('[Inventory] No Telegram ID available, attempting to get from initDataUnsafe');
            if (tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) {
                telegramId = tg.initDataUnsafe.user.id;
                console.log('[Inventory] Successfully retrieved telegram ID during inventory fetch:', telegramId);
            } else {
                console.error('[Inventory] Critical: Could not retrieve telegram ID from initDataUnsafe for inventory.');
                showEmptyInventory("Unable to identify user for inventory.");
                return;
            }
        }
        
        console.log('[Inventory] Using telegram ID for fetch:', telegramId);
        
        const userCollection = document.getElementById('user-collection');
        if (!userCollection) {
            console.error('[Inventory] user-collection element not found in DOM');
            return;
        }
        
        console.log('[Inventory] Clearing existing inventory display');
        userCollection.innerHTML = ''; // Clear before loading
        
        // Show loading indicator
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'loading-message'; // You can style this class
        loadingMessage.style.width = '100%';
        loadingMessage.style.textAlign = 'center';
        loadingMessage.style.padding = '30px';
        loadingMessage.style.color = 'rgba(255,255,255,0.7)';
        loadingMessage.innerHTML = `
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; margin-bottom: 15px;"></i>
            <p>Loading your collection...</p>
        `;
        userCollection.appendChild(loadingMessage);
        
        console.log('[Inventory] Fetching inventory from Supabase for telegram_id:', telegramId);
        const { data: inventoryData, error: inventoryError } = await supabase.rpc('get_user_inventory', {
            p_telegram_id: telegramId
        });
        
        // Clear loading indicator
        if (userCollection.contains(loadingMessage)) {
            userCollection.removeChild(loadingMessage);
        }
        
        if (inventoryError) {
            console.error('[Inventory] Error getting user inventory:', JSON.stringify(inventoryError));
            showInventoryError(`Database error: ${inventoryError.message}`);
            return;
        }
        
        console.log('[Inventory] Raw inventory data received:', JSON.stringify(inventoryData));
        
        if (!inventoryData || inventoryData.length === 0) {
            console.log('[Inventory] Inventory is empty according to data, showing empty message.');
            showEmptyInventory();
            return;
        }
        
        console.log(`[Inventory] Creating cards for ${inventoryData.length} inventory items.`);
        
        inventoryData.forEach((item, index) => {
            try {
                console.log(`[Inventory] Processing item ${index + 1}:`, JSON.stringify(item));
                if (!item || typeof item.skin_name === 'undefined') {
                    console.warn(`[Inventory] Skipping invalid item at index ${index}:`, item);
                    return; // Skip this item
                }

                const card = document.createElement('div');
                card.className = 'nft-card';
                card.dataset.uniqueId = item.unique_id;
                
                let rarityClass = 'common';
                let tier = parseInt(item.skin_tier, 10);
                switch(tier) {
                    case 1: rarityClass = 'common'; break;
                    case 2: rarityClass = 'rare'; break;
                    case 3: rarityClass = 'epic'; break;
                    case 4: rarityClass = 'legendary'; break;
                    case 5: rarityClass = 'mythic'; break;
                    case 6: rarityClass = 'divine'; break;
                }
                
                const rarityBadge = document.createElement('span');
                rarityBadge.className = `rarity-badge rarity-${rarityClass}`;
                rarityBadge.textContent = rarityClass.toUpperCase();
                card.appendChild(rarityBadge);
                
                // Check if the image is a Lottie animation (JSON file)
                if (item.skin_image && item.skin_image.includes('.json')) {
                    // Create Lottie player for animations
                    const lottiePlayer = document.createElement('lottie-player');
                    lottiePlayer.setAttribute('src', item.skin_image);
                    lottiePlayer.setAttribute('background', 'transparent');
                    lottiePlayer.setAttribute('speed', '1');
                    lottiePlayer.style.width = '150px';
                    lottiePlayer.style.height = '150px';
                    lottiePlayer.className = 'nft-image';
                    lottiePlayer.setAttribute('loop', '');
                    lottiePlayer.setAttribute('autoplay', '');
                    card.appendChild(lottiePlayer);
                } else {
                    // Create regular image for static NFTs
                    const img = document.createElement('img');
                    img.src = item.skin_image || 'placeholder.png'; // Fallback image
                    img.alt = item.skin_name;
                    img.className = 'nft-image';
                    img.onerror = function() {
                        this.src = "https://via.placeholder.com/150?text=NFT"; // More specific placeholder
                        console.error(`[Inventory] Failed to load image for ${item.skin_name}: ${item.skin_image}`);
                    };
                    card.appendChild(img);
                }
                
                const info = document.createElement('div');
                info.className = 'nft-info';
                
                const title = document.createElement('div');
                title.className = `nft-title tier-${tier}`;
                title.textContent = item.skin_name;
                info.appendChild(title);
                
                const date = document.createElement('div');
                date.style.fontSize = '0.7rem';
                date.style.color = 'rgba(255,255,255,0.5)';
                date.textContent = `Acquired: ${new Date(item.acquired_date).toLocaleDateString()}`;
                info.appendChild(date);
                
                const sellPrice = skinPrices[tier] || 0;
                const sellBtn = document.createElement('button');
                sellBtn.className = 'inventory-sell-btn';
                sellBtn.innerHTML = `<i class="fas fa-coins"></i> Sell for <img src="ucoin2.png" alt="UCoin" style="width: 14px; height: 14px; margin: 0 3px;"> ${sellPrice}`;
                sellBtn.onclick = async () => {
                    await sellNFT(item.skin_name, tier, item.unique_id);
                };
                info.appendChild(sellBtn);
                card.appendChild(info);
                userCollection.appendChild(card);
            } catch (cardErr) {
                console.error(`[Inventory] Error creating card for item at index ${index}:`, cardErr, "Item data:", JSON.stringify(item));
            }
        });
        
        console.log('[Inventory] User inventory loaded successfully:', inventoryData.length, 'items rendered.');
    } catch (err) {
        console.error('[Inventory] General error in getUserInventory:', err);
        showInventoryError("An unexpected error occurred while loading your inventory.");
    }
}

// Helper function to show empty inventory state
function showEmptyInventory(message = "Your collection is empty. Open some cases to get Labubu skins!") {
    const userCollection = document.getElementById('user-collection');
    if (!userCollection) {
        console.error('user-collection element not found in DOM');
        return;
    }
    
    userCollection.innerHTML = '';
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-collection-message';
    emptyMessage.style.width = '100%';
    emptyMessage.style.textAlign = 'center';
    emptyMessage.style.padding = '30px';
    emptyMessage.style.color = 'rgba(255,255,255,0.7)';
    
    emptyMessage.innerHTML = `
        <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
        <p>${message}</p>
    `;
    
    userCollection.appendChild(emptyMessage);
}

// Helper function to show inventory error state
function showInventoryError(message = "Error loading your collection. Please try again later.") {
    const userCollection = document.getElementById('user-collection');
    if (!userCollection) {
        console.error('user-collection element not found in DOM');
        return;
    }
    
    userCollection.innerHTML = '';
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.style.width = '100%';
    errorMessage.style.textAlign = 'center';
    errorMessage.style.padding = '30px';
    errorMessage.style.color = 'rgba(255,0,0,0.7)';
    errorMessage.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px;"></i>
        <p>${message}</p>
    `;
    userCollection.appendChild(errorMessage);
}

// Function to sell an NFT
async function sellNFT(skinName, skinTier, uniqueId) {
    try {
        if (!telegramId) {
            alert('Error: You must be logged in to sell NFTs');
            return false;
        }
        
        console.log('Selling NFT:', skinName, 'with unique ID:', uniqueId);
        
        // Confirmation dialog
        if (!confirm(`Are you sure you want to sell ${skinName}?`)) {
            return false;
        }
        
        // Get NFT price based on tier
        const nftPrice = skinPrices[skinTier];
        if (!nftPrice) {
            alert('Error: Could not determine NFT price');
            return false;
        }
        
        // First add the coins to the user's balance
        const { data: updateData, error: updateError } = await supabase.rpc('add_coins_to_user', {
            p_telegram_id: telegramId,
            p_amount: nftPrice
        });
        
        if (updateError) {
            console.error('Error adding coins:', updateError);
            alert('Error adding coins to your balance');
            return false;
        }
        
        // Then remove the NFT from the user's inventory using the unique ID
        const { data: removeData, error: removeError } = await supabase.rpc('remove_skin_from_inventory', {
            p_telegram_id: telegramId,
            p_unique_id: uniqueId
        });
        
        if (removeError) {
            console.error('Error removing skin:', removeError);
            alert('Error removing skin from your inventory');
            
            // If this fails, we should rollback the coin addition, but that's more complex
            // For simplicity, we'll just show an error
            return false;
        }
        
        if (!removeData) {
            console.error('Failed to remove skin, no error returned');
            alert('Failed to remove skin from your inventory');
            return false;
        }
        
        // Update balance display
        await getUserBalance();
        
        // Add to activity log
        addActivity('sale', {
            skinName: skinName,
            skinTier: skinTier,
            price: nftPrice
        });
        
        // Refresh inventory
        await getUserInventory();
        
        // Show success message
        alert(`Successfully sold ${skinName} for ${nftPrice} UCoins`);
        
        return true;
    } catch (err) {
        console.error('Error in sellNFT:', err);
        alert('An error occurred while selling your NFT');
        return false;
    }
}

// Create a proper state manager
const RouletteStateManager = {
    currentResultSkin: null,
    isAnimating: false,
    transitionListenerActive: false,
    
    setCurrentResult(skin) {
        this.currentResultSkin = skin;
        console.log('Set currentResultSkin:', skin);
    },
    
    clearCurrentResult() {
        this.currentResultSkin = null;
        console.log('Cleared currentResultSkin');
    },
    
    setAnimating(state) {
        this.isAnimating = state;
    },
    
    setTransitionListenerActive(state) {
        this.transitionListenerActive = state;
    },
    
    cleanupEventListeners() {
        const rouletteTrack = document.getElementById('roulette-track');
        if (rouletteTrack && this.transitionListenerActive) {
            // Clone the node to remove all event listeners
            const newTrack = rouletteTrack.cloneNode(true);
            rouletteTrack.parentNode.replaceChild(newTrack, rouletteTrack);
            this.transitionListenerActive = false;
            console.log('Event listeners cleaned up by RouletteStateManager');
        }
        
        // Kill any active GSAP animations on the rouletteTrack
        // Ensure rouletteTrack exists before trying to kill animations on it
        if (rouletteTrack && typeof gsap !== 'undefined' && gsap.isTweening(rouletteTrack)) {
            gsap.killTweensOf(rouletteTrack);
            console.log('GSAP animations on rouletteTrack killed by RouletteStateManager');
        }
    }
};

// Enhanced Dark Aura Case Implementation - Global Variables and Preloading System
let preloadedLottieAnimations = new Map();
let reusableLottiePlayer = null;
let isPreloadingLottie = false;

// Enhanced Lottie preloading system for better performance
async function preloadLottieAnimations() {
    if (isPreloadingLottie) {
        console.log('[Lottie Preload] Preloading already in progress, skipping...');
        return;
    }
    
    isPreloadingLottie = true;
    console.log('[Lottie Preload] Starting to preload Dark Aura animations...');
    
    const preloadPromises = darkAuraSkins.map(async (skin) => {
        if (skin.type === 'lottie' && !preloadedLottieAnimations.has(skin.image)) {
            try {
                const response = await fetch(skin.image);
                if (response.ok) {
                    const animationData = await response.json();
                    preloadedLottieAnimations.set(skin.image, animationData);
                    console.log(`[Lottie Preload] ✅ Preloaded: ${skin.name}`);
                    return { success: true, skin: skin.name };
                } else {
                    console.warn(`[Lottie Preload] ⚠️ Failed to preload: ${skin.name} (${response.status})`);
                    return { success: false, skin: skin.name, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                console.error(`[Lottie Preload] ❌ Error preloading ${skin.name}:`, error);
                return { success: false, skin: skin.name, error: error.message };
            }
        }
        return { success: true, skin: skin.name, cached: true };
    });

    try {
        const results = await Promise.all(preloadPromises);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(`[Lottie Preload] Completed: ${successful} successful, ${failed} failed`);
        
        if (failed > 0) {
            console.warn('[Lottie Preload] Some animations failed to preload. They will be loaded on-demand.');
        }
    } catch (error) {
        console.error('[Lottie Preload] Critical error during preloading:', error);
    } finally {
        isPreloadingLottie = false;
    }
}

// Initialize and manage reusable Lottie player for better performance
function initializeReusableLottiePlayer() {
    if (!reusableLottiePlayer) {
        reusableLottiePlayer = document.createElement('lottie-player');
        reusableLottiePlayer.style.width = '150px';
        reusableLottiePlayer.style.height = '150px';
        reusableLottiePlayer.autoplay = true;
        reusableLottiePlayer.loop = true;
        reusableLottiePlayer.controls = false;
        
        // Add comprehensive error handling
        reusableLottiePlayer.addEventListener('error', (e) => {
            console.error('[Lottie Player] Error loading animation:', e);
            handleLottieError(e);
        });
        
        reusableLottiePlayer.addEventListener('ready', () => {
            console.log('[Lottie Player] Animation loaded and ready');
        });
        
        console.log('[Lottie Player] Reusable player initialized');
    }
    return reusableLottiePlayer;
}

// Enhanced error handling for Lottie animations with fallback
function handleLottieError(error) {
    console.error('[Lottie Error Handler] Animation error detected:', error);
    
    // Fallback: show placeholder SVG when animation fails
    const resultImage = document.getElementById('result-image');
    const resultName = document.getElementById('result-name');
    
    if (resultImage && resultName) {
        resultImage.style.display = 'block';
        // Create a simple fallback SVG
        resultImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNDA0MDQwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFuaW1hdGlvbiBFcnJvcjwvdGV4dD48L3N2Zz4=';
        resultName.textContent = `${currentResultSkin?.name || 'Unknown Item'} (Animation Error)`;
        
        // Show error notification to user
        if (typeof showToast === 'function') {
            showToast('Animation loading failed. Showing static result.', 'warning');
        }
    }
}

// Open Labubu Case function
async function openLabubuCase() {
    console.log('Opening Labubu case...');
    const CASE_PRICE = 100;
    
    // Check if user has enough balance
    if (userBalance < CASE_PRICE) {
        const notEnoughDialog = document.getElementById('not-enough-balance-dialog');
        if (notEnoughDialog) {
            notEnoughDialog.classList.add('active');
        }
        return;
    }
    
    try {
        // Deduct balance first
        await updateUserBalance(-CASE_PRICE, 'Opened Labubu Case', 'case_opening');
        
        // Start the enhanced roulette animation
        await startEnhancedLabubuRouletteAnimation();
        
    } catch (error) {
        console.error('Error opening Labubu case:', error);
        alert('Failed to open case. Please try again.');
    }
}

// Open Dark Aura Case function  
async function openDarkAuraCase() {
    console.log('=== STARTING DARK AURA CASE OPENING ===');
    const telegramIdForCase = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || telegramId;
    console.log('User balance before check:', userBalance, 'TG ID:', telegramIdForCase);
    const CASE_PRICE = 3000;
    
    // Check if user has enough balance
    if (userBalance < CASE_PRICE) {
        console.log('Not enough balance, showing dialog');
        showToast('Not enough UCoins to open this case.');
        return;
    }

    try {
        console.log('Balance check passed, attempting to start roulette animation...');
        
        // Start the enhanced Dark Aura roulette animation and wait for it to complete
        const wonItem = await startEnhancedDarkAuraRouletteAnimation();
        console.log('Animation successful, item won:', wonItem);

        // If animation was successful and wonItem is valid, then deduct balance
        console.log('Attempting to deduct balance...');
        const balanceDeducted = await updateUserBalance(-CASE_PRICE, `Opened Dark Aura Case - Won: ${wonItem.name}`, 'case_opening');
        
        if (balanceDeducted) {
            console.log('Balance deducted successfully.');
            // Balance deducted, item won. Now add to inventory and update stats.
            await updateUserStat('cases_opened', 1); 
            console.log('Dark Aura Case opened successfully, item:', wonItem.name);
        } else {
            console.error('Failed to deduct balance after successful animation.');
            showToast('Could not process payment after case opening. Please contact support.');
            // Potentially, remove the item from being displayed as won if payment failed post-animation
            const resultSection = document.getElementById('roulette-result');
            if (resultSection) resultSection.classList.remove('active'); 
        }
        
    } catch (error) {
        // This catch block handles errors from startEnhancedDarkAuraRouletteAnimation (e.g., animation failing)
        console.error('Error during Dark Aura case opening process:', error);
        showToast(`Failed to open case: ${error.message || 'Please try again.'}`);
    }
}

// Helper function to select item by probability
function selectRandomItemByProbability(items) {
    let totalProbability = 0;
    for (let item of items) {
        totalProbability += item.probability;
    }
    
    let random = Math.random() * totalProbability;
    
    for (let item of items) {
        random -= item.probability;
        if (random <= 0) {
            return item;
        }
    }
    
    // Fallback to first item
    return items[0];
}

// Enhanced Dark Aura roulette animation with Lottie support
async function startEnhancedDarkAuraRouletteAnimation() {
    return new Promise(async (resolve, reject) => {
        console.log('=== STARTING ENHANCED DARK AURA ROULETTE ===');
        
        // Dark Aura case items with their properties
        const darkAuraItems = [
            { name: 'Haunted Desk Calendar', tier: 1, price: 20, lottie: 'cleaned-deskcalendar-280571.json', probability: 40 },
            { name: 'Mad Pumpkin Spirit', tier: 2, price: 50, lottie: 'cleaned-madpumpkin-7551.json', probability: 25 },
            { name: 'Electric Skull', tier: 3, price: 120, lottie: 'cleaned-electricskull-8221.json', probability: 15 },
            { name: 'Cursed Voodoo Doll', tier: 4, price: 300, lottie: 'cleaned-voodoodoll-7970.json', probability: 10 },
            { name: 'Bewitched Ginger Cookie', tier: 4, price: 300, lottie: 'cleaned-gingercookie-20477.json', probability: 7 },
            { name: 'Mystical Signet Ring', tier: 5, price: 750, lottie: 'cleaned-signetring-14328.json', probability: 2 },
            { name: 'Mini Oscar Phantom', tier: 6, price: 10000, lottie: 'cleaned-minioscar-1983.json', probability: 0.8 },
            { name: 'Scared Cat Obelisk', tier: 6, price: 10000, lottie: 'cleaned-scaredcat-18595.json', probability: 0.2 }
        ];
        
        // Select a random item based on probability
        const wonItem = selectRandomItemByProbability(darkAuraItems);
        console.log('Dark Aura case won item:', wonItem);
        
        const rouletteOverlay = document.getElementById('roulette-overlay');
        const rouletteTrack = document.getElementById('roulette-track');
        const resultSection = document.getElementById('roulette-result');
        
        if (rouletteOverlay && rouletteTrack) {
            console.log('All DOM elements found, proceeding with roulette...');
            
            rouletteOverlay.style.display = 'none';
            rouletteOverlay.classList.remove('active');
            
            const header = rouletteOverlay.querySelector('.roulette-header h2');
            if (header) header.textContent = 'Opening Dark Aura Case';
            
            if (resultSection) {
                resultSection.style.display = 'none';
                resultSection.classList.remove('active');
            }
            
            // Pass wonItem to createRouletteTrack, so it knows what the winning item is
            createRouletteTrack(darkAuraItems, wonItem); 
            
            rouletteOverlay.style.display = 'flex';
            rouletteOverlay.classList.add('active');
            console.log('Roulette overlay should now be visible');
            
            rouletteOverlay.style.opacity = '1';
            rouletteOverlay.style.pointerEvents = 'auto';
            
            // Wrap the call to animateRouletteTrack in requestAnimationFrame
            requestAnimationFrame(async () => {
                try {
                    console.log('Inside requestAnimationFrame, attempting to animate roulette track...');
                    const animatedWonItem = await animateRouletteTrack(); 
                    console.log('animateRouletteTrack completed, won item:', animatedWonItem);
                    if (animatedWonItem && animatedWonItem.name === wonItem.name) {
                       resolve(wonItem);
                    } else {
                        console.error('Mismatch between selected item and animated item, or animation failed to return item.');
                        reject(new Error('Animation result mismatch.'));
                    }
                } catch (error) {
                    console.error('animateRouletteTrack failed inside requestAnimationFrame:', error);
                    reject(error); 
                }
            });
        } else {
            console.error('Roulette overlay or track not found:', {
                rouletteOverlay: !!rouletteOverlay,
                rouletteTrack: !!rouletteTrack
            });
            reject(new Error('Roulette overlay or track not found.'));
        }
    });
}

// Enhanced Labubu roulette animation with proper roulette mechanics
async function startEnhancedLabubuRouletteAnimation() {
    console.log('=== STARTING ENHANCED LABUBU ROULETTE ===');
    
    // Labubu case items with their properties and probabilities
    const labubuItems = [
        { name: 'Skeleton Labubu', tier: 1, price: 20, image: 'SkeletonLabubu.png', probability: 35 },
        { name: 'Candy Labubu', tier: 2, price: 50, image: 'CandyLabubu.png', probability: 25 },
        { name: 'Zombie Labubu', tier: 2, price: 50, image: 'ZombieLabubu.png', probability: 20 },
        { name: 'Vampire Labubu', tier: 3, price: 120, image: 'VampireLabubu.png', probability: 10 },
        { name: 'Ghost Labubu', tier: 3, price: 120, image: 'GhostLabubu.png', probability: 5 },
        { name: 'Demon Labubu', tier: 4, price: 300, image: 'DemonLabubu.png', probability: 3 },
        { name: 'Angel Labubu', tier: 5, price: 750, image: 'AngelLabubu.png', probability: 1.5 },
        { name: 'Golden Labubu', tier: 6, price: 5000, image: 'GoldenLabubu.png', probability: 0.5 }
    ];
    
    // Select a random item based on probability
    const wonItem = selectRandomItemByProbability(labubuItems);
    console.log('Labubu case won item:', wonItem);
    
    // Show roulette overlay
    const rouletteOverlay = document.getElementById('roulette-overlay');
    const rouletteTrack = document.getElementById('roulette-track');
    const resultSection = document.getElementById('roulette-result');
    
    if (rouletteOverlay && rouletteTrack) {
        console.log('All DOM elements found, proceeding with Labubu roulette...');
        
        // Ensure overlay starts hidden
        rouletteOverlay.style.display = 'none';
        rouletteOverlay.classList.remove('active');
        
        // Update header for Labubu
        const header = rouletteOverlay.querySelector('.roulette-header h2');
        if (header) {
            header.textContent = 'Opening Labubu Case';
            console.log('Header updated for Labubu');
        }
        
        // Hide result section initially
        if (resultSection) {
            resultSection.style.display = 'none';
            resultSection.classList.remove('active');
            console.log('Result section hidden');
        }
        
        // Create roulette track with Labubu items
        console.log('Creating Labubu roulette track...');
        createLabubuRouletteTrack(labubuItems, wonItem);
        
        // Show overlay immediately, then on next frame start spin
        rouletteOverlay.style.display = 'flex';
        rouletteOverlay.classList.add('active');
        console.log('Labubu roulette overlay should now be visible');
        
        // Force immediate visibility
        rouletteOverlay.style.opacity = '1';
        rouletteOverlay.style.pointerEvents = 'auto';
        console.log('Forced Labubu roulette visibility');
        
        requestAnimationFrame(async () => {
            console.log('Starting Labubu roulette track animation...');
            await animateLabubuRouletteTrack(wonItem);
        });
    } else {
        console.error('Roulette overlay or track not found for Labubu:', {
            rouletteOverlay: !!rouletteOverlay,
            rouletteTrack: !!rouletteTrack
        });
    }
}

// Toast notification function
function showToast(message, type = 'info') {
    console.log(`[Toast ${type.toUpperCase()}]: ${message}`);
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Style the toast
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 24px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '14px',
        zIndex: '10000',
        maxWidth: '300px',
        wordWrap: 'break-word',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease',
        transform: 'translateX(100%)',
        opacity: '0'
    });
    
    // Set color based on type
    switch(type) {
        case 'success':
            toast.style.background = 'linear-gradient(135deg, #00b894, #00cec9)';
            break;
        case 'error':
            toast.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
            break;
        case 'warning':
            toast.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
            break;
        default:
            toast.style.background = 'linear-gradient(135deg, #6c5ce7, #5f3dc4)';
    }
    
    // Add to document
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Generate proper UUID v4 format for database compatibility
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Placeholder functions for roulette creation and animation (these would be very large)
// These need to be implemented based on the original code

function createRouletteTrack(items, wonItem) {
    console.log('Creating roulette track - placeholder implementation');
    // This function would create the visual roulette track with items
    // Implementation would be based on the original enhanced roulette code
}

function animateRouletteTrack() {
    return new Promise((resolve) => {
        console.log('Animating roulette track - placeholder implementation');
        // This function would animate the roulette track
        // Implementation would use GSAP animations
        setTimeout(() => {
            resolve({ name: 'Test Item', tier: 1 });
        }, 3000);
    });
}

function createLabubuRouletteTrack(items, wonItem) {
    console.log('Creating Labubu roulette track - placeholder implementation');
    // Implementation for Labubu-specific roulette track
}

function animateLabubuRouletteTrack(wonItem) {
    return new Promise((resolve) => {
        console.log('Animating Labubu roulette track - placeholder implementation');
        // Implementation for Labubu-specific roulette animation
        setTimeout(() => {
            resolve();
        }, 3000);
    });
}

// Show roulette result with Lottie or image support
async function showRouletteResult(wonItem, isLottie = false) {
    console.log('=== SHOWING ROULETTE RESULT ===');
    console.log('Won item:', wonItem);
    
    const resultSection = document.getElementById('roulette-result');
    const resultImage = document.getElementById('result-image');
    const resultImageContainer = resultSection?.querySelector('.roulette-result-image');
    const resultName = document.getElementById('result-name');
    const sellPrice = document.getElementById('sell-price');
    
    if (resultSection && resultImage && resultImageContainer && resultName && sellPrice) {
        // Store won item globally for selling functionality FIRST
        currentResultSkin = {
            name: wonItem.name,
            tier: wonItem.tier,
            price: wonItem.price,
            lottie: wonItem.lottie,
            unique_id: generateUUID()
        };
        
        console.log('Set currentResultSkin with UUID:', currentResultSkin);
        
        if (isLottie && wonItem.lottie) {
            console.log('🎬 Creating fresh Lottie player for:', wonItem.lottie);
            
            // Hide the regular image element
            resultImage.style.display = 'none';
            
            // Create fresh Lottie container every time
            const lottieContainer = document.createElement('div');
            lottieContainer.className = 'roulette-result-lottie';
            lottieContainer.innerHTML = `
                <lottie-player
                    src="${wonItem.lottie}"
                    background="transparent"
                    speed="1"
                    style="width: 130px; height: 130px"
                    loop
                    autoplay>
                </lottie-player>
            `;
            
            resultImageContainer.appendChild(lottieContainer);
            console.log('✅ Fresh Lottie container created and added to image container');
            
        } else {
            // For Labubu regular images or non-Lottie items
            console.log('🖼️ Displaying regular image for:', wonItem.name);
            resultImage.src = wonItem.image || '';
            resultImage.style.display = 'block';
        }
        
        resultName.textContent = wonItem.name;
        resultName.className = `skin-name tier-${wonItem.tier}`;
        sellPrice.textContent = wonItem.price;
        
        // Add to user inventory
        try {
            await addItemToInventory(wonItem);
            console.log('Item added to inventory successfully');
        } catch (error) {
            console.error('Error adding item to inventory:', error);
        }
        
        // Show result with proper animation
        resultSection.style.display = 'block';
        setTimeout(() => {
            resultSection.classList.add('active');
            console.log('Result section shown and activated');
        }, 100);
    } else {
        console.error('Roulette result elements not found');
    }
}

// Add item to user inventory
async function addItemToInventory(item) {
    console.log('=== ADDING ITEM TO INVENTORY ===');
    console.log('Item to add:', item);
    console.log('Telegram ID:', telegramId);
    
    if (!telegramId) {
        console.error('No Telegram ID available for inventory update');
        showToast('User not authenticated!', 'error');
        return;
    }
    
    try {
        const rpcParams = {
            p_telegram_id: telegramId,
            p_skin_name: item.name,
            p_skin_image: item.lottie || item.image || '',
            p_skin_tier: item.tier,
            p_skin_price: item.price
        };
        
        const { data, error } = await supabase.rpc('add_skin_to_inventory', rpcParams);
        if (error) throw error;
        
        if (currentResultSkin) {
            currentResultSkin.unique_id = data;
        }
        
        // Add to activity log
        addActivity('case_open', {
            caseName: 'Case',
            skinName: item.name,
            skinTier: item.tier
        });
        
        // Show success message
        showToast(`${item.name} added to inventory!`, 'success');
        
        // Refresh inventory display if user is on inventory tab
        try {
            await getUserInventory();
            console.log('Inventory refreshed successfully');
        } catch (inventoryError) {
            console.error('Error refreshing inventory:', inventoryError);
        }
        
    } catch (err) {
        console.error('Failed to add item to inventory:', err);
        showToast('Failed to add item to inventory. Please contact support.', 'error');
        console.warn('Continuing despite inventory error to show roulette result');
    }
} 