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
        
        // Listen for invoice events according to official documentation
        tg.onEvent('invoiceClosed', async (result) => {
            console.log('[Telegram Stars] Invoice closed event:', result);
            
            if (result.status === 'paid') {
                console.log('[Telegram Stars] Payment successful!');
                
                // Show success message
                if (typeof showToast === 'function') {
                    showToast('🎉 Payment successful! Opening your case...', 'success');
                }
                
                // Wait for the bot to process the payment, then trigger case opening
                setTimeout(async () => {
                    try {
                        if (typeof processStarsPaymentSuccess === 'function') {
                            // The case type should be determined from the payment context
                            // For now, we'll use 'labubu' since that's what we're implementing
                            await processStarsPaymentSuccess('labubu', 'stars_payment_' + Date.now());
                        }
                    } catch (error) {
                        console.error('[Telegram Stars] Error opening case:', error);
                        if (typeof showToast === 'function') {
                            showToast('Payment successful! Please refresh to see your case.', 'warning');
                        }
                    }
                }, 2000); // Wait 2 seconds for bot processing
                
            } else if (result.status === 'cancelled') {
                console.log('[Telegram Stars] Payment cancelled');
                if (typeof showToast === 'function') {
                    showToast('Payment cancelled', 'info');
                }
            } else if (result.status === 'failed') {
                console.log('[Telegram Stars] Payment failed');
                if (typeof showToast === 'function') {
                    showToast('Payment failed. Please try again.', 'error');
                }
            }
        });

        // Ready the WebApp
        tg.ready();
        
        console.log('[Telegram Stars] Payment listeners initialized');
    } else {
        console.warn('[Telegram Stars] Telegram WebApp not available');
    }
}

// Initialize when script loads
initializeStarsPaymentListeners(); 