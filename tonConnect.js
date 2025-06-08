(function(window) {
    'use strict';
    
    // Configuration
    const RECEIVER_WALLET_ADDRESS = "UQCBEWGCIk9ppL8JQGr4Y0cx7l1qmY1Ju2A1GobVUfuoIK";
    const MANIFEST_URL = 'https://stepan3301.github.io/unboxd_nft/tonconnect-manifest.json';
    const MAX_INIT_ATTEMPTS = 5;
    const INIT_RETRY_DELAY = 2000;
    
    // State variables
    let tonConnectUI = null;
    let isInitializing = false;
    let initAttempts = 0;
    let isReady = false;
    
    // Utility functions
    function log(message, ...args) {
        console.log(`[TonConnect] ${message}`, ...args);
    }
    
    function error(message, ...args) {
        console.error(`[TonConnect] ${message}`, ...args);
    }
    
    function showUserMessage(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            // Fallback to alert or console
            if (type === 'error') {
                alert(`Error: ${message}`);
            } else {
                console.log(`[TonConnect] ${type}: ${message}`);
            }
        }
    }
    
    // Check if TON Connect UI is available
    function isTonConnectAvailable() {
        return typeof TonConnectUI !== 'undefined' && !window.tonConnectUnavailable;
    }
    
    // Wait for TON Connect UI to become available
    function waitForTonConnect(timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const check = () => {
                if (isTonConnectAvailable()) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('TON Connect UI not available after timeout'));
                } else {
                    setTimeout(check, 200);
                }
            };
            
            check();
        });
    }
    
    // Initialize TON Connect
    async function initialize() {
        if (isInitializing) {
            log('Initialization already in progress, waiting...');
            return waitForInitialization();
        }
        
        if (tonConnectUI && isReady) {
            log('TON Connect already initialized');
            return true;
        }
        
        if (initAttempts >= MAX_INIT_ATTEMPTS) {
            error('Maximum initialization attempts reached');
            showUserMessage('TON Wallet connection service failed to initialize. Please refresh the page.', 'error');
            return false;
        }
        
        isInitializing = true;
        initAttempts++;
        
        try {
            log(`Initialization attempt ${initAttempts}/${MAX_INIT_ATTEMPTS}`);
            
            // Wait for TON Connect UI to be available
            await waitForTonConnect();
            
            // Check if already initialized
            if (tonConnectUI) {
                log('TonConnectUI already exists, returning existing instance');
                isInitializing = false;
                isReady = true;
                return true;
            }
            
            // Create new TonConnectUI instance
            log('Creating new TonConnectUI instance...');
            tonConnectUI = new TonConnectUI({
                manifestUrl: MANIFEST_URL,
                buttonRootId: 'ton-connect-button'
            });
            
            // Set up event handlers
            tonConnectUI.onStatusChange(wallet => {
                if (wallet) {
                    log('Wallet connected:', wallet.account.address);
                    updateUIForConnectedWallet(wallet);
                } else {
                    log('Wallet disconnected');
                    updateUIForDisconnectedWallet();
                }
            });
            
            isReady = true;
            log('TON Connect initialized successfully');
            return true;
            
        } catch (error) {
            error('Initialization failed:', error);
            showUserMessage(`Failed to initialize TON Wallet connection: ${error.message}`, 'error');
            return false;
        } finally {
            isInitializing = false;
        }
    }
    
    // Wait for initialization to complete
    function waitForInitialization() {
        return new Promise((resolve) => {
            const check = () => {
                if (!isInitializing) {
                    resolve(isReady);
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }
    
    // Connect wallet
    async function connectWallet() {
        try {
            if (!tonConnectUI) {
                const initSuccess = await initialize();
                if (!initSuccess) {
                    throw new Error('Failed to initialize TON Connect');
                }
            }
            
            if (tonConnectUI.connected) {
                log('Wallet already connected');
                return tonConnectUI.wallet;
            }
            
            log('Opening wallet connection modal...');
            const wallet = await tonConnectUI.connectWallet();
            log('Wallet connected successfully:', wallet.account.address);
            return wallet;
            
        } catch (error) {
            error('Failed to connect wallet:', error);
            showUserMessage(`Failed to connect wallet: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // Disconnect wallet
    async function disconnectWallet() {
        try {
            if (!tonConnectUI) {
                log('TON Connect not initialized');
                return;
            }
            
            if (!tonConnectUI.connected) {
                log('Wallet not connected');
                return;
            }
            
            await tonConnectUI.disconnect();
            log('Wallet disconnected successfully');
            
        } catch (error) {
            error('Failed to disconnect wallet:', error);
            showUserMessage(`Failed to disconnect wallet: ${error.message}`, 'error');
        }
    }
    
    // Get wallet info
    function getWallet() {
        return tonConnectUI?.wallet || null;
    }
    
    // Check if wallet is connected
    function isConnected() {
        return tonConnectUI?.connected || false;
    }
    
    // Update UI for connected wallet
    function updateUIForConnectedWallet(wallet) {
        const button = document.getElementById('ton-connect-wallet-button');
        if (button) {
            const shortAddress = `${wallet.account.address.slice(0, 6)}...${wallet.account.address.slice(-4)}`;
            button.textContent = `Connected: ${shortAddress}`;
            button.classList.add('connected');
        }
        
        // Update buy UCoins modal
        updateBuyUCoinsModalForConnectedWallet();
    }
    
    // Update UI for disconnected wallet
    function updateUIForDisconnectedWallet() {
        const button = document.getElementById('ton-connect-wallet-button');
        if (button) {
            button.textContent = 'Connect TON Wallet';
            button.classList.remove('connected');
        }
        
        // Update buy UCoins modal
        updateBuyUCoinsModalForDisconnectedWallet();
    }
    
    // Update buy UCoins modal for connected wallet
    function updateBuyUCoinsModalForConnectedWallet() {
        const packagesList = document.getElementById('ucoin-packages-list');
        const connectPrompt = document.getElementById('ucoin-connect-prompt');
        
        if (packagesList && connectPrompt) {
            packagesList.style.display = 'block';
            connectPrompt.style.display = 'none';
        }
    }
    
    // Update buy UCoins modal for disconnected wallet
    function updateBuyUCoinsModalForDisconnectedWallet() {
        const packagesList = document.getElementById('ucoin-packages-list');
        const connectPrompt = document.getElementById('ucoin-connect-prompt');
        
        if (packagesList && connectPrompt) {
            packagesList.style.display = 'none';
            connectPrompt.style.display = 'block';
        }
    }
    
    // Handle wallet button click
    async function handleWalletButtonClick() {
        try {
            if (!isTonConnectAvailable()) {
                showUserMessage('TON Wallet connection service is not available. Please refresh the page and try again.', 'error');
                return;
            }
            
            if (isConnected()) {
                await disconnectWallet();
            } else {
                await connectWallet();
            }
        } catch (error) {
            error('Error handling wallet button click:', error);
        }
    }
    
    // Handle modal connect button click
    async function handleModalConnectClick() {
        try {
            await connectWallet();
        } catch (error) {
            error('Error in modal connect:', error);
        }
    }
    
    // Public API
    const TonConnectWallet = {
        initialize,
        connectWallet,
        disconnectWallet,
        getWallet,
        isConnected,
        handleWalletButtonClick,
        handleModalConnectClick,
        isReady: () => isReady && isTonConnectAvailable()
    };
    
    // Expose to global scope
    window.TonConnectWallet = TonConnectWallet;
    
    log('TON Connect Wallet module loaded and exposed as window.TonConnectWallet');
    
})(window); 