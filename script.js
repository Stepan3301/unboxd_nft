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