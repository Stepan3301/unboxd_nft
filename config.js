// CHANGES by Cursor 2025-01-28: Added missing helper function stubs, unified case naming, added global exports

console.log('[Config] Starting config.js load...');

// Supabase configuration
const SUPABASE_URL = 'https://vjlsmlkwoiwpercoljfo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbHNtbGt3b2l3cGVyY29samZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMzA2MDAsImV4cCI6MjA2MzYwNjYwMH0.47EOGnJIl7XfTqJOW8PjHlpAOYuj27sd-u9CdteoDR0';
// Global Variables (Review Scope as we modularize)
let userBalance = 0;
let dailyStreak = 0; // This might be part of dailyRewards.js state
let telegramId = null;

// Safety net: ensure telegram fix is available after variable declarations
if (typeof ensureTelegramApiAvailable === 'function') {
    console.log('[Config] Early telegram fix call after variable declarations...');
    ensureTelegramApiAvailable();
}
let userName = '';
let userFirstName = '';
let userLastName = '';
let userPhotoUrl = '';
let currentResultSkin = null; // This should be managed by RouletteStateManager in roulette.js

// Daily rewards constants (Consider moving to dailyRewards.js if only used there)
const REWARD_AMOUNT = 1000;
let countdownInterval = null; // State for daily rewards timer

// -----------------------------------------------------------------------------
// --- PRICING AND CASE CONFIGURATION (SINGLE SOURCE OF TRUTH) ---
// -----------------------------------------------------------------------------

// Base prices for opening each case type. Used to calculate final cost.
const CASE_PRICES = {
    darkaura: 100,
    labubu: 50,
    girlish: 5000,
    newmoney: 10000,
    maincharacter: 7000,
    coldblooded: 3500
};

// Sell prices for each tier of skin. Used for inventory management.
const skinPrices = {
    1: 20,   // Common
    2: 50,   // Rare
    3: 120,  // Epic
    4: 300,  // Legendary
    5: 750,  // Mythic
    6: 10000 // Divine
};

// Expose prices to global window object so other scripts can access them
window.CASE_PRICES = CASE_PRICES;
window.skinPrices = skinPrices;

// -----------------------------------------------------------------------------
// --- CASE ITEM DEFINITIONS ---
// All items for all cases are defined here to ensure they are loaded
// before any script that might use them.
// -----------------------------------------------------------------------------

window.darkAuraSkins = [
    { name: 'Haunted Desk Calendar', image: 'cleaned-deskcalendar-280571.json', type: 'lottie', tier: 1, price: skinPrices[1] },
    { name: 'Mad Pumpkin Spirit', image: 'cleaned-madpumpkin-7551.json', type: 'lottie', tier: 2, price: skinPrices[2] },
    { name: 'Bag of Holding', image: 'darkaura-cleaned-lootbag-7239.json', type: 'lottie', tier: 3, price: skinPrices[3] },
    { name: 'Electric Skull', image: 'cleaned-electricskull-8221.json', type: 'lottie', tier: 3, price: skinPrices[3] },
    { name: 'Mystic Crystal Ball', image: 'darkaura-cleaned-crystalball-9027.json', type: 'lottie', tier: 3, price: skinPrices[3] },
    { name: 'Cursed Voodoo Doll', image: 'cleaned-voodoodoll-7970.json', type: 'lottie', tier: 4, price: skinPrices[4] },
    { name: 'Bewitched Ginger Cookie', image: 'cleaned-gingercookie-20477.json', type: 'lottie', tier: 4, price: skinPrices[4] },
    { name: 'Cursed Genie Lamp', image: 'darkaura-cleaned-genielamp-4594.json', type: 'lottie', tier: 4, price: skinPrices[4] },
    { name: 'Mystical Signet Ring', image: 'cleaned-signetring-14328.json', type: 'lottie', tier: 5, price: skinPrices[5] },
    { name: 'Eternal Shadow Rose', image: 'darkaura-cleaned-eternalrose-7069.json', type: 'lottie', tier: 5, price: skinPrices[5] },
    { name: 'Mini Oscar Phantom', image: 'cleaned-minioscar-1983.json', type: 'lottie', tier: 6, price: skinPrices[6] },
    { name: 'Scared Cat Obelisk', image: 'cleaned-scaredcat-18595.json', type: 'lottie', tier: 6, price: skinPrices[6] }
];

