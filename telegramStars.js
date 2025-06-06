// Telegram Stars Payment Handler
// Following official guide: https://core.telegram.org/bots/payments-stars

// Global payment context storage
let currentPaymentContext = null;

/**
 * Initiates a Telegram Stars payment using the official API flow
 * @param {string} caseType - The type of case being purchased
 * @param {number} starsAmount - The amount of stars to charge
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function initiateStarsPayment(caseType, starsAmount) {
    console.log(`[Telegram Stars] Initiating payment for ${caseType} case with ${starsAmount} stars`);
    
    try {
        // Check if Telegram WebApp is available
        if (!window.Telegram || !window.Telegram.WebApp) {
            throw new Error('Telegram WebApp not available');
        }

        const tg = window.Telegram.WebApp;
        
        // Check if we're in a Telegram environment
        if (!tg.initDataUnsafe?.user?.id) {
            throw new Error('Not running in Telegram environment');
        }

        console.log('[Telegram Stars] Requesting invoice from bot...');

        // Store payment context globally for later use
        currentPaymentContext = {
            caseType: caseType,
            starsAmount: starsAmount,
            userId: tg.initDataUnsafe.user.id,
            timestamp: Date.now()
        };

        // Send request to bot to create and send invoice
        const invoiceRequest = {
            action: 'send_stars_invoice',
            case_type: caseType,
            stars_amount: starsAmount,
            user_id: tg.initDataUnsafe.user.id
        };

        // Send the request to bot via WebApp data
        tg.sendData(JSON.stringify(invoiceRequest));

        console.log('[Telegram Stars] Invoice request sent to bot');
        
        // Start payment timeout
        handlePaymentTimeout();
        
        return { success: true, message: 'Invoice request sent successfully' };

    } catch (error) {
        console.error('[Telegram Stars] Payment error:', error);
        currentPaymentContext = null; // Clear context on error
        return { 
            success: false, 
            message: error.message || 'Payment failed. Please try again.' 
        };
    }
}

/**
 * Handle successful payment notification from Telegram
 * This is called when Telegram confirms the payment
 * @param {Object} paymentData - Payment data from Telegram
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function handleStarsPaymentSuccess(paymentData) {
    try {
        console.log('[Telegram Stars] Processing successful payment:', paymentData);
        
        const { case_type, telegram_payment_charge_id } = paymentData;
        
        // Trigger case opening after successful payment
        if (typeof processStarsPaymentSuccess === 'function') {
            await processStarsPaymentSuccess(case_type, telegram_payment_charge_id);
        }

        console.log('[Telegram Stars] Payment processed successfully');
        return { success: true };

    } catch (error) {
        console.error('[Telegram Stars] Payment processing error:', error);
        return { 
            success: false, 
            message: error.message || 'Payment processing failed' 
        };
    }
}

/**
 * Payment timeout handler
 */
function handlePaymentTimeout(timeoutMs = 300000) { // 5 minutes default
    if (!currentPaymentContext) return;
    
    setTimeout(() => {
        if (currentPaymentContext) {
            console.warn('[Telegram Stars] Payment timeout - clearing context');
            const caseType = currentPaymentContext.caseType;
            currentPaymentContext = null;
            
            if (typeof showToast === 'function') {
                showToast(`⏰ Payment timeout for ${caseType} case. Please try again.`, 'warning');
            }
        }
    }, timeoutMs);
}

/**
 * Retry payment mechanism
 */
async function retryPayment() {
    if (!currentPaymentContext) {
        console.error('[Telegram Stars] No payment context to retry');
        return { success: false, message: 'No payment to retry' };
    }
    
    const { caseType, starsAmount } = currentPaymentContext;
    console.log(`[Telegram Stars] Retrying payment for ${caseType} case`);
    
    return await initiateStarsPayment(caseType, starsAmount);
}

/**
 * Clear any stuck payment states
 */
