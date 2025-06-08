// Your wallet address for receiving payments
const RECEIVER_WALLET_ADDRESS = "UQCBEWGCIk9ppL8JQQr4Y0cx7xl1qwY1Ju2ARiGobVUfuoIK"; // TODO: Replace this with your actual TON wallet address

// Global variable to prevent multiple initialization attempts
let tonConnectUI = null;
let isInitializing = false;
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 3;

// Initialize TON Connect when the script loads
async function initializeTonConnect() {
    console.log('[TON Connect] Attempting to initialize TON Connect UI...');
    
    // Prevent multiple simultaneous initialization attempts
    if (isInitializing) {
        console.log('[TON Connect] Initialization already in progress, waiting...');
        // Wait for current initialization to complete
        let waitAttempts = 0;
        while (isInitializing && waitAttempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 200));
            waitAttempts++;
        }
        return tonConnectUI !== null;
    }
    
    // Prevent excessive initialization attempts
    if (initializationAttempts >= MAX_INITIALIZATION_ATTEMPTS) {
        console.error('[TON Connect] Maximum initialization attempts reached. Stopping further attempts.');
        showTonConnectError('TON Wallet connection service failed to initialize after multiple attempts.');
        return false;
    }
    
    isInitializing = true;
    initializationAttempts++;
    
    try {
        // First, ensure Telegram WebApp is ready
        if (window.Telegram?.WebApp) {
            console.log('[TON Connect] Telegram WebApp is available');
        } else {
            console.warn('[TON Connect] Telegram WebApp not available, TON Connect may have limited functionality');
        }
        
        // Check if TonConnect loading was marked as unavailable
        if (window.tonConnectUnavailable) {
            console.error('[TON Connect] CRITICAL: TonConnect SDK was marked as unavailable during loading');
            showTonConnectError('TON Wallet connection service failed to load. Please check your internet connection and refresh the page.');
            return false;
        }
        
        // Wait for TonConnectUI to be defined with extended retry logic
        let attempts = 0;
        const maxAttempts = 50; // 10 seconds with 200ms intervals
        
        console.log('[TON Connect] Checking for TonConnectUI availability...');
        
        while (typeof TonConnectUI === 'undefined' && attempts < maxAttempts && !window.tonConnectUnavailable) {
            if (attempts % 5 === 0) { // Log every 5th attempt to reduce console spam
                console.log(`[TON Connect] Waiting for TonConnectUI SDK... (attempt ${attempts + 1}/${maxAttempts})`);
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }

        if (typeof TonConnectUI === 'undefined' || window.tonConnectUnavailable) {
            console.error('[TON Connect] CRITICAL: TonConnectUI SDK failed to load after 10 seconds');
            console.error('[TON Connect] Possible causes: Network issues, CDN problems, or script loading conflicts');
            showTonConnectError('TON Wallet connection service failed to load. Please check your internet connection and refresh the page.');
            return false;
        }

        console.log('[TON Connect] ✅ TonConnectUI SDK loaded successfully');

        // Check if already initialized (prevents duplicate instances)
        if (tonConnectUI) {
            console.log('[TON Connect] TonConnectUI already initialized, returning existing instance');
            return true;
        }

        const manifestUrl = 'https://stepan3301.github.io/unboxd_nft/tonconnect-manifest.json';
        console.log('[TON Connect] Using manifest URL:', manifestUrl);
        
        // Initialize TonConnectUI with error handling
        tonConnectUI = new TonConnectUI({
            manifestUrl: manifestUrl,
            buttonRootId: 'ton-connect-button'
        });
        
        console.log('[TON Connect] ✅ TonConnectUI instance created successfully');
        
        // Subscribe to wallet connection changes
        tonConnectUI.onStatusChange(wallet => {
            console.log('[TON Connect] Status change detected:', wallet ? 'Connected' : 'Disconnected');
            
            if (wallet) {
                console.log('[TON Connect] ✅ Wallet connected:', {
                    address: wallet.account.address,
                    chain: wallet.account.chain,
                    publicKey: wallet.account.publicKey
                });
                updateUIForConnectedWallet(wallet);
            } else {
                console.log('[TON Connect] ❌ Wallet disconnected');
                updateUIForDisconnectedWallet();
            }
        });
        
        // Check if wallet is already connected
        if (tonConnectUI.connected) {
            console.log('[TON Connect] ✅ Wallet already connected on initialization');
            updateUIForConnectedWallet(tonConnectUI.wallet);
        } else {
            console.log('[TON Connect] Wallet not connected, showing connect button');
            updateUIForDisconnectedWallet();
        }
        
        console.log('[TON Connect] ✅ Initialization completed successfully');
        initializationAttempts = 0; // Reset on success
        return true;
        
    } catch (error) {
        console.error('[TON Connect] ❌ CRITICAL ERROR during initialization:', error);
        showTonConnectError('Failed to initialize TON Wallet connection. Please refresh the page and try again.');
        return false;
    } finally {
        isInitializing = false;
    }
}