// Unified naming: darkAuraItems for consistency with roulette logic
window.darkAuraItems = window.darkAuraSkins;

window.labubuItems = [
    { name: 'Skeleton Labubu', tier: 1, image: 'SkeletonLabubu.png', type: 'image', price: skinPrices[1] },
    { name: 'Candy Labubu', tier: 1, image: 'CandyLabubu.png', type: 'image', price: skinPrices[1] },
    { name: 'Zombie Labubu', tier: 2, image: 'ZombieLabubu.png', type: 'image', price: skinPrices[2] },
    { name: 'New DeepSea Labubu', tier: 2, image: 'NewDeepSeaLabubu.png', type: 'image', price: skinPrices[2] },
    { name: 'Alien Labubu', tier: 3, image: 'AlienLabubu.png', type: 'image', price: skinPrices[3] },
    { name: 'Circus Labubu', tier: 3, image: 'CircusLabubu.png', type: 'image', price: skinPrices[3] },
    { name: 'Grass Labubu', tier: 4, image: 'GrassLabubu.png', type: 'image', price: skinPrices[4] },
    { name: 'Grinch Labubu', tier: 4, image: 'GrinchLabubu.png', type: 'image', price: skinPrices[4] },
    { name: 'Volcanic Labubu', tier: 5, image: 'VolcanicLabubu.png', type: 'image', price: skinPrices[5] },
    { name: 'Demon Labubu', tier: 3, image: 'demon-labubu.png', type: 'image', price: skinPrices[3] },
    { name: 'Ghost Labubu', tier: 3, image: 'ghost-labubu.png', type: 'image', price: skinPrices[3] },
    { name: 'Cyber Labubu', tier: 4, image: 'cyber-labubu.png', type: 'image', price: skinPrices[4] },
    { name: 'Ice Crystal Labubu', tier: 4, image: 'ice-crystal-labubu.png', type: 'image', price: skinPrices[4] },
    { name: 'Venom Labubu', tier: 5, image: 'venom-labubu.png', type: 'image', price: skinPrices[5] },
    { name: 'Samurai Labubu', tier: 5, image: 'ronin-labubu.png', type: 'image', price: skinPrices[5] },
    { name: 'Glitch Labubu', tier: 5, image: 'glitch-labubu.png', type: 'image', price: skinPrices[5] },
    { name: 'Golden Labubu', tier: 6, image: 'golden-labubu.png', type: 'image', price: skinPrices[6] }
];

window.girlishItems = [
    { name: 'Star Notepad', image: 'girlish-cleaned-starnotepad-34945.json', type: 'lottie', tier: 1, price: skinPrices[1] },
    { name: 'Ion Gem', image: 'girlish-cleaned-iongem-2891.json', type: 'lottie', tier: 1, price: skinPrices[1] },
    { name: 'Lollipop Pop', image: 'girlish-cleaned-lolpop-271620.json', type: 'lottie', tier: 2, price: skinPrices[2] },
    { name: 'Homemade Cake', image: 'girlish-cleaned-homemadecake-20291.json', type: 'lottie', tier: 2, price: skinPrices[2] },
    { name: 'Neko Helmet', image: 'girlish-cleaned-nekohelmet-402.json', type: 'lottie', tier: 3, price: skinPrices[3] },
    { name: 'Cuddly Toybear', image: 'girlish-cleaned-toybear-31469.json', type: 'lottie', tier: 3, price: skinPrices[3] },
    { name: 'Plush Pepe', image: 'girlish-cleaned-plushpepe-2707.json', type: 'lottie', tier: 3, price: skinPrices[3] },
    { name: 'Astral Shard', image: 'girlish-cleaned-astralshard-3087.json', type: 'lottie', tier: 4, price: skinPrices[4] },
    { name: 'Winter Wreath', image: 'girlish-cleaned-winterwreath-9594.json', type: 'lottie', tier: 4, price: skinPrices[4] },
    { name: 'Eternal Candle', image: 'girlish-cleaned-eternalcandle-17246.json', type: 'lottie', tier: 5, price: skinPrices[5] },
    { name: 'Pastel Lootbag', image: 'girlish-cleaned-lootbag-7825.json', type: 'lottie', tier: 5, price: skinPrices[5] }
];

