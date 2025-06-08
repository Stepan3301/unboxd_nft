// Telegram Stars Payment Handler - FIXED VERSION

let currentPaymentContext = null;

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
        const requestId = `${userId}_${Date.now()}`;
        
        currentPaymentContext = {
            caseType: caseType,
            starsAmount: starsAmount,
            userId: userId,
            requestId: requestId,
            timestamp: Date.now()
        };
        
        if (typeof showToast === 'function') {
            showToast('Creating payment link...', 'info');
        }
        
        const linkRequest = {
            action: 'get_invoice_link',
            case_type: caseType,
            stars_amount: starsAmount,
            user_id: userId,
            request_id: requestId,
            timestamp: Date.now()
        };
        
        tg.sendData(JSON.stringify(linkRequest));
        
        if (typeof showToast === 'function') {
            showToast('Check the chat for payment button!', 'info');
        }
        
        return { success: true, message: 'Request sent to bot' };
        
    } catch (error) {
        console.error('[Telegram Stars] Payment error:', error);
        currentPaymentContext = null;
        
        if (typeof showToast === 'function') {
            showToast(`Payment error: ${error.message}`, 'error');
        }
        
        return { success: false, message: error.message || 'Payment failed' };
    }
}

function initializeStarsPaymentListeners() {
    if (!window.Telegram?.WebApp) {
        console.error('[Telegram Stars] WebApp not available');
        return;
    }
    
    const tg = window.Telegram.WebApp;
    
    tg.onEvent('invoiceClosed', async (result) => {
        console.log('[Telegram Stars] Invoice closed:', result);
        
        if (!currentPaymentContext) return;
        
        const { caseType } = currentPaymentContext;
        
        switch (result.status) {
            case 'paid':
                await handlePaymentSuccess(caseType, result);
                break;
            case 'cancelled':
                await handlePaymentCancelled(caseType);
                break;
            case 'failed':
                await handlePaymentFailed(caseType, result);
                break;
        }
        
        currentPaymentContext = null;
    });
    
    tg.ready();
    tg.expand();
    console.log('[Telegram Stars] Payment system initialized');
}

async function handlePaymentSuccess(caseType, paymentResult) {
    try {
        if (typeof showToast === 'function') {
            showToast('Payment successful! Opening case...', 'success');
        }
        
        const paymentId = `stars_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        if (typeof processStarsPaymentSuccess === 'function') {
            await processStarsPaymentSuccess(caseType, paymentId);
        }
    } catch (error) {
        console.error('[Telegram Stars] Error processing payment:', error);
        if (typeof showToast === 'function') {
            showToast(`Error: ${error.message}`, 'error');
        }
    }
}

async function handlePaymentCancelled(caseType) {
    if (typeof showToast === 'function') {
        showToast('Payment cancelled', 'info');
    }
}

async function handlePaymentFailed(caseType, paymentResult) {
    if (typeof showToast === 'function') {
        showToast('Payment failed. Please try again.', 'error');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeStarsPaymentListeners);
if (document.readyState !== 'loading') {
    initializeStarsPaymentListeners();
} 