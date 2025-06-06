// Telegram Stars Payment Handler
// Following official guide: https://core.telegram.org/bots/payments-stars

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

        // Send request to bot to create and send invoice
        // According to the official guide, the bot should use sendInvoice method
        const invoiceRequest = {
            action: 'send_stars_invoice',
            case_type: caseType,
            stars_amount: starsAmount,
            user_id: tg.initDataUnsafe.user.id
        };

        // Send the request to bot via WebApp data
        tg.sendData(JSON.stringify(invoiceRequest));

        console.log('[Telegram Stars] Invoice request sent to bot');
        
        return { success: true, message: 'Invoice request sent successfully' };

    } catch (error) {
        console.error('[Telegram Stars] Payment error:', error);
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
                
                // Show immediate success feedback
                if (typeof showToast === 'function') {
                    showToast('🎉 Payment successful! Opening your case...', 'success');
                } else {
                    console.log('[Telegram Stars] Success feedback: Payment completed!');
                }
                
                // Show loading state if possible
                const loadingMessage = document.createElement('div');
                loadingMessage.innerHTML = `
                    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                                background: rgba(0,0,0,0.9); color: white; padding: 20px; border-radius: 10px; 
                                text-align: center; z-index: 10000; font-family: Arial, sans-serif;">
                        <div style="font-size: 24px; margin-bottom: 10px;">🎉</div>
                        <div style="font-size: 18px; margin-bottom: 10px;">Payment Successful!</div>
                        <div style="font-size: 14px;">Opening your case...</div>
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
                        console.log('[Telegram Stars] Triggering case opening...');
                        
                        if (typeof processStarsPaymentSuccess === 'function') {
                            // For now, we'll use 'labubu' since that's what we're implementing
                            // In the future, this should be stored when the payment was initiated
                            await processStarsPaymentSuccess('labubu', `stars_payment_${Date.now()}`);
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
                        // Remove loading message
                        const loadingElement = document.getElementById('payment-success-loading');
                        if (loadingElement) {
                            loadingElement.remove();
                        }
                    }
                }, 3000); // Wait 3 seconds for bot processing
                
            } else if (result.status === 'cancelled') {
                console.log('[Telegram Stars] Payment cancelled by user');
                if (typeof showToast === 'function') {
                    showToast('💫 Payment cancelled', 'info');
                }
            } else if (result.status === 'failed') {
                console.log('[Telegram Stars] Payment failed');
                if (typeof showToast === 'function') {
                    showToast('❌ Payment failed. Please try again.', 'error');
                }
            } else {
                console.log('[Telegram Stars] Unknown invoice status:', result.status);
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

        // Ready the WebApp
        tg.ready();
        
        console.log('[Telegram Stars] Payment listeners initialized successfully');
        console.log('[Telegram Stars] WebApp version:', tg.version);
        console.log('[Telegram Stars] Platform:', tg.platform);
        
    } else {
        console.warn('[Telegram Stars] Telegram WebApp not available - payment listeners not initialized');
    }
}

// Initialize when script loads
initializeStarsPaymentListeners(); 