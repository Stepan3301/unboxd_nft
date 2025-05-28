#!/bin/bash

# Create a backup
cp webapp.html webapp.html.telegram-fix

# Fix the duplicate addToInventory function
sed -i '' '2657,2679d' webapp.html

# Fix the missing closing brace for the click event handler
sed -i '' '2653i\
                // Show corresponding tab content\
                const tabId = btn.getAttribute("data-tab");\
                document.querySelectorAll(".tab-content").forEach(tab => {\
                    tab.classList.remove("active");\
                });\
                \
                const targetTab = document.getElementById(tabId);\
                if (targetTab) targetTab.classList.add("active");\
                \
                // Update rarity navigation visibility based on tab\
                updateRarityNavVisibility(tabId);\
                \
                // If profile tab is selected, update user data\
                if (tabId === "profile-tab") {\
                    updateUserData();\
                }\
                \
                // If inventory tab is selected, refresh the inventory\
                if (tabId === "inventory-tab") {\
                    await getUserInventory();\
                }\
            });\
' webapp.html

# Fix the ensureTelegramApiAvailable function to avoid overriding real Telegram data
sed -i '' '2694,2721c\
        // Function to create Telegram user object if testing outside Telegram\
        function ensureTelegramApiAvailable() {\
            if (typeof window.Telegram === "undefined" || typeof window.Telegram.WebApp === "undefined") {\
                console.log("Creating mock Telegram API for testing");\
                // Create mock Telegram object for testing\
                window.Telegram = {\
                    WebApp: {\
                        initData: "",\
                        initDataUnsafe: { \
                            user: { \
                                id: 12345678,\
                                first_name: "Test",\
                                username: "testuser" \
                            } \
                        },\
                        expand: function() {},\
                        showAlert: function(message) {\
                            console.log("Alert would show:", message);\
                            showCustomDialog(message);\
                        },\
                        showConfirm: function(message) {\
                            console.log("Confirm would show:", message);\
                            return true;\
                        }\
                    }\
                };\
            } else {\
                console.log("Real Telegram WebApp API detected");\
                console.log("Telegram user data:", window.Telegram.WebApp.initDataUnsafe?.user);\
            }\
        }\
        \
        // Call this function at app initialization\
        ensureTelegramApiAvailable();\
' webapp.html

# Add additional debug logging to identify connection issues
sed -i '' '1839a\
        // Log extended debug info\
        console.log("Detailed user data:", {\
            telegramId: telegramId,\
            firstName: userFirstName,\
            lastName: userLastName,\
            userName: userName,\
            photoUrl: userPhotoUrl\
        });\
' webapp.html

# Make sure the Telegram initialization happens before accessing user properties
sed -i '' '1829,1843c\
        // Initialize Telegram WebApp\
        const tg = window.Telegram.WebApp;\
        tg.expand();\
        \
        // Initialize Supabase client - FIXED INITIALIZATION\
        const SUPABASE_URL = "https://vjlsmlkwoiwpercoljfo.supabase.co";\
        const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbHNtbGt3b2l3cGVyY29samZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMzA2MDAsImV4cCI6MjA2MzYwNjYwMH0.47EOGnJIl7XfTqJOW8PjHlpAOYuj27sd-u9CdteoDR0";\
        // Fix: proper initialization of Supabase client\
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);\
        \
        // Create a function to initialize user data\
        function initUserData() {\
            // User data from Telegram\
            const user = tg.initDataUnsafe?.user || {};\
            let userFirstName = user.first_name || "User";\
            let userLastName = user.last_name || "";\
            let userName = user.username ? `@${user.username}` : "";\
            let userPhotoUrl = user.photo_url || "https://picsum.photos/seed/profile/300";\
            let telegramId = user.id;\
            let userBalance = 0;\
            \
            // Debug: Log Telegram user data\
            console.log("Telegram user data:", user);\
            console.log("Telegram ID:", telegramId);\
            \
            // Log extended debug info\
            console.log("Detailed user data:", {\
                telegramId: telegramId,\
                firstName: userFirstName,\
                lastName: userLastName,\
                userName: userName,\
                photoUrl: userPhotoUrl\
            });\
            \
            return {\
                userFirstName,\
                userLastName,\
                userName,\
                userPhotoUrl,\
                telegramId,\
                userBalance\
            };\
        }\
        \
        // Initialize user data\
        const {\
            userFirstName,\
            userLastName,\
            userName,\
            userPhotoUrl,\
            telegramId,\
            userBalance: initialUserBalance\
        } = initUserData();\
        \
        // Declare userBalance as a variable that can be updated\
        let userBalance = initialUserBalance;\
' webapp.html

# Fix the closing braces at the end of the file
cat > closing_fix.txt << 'EOF'
// Add initialization check to make sure we have valid Telegram data
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded");
    if (!telegramId) {
        console.warn("No Telegram ID available - app may not function correctly");
        showCustomDialog("Unable to connect to Telegram. Please restart the app.");
    } else {
        console.log("Telegram ID found:", telegramId);
    }
});
    </script>
</body>
</html>
EOF

# Replace the entire end of the file
sed -i '' -e '/document.getElementById.*roulette-sell.*addEventListener.*click/,$ d' webapp.html

# Add the fixed closing content
cat closing_fix.txt >> webapp.html

# Clean up
rm closing_fix.txt 