// Show user-friendly error messages
function showTonConnectError(message) {
    console.error('[TON Connect] Error:', message);
    
    // Try to show toast if available
    if (typeof showToast === 'function') {
        showToast(message, 'error');
    } else {
        // Create a temporary toast notification if showToast isn't available
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 300px;
            text-align: center;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }
}

// Update UI when wallet is connected
function updateUIForConnectedWallet(wallet) {
    const button = document.getElementById('ton-connect-wallet-button');
    if (button) {
        const shortAddress = `${wallet.account.address.slice(0, 6)}...${wallet.account.address.slice(-4)}`;
        button.textContent = `Connected: ${shortAddress}`;
        button.classList.add('connected');
        button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
    }
    
    // Update Buy UCoins modal to show packages
    updateBuyUcoinsModalForConnectedWallet();
    
    // Update any other UI elements that depend on wallet connection
    const walletStatus = document.querySelector('.wallet-status');
    if (walletStatus) {
        walletStatus.textContent = `Connected: ${wallet.account.address.slice(0, 6)}...${wallet.account.address.slice(-4)}`;
    }
    
    console.log('[TON Connect] ✅ UI updated for connected wallet');
}

// Update UI when wallet is disconnected
function updateUIForDisconnectedWallet() {
    const button = document.getElementById('ton-connect-wallet-button');
    if (button) {
        button.textContent = 'Connect TON Wallet';
        button.classList.remove('connected');
        button.style.background = ''; // Reset to default
    }
    
    // Update Buy UCoins modal to show connect prompt
    updateBuyUcoinsModalForDisconnectedWallet();
    
    // Update any other UI elements
    const walletStatus = document.querySelector('.wallet-status');
    if (walletStatus) {
        walletStatus.textContent = 'Not connected';
    }
    
    console.log('[TON Connect] ✅ UI updated for disconnected wallet');
}

// Update Buy UCoins modal when wallet is connected
function updateBuyUcoinsModalForConnectedWallet() {
    const packagesList = document.getElementById('ucoin-packages-list');
    const connectPrompt = document.getElementById('ucoin-connect-prompt');
    
    if (packagesList && connectPrompt) {
        packagesList.style.display = 'block';
        connectPrompt.style.display = 'none';
        console.log('[TON Connect] ✅ UCoins modal updated for connected wallet');
    }
}

// Update Buy UCoins modal when wallet is disconnected
function updateBuyUcoinsModalForDisconnectedWallet() {
    const packagesList = document.getElementById('ucoin-packages-list');
    const connectPrompt = document.getElementById('ucoin-connect-prompt');
    
    if (packagesList && connectPrompt) {
        packagesList.style.display = 'none';
        connectPrompt.style.display = 'block';
        console.log('[TON Connect] ✅ UCoins modal updated for disconnected wallet');
    }
}

// Function to handle TON Connect wallet button click
async function handleTonConnectWalletButtonClick() {
    console.log('[TON Connect] 🔘 Wallet button clicked');
    
    if (!tonConnectUI) {
        console.warn('[TON Connect] ❌ TonConnectUI not initialized, attempting to initialize...');
        
        // Try to initialize TON Connect if it's not ready
        const initSuccess = await initializeTonConnect();
        if (!initSuccess) {
            showTonConnectError('TON Wallet connection service is not available. Please refresh the page and try again.');
            return;
        }
    }
    
    try {
        if (tonConnectUI && tonConnectUI.connected) {
            console.log('[TON Connect] 🔌 Attempting to disconnect wallet');
            await tonConnectUI.disconnect();
            console.log('[TON Connect] ✅ Wallet disconnected successfully');
            showTonConnectError('Wallet disconnected successfully');
        } else if (tonConnectUI) {
            console.log('[TON Connect] 🔗 Opening wallet connection modal');
            await tonConnectUI.openModal();
        } else {
            throw new Error('TonConnectUI instance is not available');
        }
    } catch (error) {
        console.error('[TON Connect] ❌ Error during wallet operation:', error);
        showTonConnectError('Failed to connect to TON Wallet. Please try again.');
    }
}

