// Unified Activity Log System
// MAX_ACTIVITIES and MAX_STORED_ACTIVITIES are global constants from config.js

function addActivity(type, data) {
    console.log('[Activity] Adding activity:', type, data);
    if (!telegramId) { // telegramId from config.js
        console.warn('[Activity] No telegramId, cannot save activity.');
        return;
    }
    
    const activityKey = `unboxd_activityLog_${telegramId}`;
    let activities = [];
    try {
        const storedActivities = localStorage.getItem(activityKey);
        activities = storedActivities ? JSON.parse(storedActivities) : [];
    } catch (e) {
        console.error('[Activity] Error parsing stored activities:', e);
        activities = []; // Reset if parsing fails
    }

    let text;
    let iconClass;

    // Determine text and icon based on activity type
    switch(type) {
        case 'case_open':
            iconClass = 'fas fa-box-open';
            text = `Opened ${data.caseName || 'a case'} and got ${data.skinName || 'an item'}`;
            break;
        case 'sale':
            iconClass = 'fas fa-coins';
            text = `Sold ${data.skinName || 'an item'} for ${data.price || 0} UCoins`;
            break;
        case 'daily_reward':
            iconClass = 'fas fa-gift';
            text = `Claimed daily reward: ${data.amount || 0} UCoins`;
            break;
        case 'purchase': // Example for future use
            iconClass = 'fas fa-shopping-cart';
            text = `Purchased ${data.itemName || 'item'} for ${data.price || 0} UCoins`;
            break;
        default:
            iconClass = 'fas fa-info-circle';
            text = data.text || 'Activity recorded';
    }
    
    // Add new activity to the beginning of the array
    activities.unshift({
        type,
        text,
        iconClass,
        timestamp: new Date().toISOString()
    });
    
    // Keep only the last MAX_STORED_ACTIVITIES (from config.js)
    if (activities.length > MAX_STORED_ACTIVITIES) {
        activities = activities.slice(0, MAX_STORED_ACTIVITIES);
    }
    
    try {
        localStorage.setItem(activityKey, JSON.stringify(activities));
    } catch (e) {
        console.error('[Activity] Error saving activities to localStorage:', e);
    }
    
    updateActivityLogUI(); // Refresh UI after adding activity
}

function updateActivityLogUI() {
    console.log('[Activity] Updating activity log UI');
    const activityList = document.getElementById('activity-list');
    if (!activityList) {
        console.error('[Activity] activity-list element not found in DOM for UI update.');
        return;
    }
    
    activityList.innerHTML = ''; // Clear existing activities
    
    if (!telegramId) { // telegramId from config.js
        console.warn('[Activity] No telegramId, cannot load activities for UI.');
        showEmptyActivityMessage(activityList, "Activity will appear here once you log in.");
        return;
    }

    const activityKey = `unboxd_activityLog_${telegramId}`;
    let activities = [];
    try {
        const storedActivities = localStorage.getItem(activityKey);
        activities = storedActivities ? JSON.parse(storedActivities) : [];
    } catch (e) {
        console.error('[Activity] Error parsing stored activities for UI update:', e);
    }
    
    if (activities.length === 0) {
        showEmptyActivityMessage(activityList, "Your recent activity will appear here.");
        return;
    }
    
    // Display only the last MAX_ACTIVITIES (from config.js)
    const recentActivities = activities.slice(0, MAX_ACTIVITIES);
    
    recentActivities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const timestamp = new Date(activity.timestamp);
        const timeString = timestamp.toLocaleString(undefined, { 
            hour: 'numeric', 
            minute: 'numeric', 
            day: 'numeric', 
            month: 'short' 
        });

        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="${activity.iconClass || 'fas fa-history'}"></i>
            </div>
            <div class="activity-details">
                <div class="activity-title">${activity.text}</div>
                <div class="activity-time">${timeString}</div>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

// Helper to show empty message in activity log
function showEmptyActivityMessage(activityListElement, message) {
    if (!activityListElement) return;
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-activity-message';
    emptyMessage.innerHTML = `<i class="fas fa-history"></i><p>${message}</p>`;
    activityListElement.appendChild(emptyMessage);
}

console.log('[Activity Log] activityLog.js loaded'); 