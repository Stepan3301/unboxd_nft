// Debug script for inventory issues
console.log("=========== INVENTORY DEBUG START ===========");

// Check if telegramId exists
console.log("Telegram ID:", telegramId);

// Debug function to check inventory data
async function debugInventory() {
    try {
        console.log("Checking inventory data...");
        
        if (!telegramId) {
            console.error("ERROR: No Telegram ID available");
            return;
        }
        
        // Test Supabase connection
        console.log("Testing Supabase connection...");
        const { data: testData, error: testError } = await supabase.from('users').select('telegram_id').limit(1);
        
        if (testError) {
            console.error("Supabase connection error:", testError);
            return;
        }
        
        console.log("Supabase connection successful:", testData);
        
        // Test get_user_inventory function
        console.log("Testing get_user_inventory function...");
        const { data: inventoryData, error: inventoryError } = await supabase.rpc('get_user_inventory', {
            p_telegram_id: telegramId
        });
        
        if (inventoryError) {
            console.error("Error getting inventory:", inventoryError);
            console.log("Error details:", inventoryError.message, inventoryError.details, inventoryError.hint);
            return;
        }
        
        if (!inventoryData || inventoryData.length === 0) {
            console.log("Inventory is empty for user:", telegramId);
            return;
        }
        
        console.log("Inventory data retrieved successfully:");
        console.log("Number of items:", inventoryData.length);
        console.log("First item:", inventoryData[0]);
        
        // Check if user-collection element exists
        const userCollection = document.getElementById('user-collection');
        if (!userCollection) {
            console.error("ERROR: user-collection element not found in DOM");
            return;
        }
        
        console.log("user-collection element found in DOM");
        
        // Test creating a simple card
        console.log("Testing card creation...");
        userCollection.innerHTML = '';
        
        const testCard = document.createElement('div');
        testCard.className = 'nft-card';
        testCard.innerHTML = '<div class="nft-info"><div class="nft-title">Test Card</div></div>';
        userCollection.appendChild(testCard);
        
        console.log("Test card created successfully");
        
    } catch (err) {
        console.error("Debug error:", err);
    }
}

// Run debug
debugInventory().then(() => {
    console.log("=========== INVENTORY DEBUG END ===========");
}); 