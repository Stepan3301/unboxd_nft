// Register user in Supabase and get their balance
async function registerUserAndGetBalance() {
    console.log('[UserJS] registerUserAndGetBalance() called.');
    try {
        if (!telegramId) {
            console.error('[UserJS] registerUserAndGetBalance - FAILED: No Telegram ID available.');
            // Consider using showToast or a similar UI notification if available
            alert('Unable to identify user. Please restart the app.');
            return;
        }
        
        console.log('[UserJS] registerUserAndGetBalance - Attempting to register user with ID:', telegramId);
        
        // Uses global userName, userFirstName, userLastName from config.js if available
        const addUserParams = {
            p_telegram_id: telegramId,
            p_username: userName || '',
            p_first_name: userFirstName || '',
            p_last_name: userLastName || ''
        };
        console.log('[UserJS] registerUserAndGetBalance - Params for add_user_with_balance:', addUserParams);
        
        const { data: userData, error: userError } = await supabase.rpc('add_user_with_balance', addUserParams);
        
        if (userError) {
            console.error('[UserJS] registerUserAndGetBalance - ERROR from add_user_with_balance:', userError);
            alert('Error connecting to database (user registration). Please try again later.');
            return;
        }
        console.log('[UserJS] registerUserAndGetBalance - SUCCESS from add_user_with_balance. DB User ID:', userData);
        
        console.log('[UserJS] registerUserAndGetBalance - Attempting to get balance for telegram ID:', telegramId);
        const getBalanceParams = { p_telegram_id: telegramId };
        console.log('[UserJS] registerUserAndGetBalance - Params for get_balance:', getBalanceParams);

        const { data: balanceData, error: balanceError } = await supabase.rpc('get_balance', getBalanceParams);
        
        if (balanceError) {
            console.error('[UserJS] registerUserAndGetBalance - ERROR from get_balance:', balanceError);
            userBalance = 0; // userBalance is global from config.js
        } else {
            userBalance = parseFloat(balanceData) || 0;
            console.log('[UserJS] registerUserAndGetBalance - SUCCESS from get_balance. Raw balanceData:', balanceData);
        }
        
        updateBalanceDisplay(); // Update UI with the new balance
        console.log('User balance retrieved after registration:', userBalance);

    } catch (err) {
        console.error('Error in registerUserAndGetBalance:', err);
        alert('Error connecting to the service. Please try again later.');
    }
}

// Update user balance in Supabase and UI
async function updateUserBalance(amount, description, type) {
    try {
        if (!telegramId) {
            console.error('No Telegram ID available for balance update');
            alert('Unable to identify user. Please restart the app.');
            return false;
        }
        
        console.log('Updating balance:', { telegramId, amount, description, type });
        
        const { data, error } = await supabase.rpc('update_balance', {
            p_telegram_id: telegramId,
            p_amount_change: parseFloat(amount),
            p_description: description,
            p_transaction_type: type
        });
        
        if (error) {
            console.error('Error updating balance in DB:', error);
            alert('Error processing transaction. Please try again.');
            return false;
        }
        
        userBalance = parseFloat(data) || 0; // Update global userBalance
        updateBalanceDisplay(); // Update all UI elements showing balance
        console.log('Balance updated successfully in DB and UI:', userBalance);
        return true;
    } catch (err) {
        console.error('Error in updateUserBalance:', err);
        alert('Error processing transaction. Please try again.');
        return false;
    }
}

// Function to update user data in the profile tab UI
async function updateUserData() {
    try {
        console.log('[User] Updating user data in profile tab for telegramId:', telegramId);
        
        if (!telegramId) {
            console.error('[User] No telegram ID available for updating user data');
            return;
        }
        
        // Set user avatar and username from tg.initDataUnsafe (tg is from config.js)
        const user = tg.initDataUnsafe?.user || {};
        userFirstName = user.first_name || 'User'; // Update global vars from config.js
        userLastName = user.last_name || '';
        userName = user.username ? `@${user.username}` : '';
        userPhotoUrl = user.photo_url || 'https://picsum.photos/seed/profile/300';

        const profileAvatar = document.getElementById('profile-avatar');
        if (profileAvatar && userPhotoUrl) {
            profileAvatar.src = userPhotoUrl;
        }
        const headerAvatar = document.getElementById('user-avatar');
        if (headerAvatar && userPhotoUrl) {
            headerAvatar.innerHTML = `<img src="${userPhotoUrl}" style="width:100%; height:100%; object-fit:cover;">`; 
        } else if (headerAvatar) {
            headerAvatar.textContent = (userFirstName.charAt(0) || 'U').toUpperCase();
        }

        const profileUsername = document.getElementById('profile-username');
        if (profileUsername) {
            profileUsername.textContent = userName || userFirstName;
        }
        
        // Fetch and update balance display (already updates global userBalance)
        await getUserBalance(); 

        // Fetch user stats and update UI (already updates global userStats if needed, and UI)
        await getUserStats();
        
        console.log('[User] updateUserData completed.');
    } catch (err) {
        console.error('[User] Error in updateUserData:', err);
         alert('Error updating user profile. Please try again later.');
    }
}

