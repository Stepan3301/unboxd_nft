// Telegram Stars Payment Handler
// This module handles Telegram Stars payments for case opening following the official API flow

/**
 * Initiates a Telegram Stars payment by sending a command to the bot
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

        console.log('[Telegram Stars] Sending buy case command to bot...');

        // Method 1: Use Telegram WebApp to send data to bot
        const paymentData = {
            action: 'buy_case',
            case_type: caseType,
            stars_amount: starsAmount,
            user_id: tg.initDataUnsafe.user.id,
            timestamp: Date.now()
        };

        // Send data to bot via WebApp
        tg.sendData(JSON.stringify(paymentData));

        // Alternative Method 2: Direct bot command (if user prefers)
        // This will open the bot chat and let user manually trigger /buy_case
        const botUsername = 'UnboxdNFT_bot'; // Replace with your actual bot username
        const message = encodeURIComponent(`/buy_case ${caseType}`);
        
        // Open bot chat with pre-filled command
        tg.openTelegramLink(`https://t.me/${botUsername}?text=${message}`);

        // For now, we'll assume the payment will be handled by the bot
        // The bot will send invoice, handle pre-checkout, and process payment
        // The case opening will happen after successful payment confirmation

        console.log('[Telegram Stars] Payment request sent to bot');
        
        // Return success since we've initiated the payment flow
        return { success: true, message: 'Payment initiated. Complete the transaction in the bot chat.' };

    } catch (error) {
        console.error('[Telegram Stars] Payment error:', error);
        return { 
            success: false, 
            message: error.message || 'Payment failed. Please try again.' 
        };
    }
}

/**
 * Alternative method: Direct invoice creation (for when bot can send invoices directly to WebApp)
 * This would be used if we have a backend API that can trigger bot invoice sending
 * @param {string} caseType - The type of case being purchased  
 * @param {number} starsAmount - The amount of stars to charge
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function createStarsInvoice(caseType, starsAmount) {
    try {
        const tg = window.Telegram.WebApp;
        const userId = tg.initDataUnsafe?.user?.id;
        
        if (!userId) {
            throw new Error('User ID not available');
        }

        // Send request to your backend to create invoice via bot
        const response = await fetch('/api/create-stars-invoice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                case_type: caseType,
                stars_amount: starsAmount,
                telegram_init_data: tg.initData // For validation
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('[Telegram Stars] Invoice created successfully');
            return { success: true };
        } else {
            throw new Error(result.message || 'Failed to create invoice');
        }

    } catch (error) {
        console.error('[Telegram Stars] Invoice creation error:', error);
        return { 
            success: false, 
            message: error.message || 'Failed to create invoice' 
        };
    }
}

/**
 * Check if user has completed a stars payment and can claim their case
 * This would be called periodically or when user returns to the app
 * @param {string} caseType - The type of case being purchased
 * @returns {Promise<{success: boolean, paymentId?: string, message?: string}>}
 */
async function checkCompletedStarsPayment(caseType) {
    try {
        const tg = window.Telegram.WebApp;
        const userId = tg.initDataUnsafe?.user?.id;
        
        if (!userId) {
            throw new Error('User ID not available');
        }

        // Check with backend if user has any completed payments for this case type
        const response = await fetch(`/api/check-completed-payment?user_id=${userId}&case_type=${caseType}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();
        
        if (result.success && result.payment_completed) {
            console.log('[Telegram Stars] Found completed payment:', result.payment_id);
            return { 
                success: true, 
                paymentId: result.payment_id,
                message: 'Payment completed! You can now open your case.'
            };
        } else {
            return { 
                success: false, 
                message: 'No completed payment found'
            };
        }

    } catch (error) {
        console.error('[Telegram Stars] Error checking payment:', error);
        return { 
            success: false, 
            message: 'Error checking payment status' 
        };
    }
}

/**
 * Opens the bot chat to manually initiate stars payment
 * This is a fallback method if direct integration doesn't work
 * @param {string} caseType - The type of case being purchased
 */
function openBotForStarsPayment(caseType) {
    try {
        if (!window.Telegram || !window.Telegram.WebApp) {
            throw new Error('Telegram WebApp not available');
        }

        // Replace with your actual bot username
        const botUsername = 'UnboxdNFT_bot'; 
        
        // Open bot chat with pre-filled buy case command
        const url = `https://t.me/${botUsername}?start=buy_case_${caseType}`;
        window.Telegram.WebApp.openTelegramLink(url);
        
        console.log(`[Telegram Stars] Opened bot for ${caseType} case purchase`);
        
    } catch (error) {
        console.error('[Telegram Stars] Error opening bot:', error);
        // Fallback: show user a message with bot username
        alert(`To purchase with Telegram Stars, please open @${botUsername} and send /buy_case`);
    }
}

/**
 * Handle successful payment notification from bot
 * This would be called when the bot notifies the WebApp of successful payment
 * @param {Object} paymentData - Payment data from bot
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function handlePaymentSuccess(paymentData) {
    try {
        console.log('[Telegram Stars] Processing successful payment:', paymentData);
        
        const { case_type, payment_id, user_id } = paymentData;
        
        // Verify payment with backend
        const response = await fetch('/api/verify-stars-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                payment_id: payment_id,
                user_id: user_id,
                case_type: case_type
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('[Telegram Stars] Payment verified successfully');
            return { success: true };
        } else {
            throw new Error(result.message || 'Payment verification failed');
        }

    } catch (error) {
        console.error('[Telegram Stars] Payment verification error:', error);
        return { 
            success: false, 
            message: error.message || 'Payment verification failed' 
        };
    }
}

// Initialize WebApp data listener for payment updates
if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    
    // Listen for data sent from bot
    tg.onEvent('dataReceived', (data) => {
        try {
            const parsedData = JSON.parse(data);
            if (parsedData.type === 'payment_success') {
                handlePaymentSuccess(parsedData).then(() => {
                    // Call the case opening function after payment verification
                    if (typeof processStarsPaymentSuccess === 'function') {
                        processStarsPaymentSuccess(parsedData.case_type, parsedData.payment_id);
                    }
                });
            }
        } catch (error) {
            console.error('[Telegram Stars] Error parsing bot data:', error);
        }
    });
    
    console.log('[Telegram Stars] WebApp payment listeners initialized');
} 