// Telegram Stars Payment Handler - ИСПРАВЛЕННАЯ ВЕРСИЯ

let currentPaymentContext = null;
let pendingInvoiceRequest = null;

async function initiateStarsPayment(caseType, starsAmount) {
    console.log(`[Telegram Stars] Initiating payment for ${caseType} case: ${starsAmount} stars`);
    
    try {
        if (!window.Telegram?.WebApp) {
            throw new Error('Telegram WebApp not available');
        }
        
        const tg = window.Telegram.WebApp;
        
        if (!tg.initDataUnsafe?.user?.id) {
            throw new Error('User not authenticated in Telegram');
        }
        
        const userId = tg.initDataUnsafe.user.id;
        
        // Store payment context
        currentPaymentContext = {
            caseType: caseType,
            starsAmount: starsAmount,
            userId: userId,
            timestamp: Date.now()
        };
        
        // Show loading state
        if (typeof showToast === 'function') {
            showToast('Creating payment link...', 'info');
        }
        
        // Request invoice link from bot
        const linkRequest = {
            action: 'get_invoice_link',
            case_type: caseType,
            stars_amount: starsAmount,
            user_id: userId,
            timestamp: Date.now()
        };
        
        // Set up promise to wait for bot response
        pendingInvoiceRequest = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout waiting for invoice link'));
            }, 30000); // 30 second timeout
            
            // Store resolve/reject for later use
            pendingInvoiceRequest.resolve = resolve;
            pendingInvoiceRequest.reject = reject;
            pendingInvoiceRequest.timeout = timeout;
        });
        
        // Send request to bot
        tg.sendData(JSON.stringify(linkRequest));
        
        // Wait for bot response
        const invoiceLink = await pendingInvoiceRequest;
        
        console.log(`[Telegram Stars] Received invoice link: ${invoiceLink}`);
        
        // Open invoice with real link
        tg.openInvoice(invoiceLink, (status) => {
            console.log(`[Telegram Stars] Invoice status: ${status}`);
            handleInvoiceStatus(status, caseType);
        });
        
        return { success: true, message: 'Payment initiated' };
        
    } catch (error) {
        console.error('[Telegram Stars] Payment error:', error);
        currentPaymentContext = null;
        
        if (pendingInvoiceRequest?.timeout) {
            clearTimeout(pendingInvoiceRequest.timeout);
        }
        
        return { 
            success: false, 
            message: error.message || 'Payment failed' 
        };
    }
}

// NEW: Function to handle bot response with invoice link
function handleBotResponse(data) {
    try {
        const response = JSON.parse(data);
        
        if (response.action === 'invoice_link_response' && pendingInvoiceRequest) {
            clearTimeout(pendingInvoiceRequest.timeout);
            
            if (response.success && response.invoice_link) {
                pendingInvoiceRequest.resolve(response.invoice_link);
            } else {
                pendingInvoiceRequest.reject(new Error(response.message || 'Failed to create invoice'));
            }
            
            pendingInvoiceRequest = null;
        }
    } catch (error) {
        console.error('[Telegram Stars] Error handling bot response:', error);
    }
}

// Initialize WebApp with proper event handling
function initializeStarsPaymentListeners() {
    if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Listen for invoice events
        tg.onEvent('invoiceClosed', async (result) => {
            console.log('[Telegram Stars] Invoice closed:', result);
            
            if (result.status === 'paid') {
                await handleInvoiceStatus('paid', currentPaymentContext?.caseType);
            } else if (result.status === 'cancelled') {
                await handleInvoiceStatus('cancelled', currentPaymentContext?.caseType);
            } else if (result.status === 'failed') {
                await handleInvoiceStatus('failed', currentPaymentContext?.caseType);
            }
        });
        
        // Listen for bot responses (if using custom message handling)
        tg.onEvent('mainButtonClicked', () => {
            // Handle main button if needed
        });
        
        tg.ready();
        console.log('[Telegram Stars] Payment system initialized');
    }
}

async function handleInvoiceStatus(status, caseType) {
    console.log(`[Telegram Stars] Processing status: ${status} for ${caseType}`);
    
    if (status === 'paid') {
        if (typeof showToast === 'function') {
            showToast('Payment successful! Opening case...', 'success');
        }
        
        // Process successful payment
        if (typeof processStarsPaymentSuccess === 'function') {
            await processStarsPaymentSuccess(caseType, `stars_${Date.now()}`);
        }
    } else if (status === 'cancelled') {
        if (typeof showToast === 'function') {
            showToast('Payment cancelled', 'info');
        }
    } else if (status === 'failed') {
        if (typeof showToast === 'function') {
            showToast('Payment failed. Please try again.', 'error');
        }
    }
    
    currentPaymentContext = null;
}

// Initialize on load
initializeStarsPaymentListeners(); 