// Function to handle UCoin purchase button clicks
async function handleUcoinPackageBuyButtonClick(ucoins, tonAmount) {
    console.log(`[TON Connect] 💰 Attempting to buy ${ucoins} UCoins for ${tonAmount} TON`);
    
    if (!tonConnectUI) {
        console.warn('[TON Connect] ❌ TonConnectUI not initialized, attempting to initialize...');
        const initSuccess = await initializeTonConnect();
        if (!initSuccess) {
            showTonConnectError('TON Wallet connection service is not available.');
            return;
        }
    }
    
    if (!tonConnectUI || !tonConnectUI.connected) {
        console.log('[TON Connect] 🔗 Wallet not connected, showing connect prompt');
        // Show connect prompt within the modal
        const packagesList = document.getElementById('ucoin-packages-list');
        const connectPrompt = document.getElementById('ucoin-connect-prompt');
        if (packagesList) packagesList.style.display = 'none';
        if (connectPrompt) connectPrompt.style.display = 'block';
        showTonConnectError('Please connect your TON wallet first');
        return;
    }
    
    try {
        console.log('[TON Connect] 💳 Creating transaction for', ucoins, 'UCoins costing', tonAmount, 'TON');
        console.log('[TON Connect] 📍 Payment will be sent to:', RECEIVER_WALLET_ADDRESS);
        
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes validity
            messages: [
                {
                    address: RECEIVER_WALLET_ADDRESS,
                    amount: (tonAmount * 1000000000).toString() // Convert TON to nanotons
                }
            ]
        };
        
        console.log('[TON Connect] 📤 Sending transaction:', transaction);
        const result = await tonConnectUI.sendTransaction(transaction);
        
        console.log('[TON Connect] ✅ Transaction successful:', result);
        showTonConnectError(`Transaction successful! You will receive ${ucoins} UCoins shortly.`);
        
        // TODO: Call your backend to verify the transaction and credit UCoins
        
    } catch (error) {
        console.error('[TON Connect] ❌ Transaction error:', error);
        showTonConnectError('Transaction failed. Please try again.');
    }
}

// Function to handle connect wallet button inside UCoins modal
async function handleUcoinModalConnectWalletButtonClick() {
    console.log('[TON Connect] 🔗 UCoins modal connect button clicked');
    
    if (!tonConnectUI) {
        console.warn('[TON Connect] ❌ TonConnectUI not initialized, attempting to initialize...');
        const initSuccess = await initializeTonConnect();
        if (!initSuccess) {
            showTonConnectError('TON Wallet connection service is not available.');
            return;
        }
    }
    
    if (tonConnectUI) {
        try {
            await tonConnectUI.openModal();
        } catch (error) {
            console.error('[TON Connect] ❌ Error opening wallet modal:', error);
            showTonConnectError('Failed to open wallet connection modal. Please try again.');
        }
    } else {
        console.error('[TON Connect] ❌ TonConnectUI still not available after initialization attempt');
        showTonConnectError('TON Wallet connection service is not available.');
    }
}

// Debug function to check wallet button status
function debugWalletButtonStatus() {
    console.log('=== TON Connect Debug Status ===');
    console.log('TonConnectUI available:', typeof TonConnectUI !== 'undefined');
    console.log('tonConnectUI instance:', !!tonConnectUI);
    console.log('tonConnectUI connected:', tonConnectUI ? tonConnectUI.connected : 'N/A');
    console.log('Window tonConnectUnavailable flag:', !!window.tonConnectUnavailable);
    
    const walletButton = document.getElementById('ton-connect-wallet-button');
    console.log('Wallet button exists:', !!walletButton);
    if (walletButton) {
        console.log('Wallet button visible:', walletButton.offsetParent !== null);
        console.log('Wallet button text:', walletButton.textContent);
    }
    
    const tonConnectDiv = document.getElementById('ton-connect-button');
    console.log('TON Connect div exists:', !!tonConnectDiv);
    if (tonConnectDiv) {
        console.log('TON Connect div visible:', tonConnectDiv.offsetParent !== null);
        console.log('TON Connect div content:', tonConnectDiv.innerHTML);
    }
    
    // Check which tab is active
    const profileTab = document.getElementById('profile-tab');
    console.log('Profile tab active:', profileTab ? profileTab.classList.contains('active') : 'Profile tab not found');
    
    console.log('=== End Debug Status ===');
}

// Make sure the global functions are available
if (typeof window !== 'undefined') {
    window.initializeTonConnect = initializeTonConnect;
    window.handleTonConnectWalletButtonClick = handleTonConnectWalletButtonClick;
    window.handleUcoinPackageBuyButtonClick = handleUcoinPackageBuyButtonClick;
    window.handleUcoinModalConnectWalletButtonClick = handleUcoinModalConnectWalletButtonClick;
    window.debugWalletButtonStatus = debugWalletButtonStatus;
}

console.log('[TON Connect] 📋 tonConnect.js script loaded successfully'); 