function clearStuckPayment() {
    if (currentPaymentContext) {
        console.log('[Telegram Stars] Clearing stuck payment context');
        currentPaymentContext = null;
        
        // Remove any loading messages
        const loadingElement = document.getElementById('payment-success-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
        
        if (typeof showToast === 'function') {
            showToast('Payment state cleared. You can try again.', 'info');
        }
    }
}

/**
 * Initialize WebApp event listeners for Telegram Stars payments
 */
function initializeStarsPaymentListeners() {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        
        console.log('[Telegram Stars] Initializing payment listeners...');
        
        // Listen for invoice events according to official documentation
        tg.onEvent('invoiceClosed', async (result) => {
            console.log('[Telegram Stars] Invoice closed event received:', result);
            
            if (result.status === 'paid') {
                console.log('[Telegram Stars] Payment successful! Processing...');
                
                // Get case type from stored context
                const caseType = currentPaymentContext?.caseType || 'labubu';
                const starsAmount = currentPaymentContext?.starsAmount || 1;
                
                console.log(`[Telegram Stars] Using payment context: ${caseType} case for ${starsAmount} stars`);
                
                // Show immediate success feedback
                if (typeof showToast === 'function') {
                    showToast('🎉 Payment successful! Opening your case...', 'success');
                } else {
                    console.log('[Telegram Stars] Success feedback: Payment completed!');
                }
                
                // Show loading state with case-specific information
                const loadingMessage = document.createElement('div');
                loadingMessage.innerHTML = `
                    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                                background: rgba(0,0,0,0.9); color: white; padding: 20px; border-radius: 10px; 
                                text-align: center; z-index: 10000; font-family: Arial, sans-serif;">
                        <div style="font-size: 24px; margin-bottom: 10px;">🎉</div>
                        <div style="font-size: 18px; margin-bottom: 10px;">Payment Successful!</div>
                        <div style="font-size: 14px;">Opening your ${caseType.charAt(0).toUpperCase() + caseType.slice(1)} case...</div>
                        <div style="font-size: 12px; color: #ccc; margin-bottom: 15px;">Paid ${starsAmount} ⭐</div>
                        <div style="margin-top: 15px;">
                            <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; 
                                        border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                        </div>
                    </div>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                `;
                loadingMessage.id = 'payment-success-loading';
                document.body.appendChild(loadingMessage);
                
                // Wait for bot processing, then trigger case opening
                setTimeout(async () => {
                    try {
                        console.log(`[Telegram Stars] Triggering case opening for ${caseType}...`);
                        
                        if (typeof processStarsPaymentSuccess === 'function') {
                            await processStarsPaymentSuccess(caseType, `stars_payment_${Date.now()}`);
                            console.log('[Telegram Stars] Case opening completed successfully');
                        } else {
                            console.error('[Telegram Stars] processStarsPaymentSuccess function not found');
                            if (typeof showToast === 'function') {
                                showToast('Payment successful! Please refresh to see your case.', 'warning');
                            }
                        }
                    } catch (error) {
                        console.error('[Telegram Stars] Error opening case:', error);
                        if (typeof showToast === 'function') {
                            showToast('Payment successful! Case opening failed. Please try refreshing.', 'warning');
                        }
                    } finally {
                        // Remove loading message and clear context
                        const loadingElement = document.getElementById('payment-success-loading');
                        if (loadingElement) {
                            loadingElement.remove();
                        }
                        currentPaymentContext = null; // Clear payment context
                    }
                }, 3000); // Wait 3 seconds for bot processing
                
            } else if (result.status === 'cancelled') {
                console.log('[Telegram Stars] Payment cancelled by user');
                currentPaymentContext = null; // Clear context on cancellation
                if (typeof showToast === 'function') {
                    showToast('💫 Payment cancelled', 'info');
                }
            } else if (result.status === 'failed') {
                console.log('[Telegram Stars] Payment failed');
                currentPaymentContext = null; // Clear context on failure
                if (typeof showToast === 'function') {
                    showToast('❌ Payment failed. Please try again.', 'error');
                }
            } else {
                console.log('[Telegram Stars] Unknown invoice status:', result.status);
                currentPaymentContext = null; // Clear context on unknown status
                if (typeof showToast === 'function') {
                    showToast('❓ Payment status unknown. Please check your purchase.', 'warning');
                }
            }
        });

        // Additional event listeners for better debugging
        tg.onEvent('mainButtonClicked', () => {
            console.log('[Telegram Stars] Main button clicked');
        });

        tg.onEvent('backButtonClicked', () => {
            console.log('[Telegram Stars] Back button clicked');
        });

        // Enhanced global event tracking for debugging
        tg.onEvent('themeChanged', () => {
            console.log('[Telegram Stars] Theme changed');
        });

        tg.onEvent('viewportChanged', (data) => {
            console.log('[Telegram Stars] Viewport changed:', data);
        });

        tg.onEvent('safeAreaChanged', (data) => {
            console.log('[Telegram Stars] Safe area changed:', data);
        });

        // Track payment-related events
        tg.onEvent('popupClosed', (buttonId) => {
            console.log('[Telegram Stars] Popup closed with button:', buttonId);
        });

        // Global error tracking for WebApp
        window.addEventListener('error', (event) => {
            console.error('[Telegram Stars] Global error:', event.error);
            console.error('[Telegram Stars] Error details:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('[Telegram Stars] Unhandled promise rejection:', event.reason);
        });

        // Ready the WebApp
        tg.ready();
        
        console.log('[Telegram Stars] Payment listeners initialized successfully');
        console.log('[Telegram Stars] WebApp version:', tg.version);
        console.log('[Telegram Stars] Platform:', tg.platform);
        console.log('[Telegram Stars] Color scheme:', tg.colorScheme);
        console.log('[Telegram Stars] Header color:', tg.headerColor);
        console.log('[Telegram Stars] Background color:', tg.backgroundColor);
        
    } else {
        console.warn('[Telegram Stars] Telegram WebApp not available - payment listeners not initialized');
    }
}

// Initialize when script loads
initializeStarsPaymentListeners(); 