window.newMoneyItems = [
    { name: 'Golden Lootbag', image: 'moneyrain-cleaned-lootbag-4244.json', type: 'lottie', tier: 1, price: skinPrices[1] },
    { name: 'Vintage Record Player', image: 'moneyrain-cleaned-recordplayer-5940.json', type: 'lottie', tier: 1, price: skinPrices[1] },
    { name: 'Diamond Star Notepad', image: 'moneyrain-cleaned-starnotepad-32502.json', type: 'lottie', tier: 2, price: skinPrices[2] },
    { name: 'Luxury Swiss Watch', image: 'moneyrain-cleaned-swisswatch-3145.json', type: 'lottie', tier: 2, price: skinPrices[2] },
    { name: 'Retro Tamagadget', image: 'moneyrain-cleaned-tamagadget-1168.json', type: 'lottie', tier: 3, price: skinPrices[3] },
    { name: 'Classic Top Hat', image: 'moneyrain-cleaned-tophat-32663.json', type: 'lottie', tier: 3, price: skinPrices[3] },
    { name: 'Golden Toy Bear', image: 'moneyrain-cleaned-toybear-35493.json', type: 'lottie', tier: 4, price: skinPrices[4] },
    { name: 'Premium Vintage Cigar', image: 'moneyrain-cleaned-vintagecigar-12246.json', type: 'lottie', tier: 4, price: skinPrices[4] },
    { name: 'Gilded Winter Wreath', image: 'moneyrain-cleaned-winterwreath-31568.json', type: 'lottie', tier: 5, price: skinPrices[5] }
];

window.mainCharacterItems = [
    { name: 'Dark Delight Lollipop', image: 'MainCharacterCaseLotties/cleaned-lolpop-darkdelight.json', type: 'lottie', tier: 1, price: skinPrices[1] },
    { name: 'Noir Perfume Bottle', image: 'MainCharacterCaseLotties/cleaned-perfumebottle-noir.json', type: 'lottie', tier: 1, price: skinPrices[1] },
    { name: 'Dark Knight Toy Bear', image: 'MainCharacterCaseLotties/cleaned-toybear-darkknight.json', type: 'lottie', tier: 2, price: skinPrices[2] },
    { name: 'Marble Plush Pepe', image: 'MainCharacterCaseLotties/cleaned-plushpepe-marble.json', type: 'lottie', tier: 2, price: skinPrices[2] },
    { name: 'Full Tint Swiss Watch', image: 'MainCharacterCaseLotties/cleaned-swisswatch-fulltint.json', type: 'lottie', tier: 3, price: skinPrices[3] },
    { name: 'Barbed Astral Shard', image: 'MainCharacterCaseLotties/cleaned-astralshard-barbed.json', type: 'lottie', tier: 3, price: skinPrices[3] },
    { name: 'Grey Shark Neko Helmet', image: 'MainCharacterCaseLotties/cleaned-nekohelmet-greyshark.json', type: 'lottie', tier: 4, price: skinPrices[4] },
    { name: 'Spades Signet Ring', image: 'MainCharacterCaseLotties/cleaned-signetring-spades.json', type: 'lottie', tier: 4, price: skinPrices[4] },
    { name: 'Jevil Jelly Bunny', image: 'MainCharacterCaseLotties/cleaned-jellybunny-jevil.json', type: 'lottie', tier: 5, price: skinPrices[5] },
    { name: 'Oil Baron Vintage Cigar', image: 'MainCharacterCaseLotties/cleaned-vintagecigar-oilbaron.json', type: 'lottie', tier: 5, price: skinPrices[5] },
    { name: 'Retro Silver Record Player', image: 'MainCharacterCaseLotties/cleaned-recordplayer-retrosilver.json', type: 'lottie', tier: 6, price: skinPrices[6] },
    { name: 'Red Wedding Diamond Ring', image: 'MainCharacterCaseLotties/cleaned-diamondring-redwedding.json', type: 'lottie', tier: 6, price: skinPrices[6] },
    { name: 'Falcon Durov\'s Cap', image: 'MainCharacterCaseLotties/cleaned-durovscap-falcon.json', type: 'lottie', tier: 6, price: skinPrices[6] }
];