// Function to get user balance from database and update UI
async function getUserBalance() {
    console.log('[UserJS] getUserBalance() called for telegramId:', telegramId);
    try {
        if (!telegramId) {
            console.error('[UserJS] getUserBalance - FAILED: No telegram ID.');
            return 0; // Return 0 or handle as appropriate
        }
        
        const params = { p_telegram_id: telegramId };
        console.log('[UserJS] getUserBalance - Params for get_balance:', params);
        const { data, error } = await supabase.rpc('get_balance', params);
        
        if (error) {
            console.error('[UserJS] getUserBalance - ERROR from get_balance:', error);
            userBalance = 0; // Default to 0 on error
        } else {
            userBalance = parseFloat(data) || 0;
            console.log('[UserJS] getUserBalance - SUCCESS from get_balance. Raw data:', data, 'Parsed balance:', userBalance);
        }
        updateBalanceDisplay(); // Update all UI elements
        console.log('[User] Current balance from getUserBalance:', userBalance);
        return userBalance;
    } catch (err) {
        console.error('[User] Error in getUserBalance function:', err);
        userBalance = 0; // Default to 0 on error
        updateBalanceDisplay();
        return 0;
    }
}

// Function to update a user stat (primarily for triggering a refresh of stats)
async function updateUserStat(statName, increment) { // increment might be unused if SQL handles it
    try {
        console.log(`[User] Updating user stat: ${statName} by ${increment}`);
        
        if (!telegramId) {
            console.error('[User] No telegram ID available for updating user stat');
            return false;
        }

        // This function might not call an RPC directly if stats are updated by other RPCs (e.g., add_skin_to_inventory)
        // Its main role here is to refresh the stats display.
        // console.warn('[User] updateUserStat in JS is mainly for refreshing stats. Actual stat updates might be via specific SQL functions.');
        // await getUserStats(); // Refresh stats UI after an action that might change them
        // return true; 

        let params = {
            p_telegram_id: telegramId,
            p_nft_count_change: 0,
            p_cases_opened_change: 0,
            p_legendary_count_change: 0
        };

        if (statName === 'nft_count') {
            params.p_nft_count_change = increment;
        } else if (statName === 'cases_opened') {
            params.p_cases_opened_change = increment;
        } else if (statName === 'legendary_count') {
            params.p_legendary_count_change = increment;
        } else {
            console.error('[User] Unknown statName for updateUserStat:', statName);
            return false;
        }

        const { data, error } = await supabase.rpc('update_user_stats', params);

        if (error) {
            console.error('[User] Error calling update_user_stats:', error);
            return false;
        }

        console.log('[User] update_user_stats successful:', data);
        await getUserStats(); // Refresh stats display after successful update
        return data && data.success; // Assuming RPC returns { success: true, ... }

    } catch (err) {
        console.error(`[User] Error in updateUserStat (${statName}):`, err);
        return false;
    }
}

// Function to get user stats from database and update UI
async function getUserStats() {
    console.log('[UserJS] getUserStats() called for telegramId:', telegramId);
    try {
        if (!telegramId) {
            console.error('[UserJS] getUserStats - FAILED: No telegram ID.');
            return null;
        }
        
        const params = { p_telegram_id: telegramId };
        console.log('[UserJS] getUserStats - Params for get_user_stats:', params);
        const { data, error } = await supabase.rpc('get_user_stats', params);
        
        if (error) {
            console.error('[UserJS] getUserStats - ERROR from get_user_stats:', error);
            updateStatsUI(null);
            return null;
        }
        
        console.log('[UserJS] getUserStats - SUCCESS from get_user_stats. Raw data:', data);
        
        let userStatsData = null;
        if (data && data.length > 0) {
            userStatsData = data[0];
        } else if (data && !Array.isArray(data)) {
            userStatsData = data; 
        }

        updateStatsUI(userStatsData); // Update UI with the fetched or default stats
        return userStatsData;

    } catch (err) {
        console.error('[User] Error in getUserStats function:', err);
        updateStatsUI(null); // Set UI to defaults on error
        return null;
    }
}

// UI Update Functions (specific to user data)
function updateBalanceDisplay() {
    const balanceValue = userBalance.toLocaleString();
    
    const headerBalanceElement = document.getElementById('user-balance');
    if (headerBalanceElement) {
        headerBalanceElement.textContent = balanceValue;
    }
    
    const profileBalanceElement = document.getElementById('profile-balance');
    if (profileBalanceElement) {
        profileBalanceElement.textContent = balanceValue;
    }
    
    // Update the full profile wallet display if needed (includes image)
    updateProfileWalletDisplay(); 
}

function updateProfileWalletDisplay() {
    const profileWalletContainer = document.querySelector('.profile-section .wallet');
    if (profileWalletContainer) {
        // Assuming userBalance is already up-to-date globally
        profileWalletContainer.innerHTML = `
            <img src="ucoin2.png" alt="UCoin" style="width: 18px; height: 18px; margin-right: 5px;">
            <span id="profile-balance">${userBalance.toLocaleString()}</span>
        `;
    }
}

function updateStatsUI(statsData) {
    const defaultStats = { nft_count: 0, cases_opened: 0, legendary_count: 0 };
    const currentStats = statsData || defaultStats;

    const profileNftsCount = document.getElementById('profile-nfts-count');
    if (profileNftsCount) {
        profileNftsCount.textContent = currentStats.nft_count || 0;
    }
    
    const profileCasesOpened = document.getElementById('profile-cases-opened');
    if (profileCasesOpened) {
        profileCasesOpened.textContent = currentStats.cases_opened || 0;
    }
    
    const profileLegendaryCount = document.getElementById('profile-legendary-count');
    if (profileLegendaryCount) {
        profileLegendaryCount.textContent = currentStats.legendary_count || 0;
    }
}

console.log('[UserJS] user.js script finished loading.'); 