// Utility Functions

// Helper function to select item by probability
// Expects items array and a parallel probabilities array (floats summing to 1)
function selectRandomItemByProbability(items, probabilities) {
    if (!items || !probabilities || items.length !== probabilities.length) {
        console.error('[Utils] Invalid input for selectRandomItemByProbability. Items:', items, 'Probs:', probabilities);
        // Fallback: return the first item or a default error item
        return items && items.length > 0 ? items[0] : { name: 'Error Item', tier: 0, image: 'error.png' }; 
    }

    // Normalize probabilities if they don't sum to 1 (optional, good for robustness)
    const sumOfProbs = probabilities.reduce((acc, prob) => acc + prob, 0);
    if (Math.abs(sumOfProbs - 1.0) > 0.001) { // Allow for small floating point inaccuracies
        console.warn(`[Utils] Probabilities do not sum to 1 (sum: ${sumOfProbs}). Normalizing.`);
        // probabilities = probabilities.map(p => p / sumOfProbs); // Uncomment to normalize
        // For now, we proceed assuming the caller provides correct probabilities for the logic below.
    }

    let random = Math.random();
    let cumulativeProbability = 0;

    for (let i = 0; i < items.length; i++) {
        cumulativeProbability += probabilities[i];
        if (random <= cumulativeProbability) {
            console.log(`[Utils] Selected item by probability: ${items[i].name} (rand: ${random.toFixed(4)}, cumProb: ${cumulativeProbability.toFixed(4)})`);
            return items[i];
        }
    }

    // Fallback in case of issues (e.g., empty arrays or floating point errors if not normalized)
    console.warn('[Utils] Fallback in selectRandomItemByProbability, returning last item. Rand:', random);
    return items[items.length - 1]; 
}

// Toast notification function
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.error('[Utils] Toast container not found. Message:', message);
        alert(`${type.toUpperCase()}: ${message}`); // Fallback to alert
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fas fa-info-circle'; // Default icon
    if (type === 'success') iconClass = 'fas fa-check-circle';
    if (type === 'error') iconClass = 'fas fa-times-circle';
    if (type === 'warning') iconClass = 'fas fa-exclamation-triangle';

    toast.innerHTML = `<i class="${iconClass}"></i> ${message}`;
    
    toastContainer.appendChild(toast);

    // Trigger reflow for animation
    toast.offsetHeight; 

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode === toastContainer) { // Check if still child before removing
                toastContainer.removeChild(toast);
            }
        }, 500); // Wait for fade out animation
    }, 3000); // Display toast for 3 seconds
    console.log(`[Utils] Toast displayed: ${message} (type: ${type})`);
}

// Generate proper UUID v4 format for database compatibility
function generateUUID() {
    try {
        // Attempt to use crypto.randomUUID if available (modern browsers)
        if (crypto && crypto.randomUUID) {
            return crypto.randomUUID();
        }
    } catch (e) {
        console.warn('[Utils] crypto.randomUUID not available, using fallback.');
    }
    
    // Fallback for environments without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Show/Hide Custom Dialog (moved from uiHandlers.js as it's more of a utility)
// This version is for a generic dialog with a title and optional spinner
function showCustomDialog(message, showSpinner = false) {
    const dialog = document.getElementById('custom-dialog');
    const dialogMessage = document.getElementById('dialog-message');
    const dialogSpinner = document.getElementById('dialog-spinner');

    if (dialog && dialogMessage && dialogSpinner) {
        dialogMessage.textContent = message;
        dialogSpinner.style.display = showSpinner ? 'block' : 'none';
        dialog.classList.add('active');
    } else {
        console.error('[Utils] Custom dialog elements not found.');
        // Fallback if dialog elements aren't there (e.g., alert with message)
        if (showSpinner) alert(`Processing: ${message}`); 
        // else alert(message); // Avoid double alerting if used with showToast
    }
}

function hideCustomDialog() {
    const dialog = document.getElementById('custom-dialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
}

console.log('[Utils] utils.js loaded'); 