window.coldBloodedItems = [
    { name: 'Ice Frog Kiss', image: 'ColdBloodedCaseLotties/cleaned-kissedfrog-icefrog.json', type: 'lottie', tier: 1, price: skinPrices[1] },
    { name: 'Cyan Sizzle Sparkler', image: 'ColdBloodedCaseLotties/cleaned-partysparkler-cyansizzle.json', type: 'lottie', tier: 1, price: skinPrices[1] },
    { name: 'Frozen Plush Pepe', image: 'ColdBloodedCaseLotties/cleaned-plushpepe-frozen.json', type: 'lottie', tier: 2, price: skinPrices[2] },
    { name: 'Thin Ice Santa Hat', image: 'ColdBloodedCaseLotties/cleaned-santahat-thinice.json', type: 'lottie', tier: 2, price: skinPrices[2] },
    { name: 'Deep Freeze Easter Egg', image: 'ColdBloodedCaseLotties/cleaned-easteregg-deepfreeze.json', type: 'lottie', tier: 3, price: skinPrices[3] },
    { name: 'Ice Chime Jingle Bells', image: 'ColdBloodedCaseLotties/cleaned-jinglebells-icechime.json', type: 'lottie', tier: 3, price: skinPrices[3] },
    { name: 'Snowman Toy Bear', image: 'ColdBloodedCaseLotties/cleaned-toybear-snowman.json', type: 'lottie', tier: 3, price: skinPrices[3] },
    { name: 'Arctite Astral Shard', image: 'ColdBloodedCaseLotties/cleaned-astralshard-arctite.json', type: 'lottie', tier: 4, price: skinPrices[4] },
    { name: 'Ice Block Voodoo Doll', image: 'ColdBloodedCaseLotties/cleaned-voodoodoll-iceblock.json', type: 'lottie', tier: 4, price: skinPrices[4] },
    { name: 'Frostbite Ginger Cookie', image: 'ColdBloodedCaseLotties/cleaned-gingercookie-frostbite.json', type: 'lottie', tier: 4, price: skinPrices[4] },
    { name: 'Deep Freeze Mini Oscar', image: 'ColdBloodedCaseLotties/cleaned-minioscar-deepfreeze.json', type: 'lottie', tier: 5, price: skinPrices[5] },
    { name: 'Icebound Sakura Flower', image: 'ColdBloodedCaseLotties/cleaned-sakuraflower-icebound.json', type: 'lottie', tier: 5, price: skinPrices[5] },
    { name: 'Over Ice Spiced Wine', image: 'ColdBloodedCaseLotties/cleaned-spicedwine-overice.json', type: 'lottie', tier: 5, price: skinPrices[5] },
    { name: 'Ice Cold Vintage Cigar', image: 'ColdBloodedCaseLotties/cleaned-vintagecigar-icecold.json', type: 'lottie', tier: 5, price: skinPrices[5] },
    { name: 'Frost Band Diamond Ring', image: 'ColdBloodedCaseLotties/cleaned-diamondring-frostband.json', type: 'lottie', tier: 6, price: skinPrices[6] },
    { name: 'Cold Brew Hex Pot', image: 'ColdBloodedCaseLotties/cleaned-hexpot-coldbrew.json', type: 'lottie', tier: 6, price: skinPrices[6] },
    { name: 'Sub Zero Flying Broom', image: 'ColdBloodedCaseLotties/cleaned-flyingbroom-subzero.json', type: 'lottie', tier: 6, price: skinPrices[6] },
    { name: 'Winter Record Player', image: 'ColdBloodedCaseLotties/cleaned-recordplayer-winter.json', type: 'lottie', tier: 6, price: skinPrices[6] }
];

// Case opening tracking (Consider moving to caseOpening.js)
let caseOpeningsCount = 0;
let guaranteedTier3NextOpening = false;

// Activity log constants (Consider moving to activityLog.js)
const MAX_ACTIVITIES = 5;
const MAX_STORED_ACTIVITIES = 20;

// TON Connect - instance will be here, initialization in tonConnect.js
let tonConnectUI = null;

// -----------------------------------------------------------------------------
// --- HELPER FUNCTION STUBS ---
// All missing helper functions are implemented as stubs with TODO comments
// These need real implementation but allow the app to run without errors
// -----------------------------------------------------------------------------

// TODO: Real implementation needed - currently using functions from existing files
if (typeof updateUserBalance === 'undefined') {
    window.updateUserBalance = function(delta, description, tag) {
        console.warn('[Config STUB] updateUserBalance called with:', delta, description, tag);
        // TODO: Implement or ensure user.js is loaded
        return Promise.resolve(false);
    };
}

