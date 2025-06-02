// Initialize TON Connect when the script loads
async function initializeTonConnect() {
    console.log('[TON Connect] Attempting to initialize TON Connect UI...');
    
    // Wait for TonConnectUI to be defined, with a timeout
    const startTime = Date.now();
    const timeout = 5000; // 5 seconds timeout

    while (typeof TonConnectUI === 'undefined' && (Date.now() - startTime) < timeout) {
        console.log('[TON Connect] TonConnectUI not yet defined, waiting...');
        await new Promise(resolve => setTimeout(resolve, 200)); // Wait 200ms before retrying
    }

    if (typeof TonConnectUI === 'undefined') {
        console.error('[TON Connect] SDK SCRIPT NOT LOADED: TonConnectUI is still not defined after timeout. Ensure SDK script is loaded before tonConnect.js.');
        // alert('TON Wallet connection service failed to load. Please try refreshing.'); // Optional: inform user
        return; // Stop initialization if SDK is not found
    }

    console.log('[TON Connect] SDK SCRIPT LOADED: TonConnectUI object found.');

    try {
        const manifestUrl = 'https://stepan3301.github.io/unboxd_nft/tonconnect-manifest.json';
        console.log('[TON Connect] Manifest URL for TonConnectUI:', manifestUrl);
        
        tonConnectUI = new TonConnectUI({
            manifestUrl: manifestUrl,
            buttonRootId: 'ton-connect-button'
        });
        console.log('[TON Connect] tonConnectUI instance created successfully.');
        
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
        console.error('[TON Connect] CRITICAL ERROR during new TonConnectUI():', error);
        // alert('Error initializing TON Wallet connection. Some features might be unavailable.'); // Optional
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

// Function to handle TON Connect wallet button click (from attachEventListeners)
async function handleTonConnectWalletButtonClick() {
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
}

// Function to handle UCoin purchase button clicks (from attachEventListeners)
function handleUcoinPackageBuyButtonClick(ucoins, tonAmount) {
    console.log(`Attempting to buy ${ucoins} UCoins for ${tonAmount} TON.`);
            
    if (tonConnectUI && tonConnectUI.connected) {
         // Placeholder: actual transaction logic will go here
        alert(`Transaction for ${ucoins} UCoins (cost ${tonAmount} TON) not yet implemented. Wallet is connected.`);
        // TODO: Implement actual transaction logic using tonConnectUI.sendTransaction(...)
    } else {
        // Show connect prompt within the modal
        const packagesList = document.getElementById('ucoin-packages-list');
        const connectPrompt = document.getElementById('ucoin-connect-prompt');
        if (packagesList) packagesList.style.display = 'none';
        if (connectPrompt) connectPrompt.style.display = 'block';
    }
}

// Function to handle connect wallet button inside UCoins modal (from attachEventListeners)
function handleUcoinModalConnectWalletButtonClick() {
    if (tonConnectUI) {
        tonConnectUI.openModal();
    }
}

console.log('[TON Connect] tonConnect.js script finished loading.'); 