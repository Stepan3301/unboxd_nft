(function(window) {
    'use strict';

    // Your wallet address for receiving payments
    const RECEIVER_WALLET_ADDRESS = "UQCBEWGCIk9ppL8JQQr4Y0cx7xl1qwY1Ju2ARiGobVUfuoIK"; // TODO: Replace this with your actual TON wallet address

    // Global variable to prevent multiple initialization attempts
    let tonConnectUI = null;
    let isInitializing = false;
    let initializationAttempts = 0;
    const MAX_INITIALIZATION_ATTEMPTS = 3;

    // Initialize TON Connect
    async function initialize() {
        console.log('[TON Connect] Attempting to initialize TON Connect UI...');
        
        // Prevent multiple simultaneous initialization attempts
        if (isInitializing) {
            console.log('[TON Connect] Initialization already in progress, waiting...');
            let waitAttempts = 0;
            while (isInitializing && waitAttempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 200));
                waitAttempts++;
            }
            return tonConnectUI !== null;
        }
        
        if (initializationAttempts >= MAX_INITIALIZATION_ATTEMPTS) {
            console.error('[TON Connect] Maximum initialization attempts reached. Stopping further attempts.');
            showError('TON Wallet connection service failed to initialize after multiple attempts.');
            return false;
        }
        
        isInitializing = true;
        initializationAttempts++;
        
        try {
            if (window.tonConnectUnavailable) {
                console.error('[TON Connect] CRITICAL: TonConnect SDK was marked as unavailable during loading');
                showError('TON Wallet connection service failed to load. Please check your internet connection and refresh the page.');
                return false;
            }
            
            let attempts = 0;
            const maxAttempts = 50; // 10 seconds with 200ms intervals
            
            while (typeof TonConnectUI === 'undefined' && attempts < maxAttempts && !window.tonConnectUnavailable) {
                if (attempts % 5 === 0) {
                    console.log(`[TON Connect] Waiting for TonConnectUI SDK... (attempt ${attempts + 1}/${maxAttempts})`);
                }
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }

            if (typeof TonConnectUI === 'undefined' || window.tonConnectUnavailable) {
                console.error('[TON Connect] CRITICAL: TonConnectUI SDK failed to load after 10 seconds');
                showError('TON Wallet connection service failed to load. Please check your internet connection and refresh the page.');
                return false;
            }

            if (tonConnectUI) {
                console.log('[TON Connect] TonConnectUI already initialized, returning existing instance');
                return true;
            }

            const manifestUrl = 'https://stepan3301.github.io/unboxd_nft/tonconnect-manifest.json';
            
            tonConnectUI = new TonConnectUI({
                manifestUrl: manifestUrl,
                buttonRootId: 'ton-connect-button'
            });
            
            tonConnectUI.onStatusChange(wallet => {
                if (wallet) {
                    updateUIForConnectedWallet(wallet);
                } else {
                    updateUIForDisconnectedWallet();
                }
            });
            
            if (tonConnectUI.connected) {
                updateUIForConnectedWallet(tonConnectUI.wallet);
            } else {
                updateUIForDisconnectedWallet();
            }
            
            initializationAttempts = 0; // Reset on success
            return true;
            
        } catch (error) {
            console.error('[TON Connect] ❌ CRITICAL ERROR during initialization:', error);
            showError('Failed to initialize TON Wallet connection. Please refresh the page and try again.');
            return false;
        } finally {
            isInitializing = false;
        }
    }

    // Show user-friendly error messages
    function showError(message) {
        console.error('[TON Connect] Error:', message);
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else {
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
        }
        updateBuyUcoinsModalForConnectedWallet();
    }

    // Update UI when wallet is disconnected
    function updateUIForDisconnectedWallet() {
        const button = document.getElementById('ton-connect-wallet-button');
        if (button) {
            button.textContent = 'Connect TON Wallet';
            button.classList.remove('connected');
        }
        updateBuyUcoinsModalForDisconnectedWallet();
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

    // Function to handle TON Connect wallet button click
    async function handleButtonClick() {
        if (!tonConnectUI) {
            const initSuccess = await initialize();
            if (!initSuccess) {
                showError('TON Wallet connection service is not available. Please refresh the page and try again.');
                return;
            }
        }
        
        try {
            if (tonConnectUI && tonConnectUI.connected) {
                await tonConnectUI.disconnect();
            } else if (tonConnectUI) {
                await tonConnectUI.openModal();
            }
        } catch (error) {
            console.error('[TON Connect] ❌ Error during wallet operation:', error);
            showError('Failed to connect to TON Wallet. Please try again.');
        }
    }

    // Function to handle UCoin purchase button clicks
    async function handleUcoinBuyClick(ucoins, tonAmount) {
        if (!tonConnectUI) {
            const initSuccess = await initialize();
            if (!initSuccess) {
                showError('TON Wallet connection service is not available.');
                return;
            }
        }
        
        if (!tonConnectUI || !tonConnectUI.connected) {
            updateBuyUcoinsModalForDisconnectedWallet();
            showError('Please connect your TON wallet first');
            return;
        }
        
        try {
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
                messages: [{
                    address: RECEIVER_WALLET_ADDRESS,
                    amount: (tonAmount * 1000000000).toString()
                }]
            };
            await tonConnectUI.sendTransaction(transaction);
            showError(`Transaction successful! You will receive ${ucoins} UCoins shortly.`);
        } catch (error) {
            console.error('[TON Connect] ❌ Transaction error:', error);
            showError('Transaction failed. Please try again.');
        }
    }

    // Function to handle connect wallet button inside UCoins modal
    async function handleModalConnectClick() {
        if (!tonConnectUI) {
            const initSuccess = await initialize();
            if (!initSuccess) {
                showError('TON Wallet connection service is not available.');
                return;
            }
        }
        
        if (tonConnectUI) {
            try {
                await tonConnectUI.openModal();
            } catch (error) {
                console.error('[TON Connect] ❌ Error opening wallet modal:', error);
                showError('Failed to open wallet connection modal. Please try again.');
            }
        }
    }

    // Public API
    const TonConnectWallet = {
        initialize,
        handleButtonClick,
        handleUcoinBuyClick,
        handleModalConnectClick,
        isReady: () => typeof TonConnectUI !== 'undefined' && !!tonConnectUI
    };

    // Expose to global scope
    window.TonConnectWallet = TonConnectWallet;
    
    console.log('[TON Connect] Wallet module initialized and exposed as window.TonConnectWallet.');

})(window); 