if (typeof addItemToInventoryDB === 'undefined') {
    window.addItemToInventoryDB = function(item) {
        console.warn('[Config STUB] addItemToInventoryDB called with:', item);
        // TODO: Implement or ensure inventory.js is loaded
        return Promise.resolve({ success: false, message: 'Stub implementation' });
    };
}

if (typeof selectRandomItemByProbability === 'undefined') {
    window.selectRandomItemByProbability = function(items, probabilities) {
        console.warn('[Config STUB] selectRandomItemByProbability called');
        // TODO: Implement or ensure utils.js is loaded
        return items && items.length > 0 ? items[0] : null;
    };
}

if (typeof generateUUID === 'undefined') {
    window.generateUUID = function() {
        console.warn('[Config STUB] generateUUID called');
        // TODO: Implement or ensure utils.js is loaded
        return 'stub-uuid-' + Date.now();
    };
}

if (typeof showCustomDialog === 'undefined') {
    window.showCustomDialog = function(message, withLoader) {
        console.warn('[Config STUB] showCustomDialog called with:', message, withLoader);
        // TODO: Implement or ensure utils.js is loaded
        alert(message);
    };
}

if (typeof hideCustomDialog === 'undefined') {
    window.hideCustomDialog = function() {
        console.warn('[Config STUB] hideCustomDialog called');
        // TODO: Implement or ensure utils.js is loaded
    };
}

if (typeof showToast === 'undefined') {
    window.showToast = function(message, type) {
        console.warn('[Config STUB] showToast called with:', message, type);
        // TODO: Implement or ensure utils.js is loaded
        console.log(`TOAST [${type}]: ${message}`);
    };
}

if (typeof updateBalanceDisplay === 'undefined') {
    window.updateBalanceDisplay = function() {
        console.warn('[Config STUB] updateBalanceDisplay called');
        // TODO: Implement or ensure user.js is loaded
    };
}

if (typeof addActivity === 'undefined') {
    window.addActivity = function(event, data) {
        console.warn('[Config STUB] addActivity called with:', event, data);
        // TODO: Implement or ensure activityLog.js is loaded
    };
}

if (typeof updateUserStat === 'undefined') {
    window.updateUserStat = function(stat, count) {
        console.warn('[Config STUB] updateUserStat called with:', stat, count);
        // TODO: Implement or ensure user.js is loaded
        return Promise.resolve(false);
    };
}

if (typeof sellNFT === 'undefined') {
    window.sellNFT = function(name, tier, id) {
        console.warn('[Config STUB] sellNFT called with:', name, tier, id);
        // TODO: Implement or ensure inventory.js is loaded
        return Promise.resolve(false);
    };
}

// Initialize Supabase Client (Make sure Supabase SDK is loaded before this file)
let supabaseClient = null;
let supabase = null; // Alias for convenience

if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabase = supabaseClient;
    window.supabase = supabase; // Ensure global access
    console.log('[Config] Supabase client initialized.');
} else {
    console.error('[Config] Supabase SDK not found. Supabase features will be unavailable.');
}

// Initialize Telegram WebApp (Make sure Telegram SDK is loaded before this)
let tg = null;
if (typeof window.Telegram !== 'undefined' && typeof window.Telegram.WebApp !== 'undefined') {
    tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();
    console.log('[Config] Telegram WebApp initialized.');
    
    // Call telegram fix function if available to ensure proper initialization
    if (typeof ensureTelegramApiAvailable === 'function') {
        console.log('[Config] Calling ensureTelegramApiAvailable...');
        ensureTelegramApiAvailable();
    }
} else {
    console.error('[Config] Telegram WebApp SDK not found. Attempting fix...');
    
    // Try to fix telegram initialization if fix function is available
    if (typeof ensureTelegramApiAvailable === 'function') {
        console.log('[Config] Calling ensureTelegramApiAvailable to fix Telegram initialization...');
        ensureTelegramApiAvailable();
        
        // Try again after fix
        if (typeof window.Telegram !== 'undefined' && typeof window.Telegram.WebApp !== 'undefined') {
            tg = window.Telegram.WebApp;
            tg.expand();
            tg.ready();
            console.log('[Config] Telegram WebApp initialized after fix.');
        }
    }
}

console.log('[Config] config.js loaded'); 