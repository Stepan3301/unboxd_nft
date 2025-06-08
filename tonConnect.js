// Your wallet address for receiving payments
const RECEIVER_WALLET_ADDRESS = "UQBKgXCNLPexWhs2L79kiARR1phGH4gSi6xKmqVoEWhs9kwP"; // TODO: Replace this with your actual TON wallet address

// Initialize TON Connect when the script loads
async function initializeTonConnect() {
    console.log('[TON Connect] Attempting to initialize TON Connect UI...');
    
    // Wait for both Telegram WebApp and TonConnectUI to be ready
    try {
        // First, ensure Telegram WebApp is ready
        if (window.Telegram?.WebApp) {
            console.log('[TON Connect] Telegram WebApp is available');
        } else {
            console.warn('[TON Connect] Telegram WebApp not available, TON Connect may have limited functionality');
        }
        
        // Wait for TonConnectUI to be defined with extended retry logic
        let attempts = 0;
        const maxAttempts = 50; // 10 seconds with 200ms intervals
        
        console.log('[TON Connect] Checking for TonConnectUI availability...');
        
        while (typeof TonConnectUI === 'undefined' && attempts < maxAttempts) {
            if (attempts % 5 === 0) { // Log every 5th attempt to reduce console spam
                console.log(`[TON Connect] Waiting for TonConnectUI SDK... (attempt ${attempts + 1}/${maxAttempts})`);
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }

        if (typeof TonConnectUI === 'undefined') {
            console.error('[TON Connect] CRITICAL: TonConnectUI SDK failed to load after 10 seconds');
            console.error('[TON Connect] Possible causes: Network issues, CDN problems, or script loading conflicts');
            showTonConnectError('TON Wallet connection service failed to load. Please check your internet connection and refresh the page.');
            return false;
        }

        console.log('[TON Connect] ✅ TonConnectUI SDK loaded successfully');

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
        }
        
        console.log('[TON Connect] ✅ Initialization completed successfully');
        return true;
        
    } catch (error) {
        console.error('[TON Connect] ❌ CRITICAL ERROR during initialization:', error);
        showTonConnectError('Failed to initialize TON Wallet connection. Please refresh the page and try again.');
        return false;
    }
}

// Show user-friendly error messages
function showTonConnectError(message) {
    console.error('[TON Connect] Error:', message);
    
    // Try to show toast if available
    if (typeof showToast === 'function') {
        showToast(message, 'error');
    } else {
        // Fallback: show a simple alert for critical errors
        alert(message);
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
        console.error('[TON Connect] ❌ TonConnectUI not initialized');
        showTonConnectError('TON Wallet connection service is not available. Please refresh the page and try again.');
        return;
    }
    
    try {
        if (tonConnectUI.connected) {
            console.log('[TON Connect] 🔌 Attempting to disconnect wallet');
            await tonConnectUI.disconnect();
            console.log('[TON Connect] ✅ Wallet disconnected successfully');
            showTonConnectError('Wallet disconnected successfully');
        } else {
            console.log('[TON Connect] 🔗 Opening wallet connection modal');
            tonConnectUI.openModal();
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
        console.error('[TON Connect] ❌ TonConnectUI not initialized');
        showTonConnectError('TON Wallet connection service is not available.');
        return;
    }
    
    if (!tonConnectUI.connected) {
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
function handleUcoinModalConnectWalletButtonClick() {
    console.log('[TON Connect] 🔗 UCoins modal connect button clicked');
    
    if (tonConnectUI) {
        tonConnectUI.openModal();
    } else {
        console.error('[TON Connect] ❌ TonConnectUI not initialized');
        showTonConnectError('TON Wallet connection service is not available.');
    }
}

console.log('[TON Connect] 📋 tonConnect.js script loaded successfully'); 