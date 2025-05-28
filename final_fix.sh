#!/bin/bash

echo "Creating a clean version of webapp.html with fixes"

# Copy the backup
cp webapp.html.backup webapp.html.fixed

# Modify the ensureTelegramApiAvailable function to be more robust
cat > telegram_fix.js << 'EOF'
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
EOF

# Replace the ensureTelegramApiAvailable function in the fixed file
sed -i '' '/function ensureTelegramApiAvailable/,/ensureTelegramApiAvailable();/d' webapp.html.fixed

# Add the updated function in the correct location
sed -i '' '/let telegramId = user.id;/a\\
        // Log more details about the Telegram connection\\
        console.log("Is Telegram WebApp defined:", typeof window.Telegram !== "undefined" && typeof window.Telegram.WebApp !== "undefined");\\
        if (window.Telegram && window.Telegram.WebApp) {\\
            console.log("Telegram WebApp initData:", window.Telegram.WebApp.initData ? "present" : "missing");\\
            console.log("Telegram WebApp version:", window.Telegram.WebApp.version);\\
        }\\
' webapp.html.fixed

# Add additional check at the end of initialization
sed -i '' '/updateRarityNavVisibility.*cases-tab/a\\
        // Final check if we have Telegram user ID\\
        if (!telegramId) {\\
            console.error("No Telegram ID available after initialization");\\
            showCustomDialog("Unable to connect to Telegram. Please restart the app.");\\
        } else {\\
            console.log("Telegram connection validated with ID:", telegramId);\\
        }\\
' webapp.html.fixed

# Replace the original file
mv webapp.html.fixed webapp.html

echo "Fixed webapp.html created" 