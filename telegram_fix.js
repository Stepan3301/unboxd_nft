// Function to check and log Telegram API availability
function ensureTelegramApiAvailable() {
    if (typeof window.Telegram === 'undefined' || typeof window.Telegram.WebApp === 'undefined') {
        console.warn("Telegram WebApp API not available - this might be a development environment");
        // Only create mock in development, not in production
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
            console.log("Creating mock Telegram API for development");
            window.Telegram = {
                WebApp: {
                    initData: '',
                    initDataUnsafe: { 
                        user: { 
                            id: 12345678,
                            first_name: 'Test',
                            username: 'testuser' 
                        } 
                    },
                    expand: function() {},
                    showAlert: function(message) {
                        console.log('Alert would show:', message);
                        showCustomDialog(message);
                    },
                    showConfirm: function(message) {
                        console.log('Confirm would show:', message);
                        return true;
                    }
                }
            };
        } else {
            // We're in production but Telegram API is not available
            console.error("CRITICAL: Telegram WebApp API not available in production environment!");
            alert("Connection to Telegram failed. Please restart the app.");
        }
    } else {
        console.log("Real Telegram WebApp API detected - Version:", window.Telegram.WebApp.version);
        console.log("Telegram user data:", window.Telegram.WebApp.initDataUnsafe?.user);
        
        // Check if we have a valid Telegram user ID
        if (!window.Telegram.WebApp.initDataUnsafe?.user?.id) {
            console.error("CRITICAL: No Telegram user ID available!");
            alert("Unable to get your Telegram ID. Please restart the app.");
        } else {
            console.log("Valid Telegram ID found:", window.Telegram.WebApp.initDataUnsafe.user.id);
            
            // Make sure telegramId is set globally
            if (typeof telegramId === 'undefined' || !telegramId) {
                telegramId = window.Telegram.WebApp.initDataUnsafe.user.id;
                console.log("Fixed missing telegramId:", telegramId);
            }
        }
        
        // Log more details about the Telegram connection
        console.log("Is Telegram WebApp fully defined:", 
            typeof window.Telegram !== "undefined" && 
            typeof window.Telegram.WebApp !== "undefined" &&
            typeof window.Telegram.WebApp.initDataUnsafe !== "undefined");
        
        if (window.Telegram && window.Telegram.WebApp) {
            console.log("Telegram WebApp initData:", window.Telegram.WebApp.initData ? "present" : "missing");
            console.log("Telegram WebApp version:", window.Telegram.WebApp.version);
        }
    }
}
