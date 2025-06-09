console.log('[Config] Starting config.js load...');

// Safety net: ensure telegram fix is available as early as possible
if (typeof ensureTelegramApiAvailable === 'function') {
    console.log('[Config] Early telegram fix call...');
    ensureTelegramApiAvailable();
}
// Supabase configuration
const SUPABASE_URL = 'https://vjlsmlkwoiwpercoljfo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbHNtbGt3b2l3cGVyY29samZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMzA2MDAsImV4cCI6MjA2MzYwNjYwMH0.47EOGnJIl7XfTqJOW8PjHlpAOYuj27sd-u9CdteoDR0';
// Global Variables (Review Scope as we modularize)
let userBalance = 0;
let dailyStreak = 0; // This might be part of dailyRewards.js state
let telegramId = null;
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
    newmoney: 10000
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
    { name: 'Haunted Desk Calendar', lottie: 'cleaned-deskcalendar-280571.json', tier: 1, price: skinPrices[1] },
    { name: 'Mad Pumpkin Spirit', lottie: 'cleaned-madpumpkin-7551.json', tier: 2, price: skinPrices[2] },
    { name: 'Bag of Holding', lottie: 'darkaura-cleaned-lootbag-7239.json', tier: 3, price: skinPrices[3] },
    { name: 'Electric Skull', lottie: 'cleaned-electricskull-8221.json', tier: 3, price: skinPrices[3] },
    { name: 'Mystic Crystal Ball', lottie: 'darkaura-cleaned-crystalball-9027.json', tier: 3, price: skinPrices[3] },
    { name: 'Cursed Voodoo Doll', lottie: 'cleaned-voodoodoll-7970.json', tier: 4, price: skinPrices[4] },
    { name: 'Bewitched Ginger Cookie', lottie: 'cleaned-gingercookie-20477.json', tier: 4, price: skinPrices[4] },
    { name: 'Cursed Genie Lamp', lottie: 'darkaura-cleaned-genielamp-4594.json', tier: 4, price: skinPrices[4] },
    { name: 'Mystical Signet Ring', lottie: 'cleaned-signetring-14328.json', tier: 5, price: skinPrices[5] },
    { name: 'Eternal Shadow Rose', lottie: 'darkaura-cleaned-eternalrose-7069.json', tier: 5, price: skinPrices[5] },
    { name: 'Mini Oscar Phantom', lottie: 'cleaned-minioscar-1983.json', tier: 6, price: skinPrices[6] },
    { name: 'Scared Cat Obelisk', lottie: 'cleaned-scaredcat-18595.json', tier: 6, price: skinPrices[6] }
];

window.labubuItems = [
    { name: 'Skeleton Labubu', tier: 1, image: 'SkeletonLabubu.png', price: skinPrices[1] },
    { name: 'Candy Labubu', tier: 1, image: 'CandyLabubu.png', price: skinPrices[1] },
    { name: 'Zombie Labubu', tier: 2, image: 'ZombieLabubu.png', price: skinPrices[2] },
    { name: 'New DeepSea Labubu', tier: 2, image: 'NewDeepSeaLabubu.png', price: skinPrices[2] },
    { name: 'Alien Labubu', tier: 3, image: 'AlienLabubu.png', price: skinPrices[3] },
    { name: 'Circus Labubu', tier: 3, image: 'CircusLabubu.png', price: skinPrices[3] },
    { name: 'Grass Labubu', tier: 4, image: 'GrassLabubu.png', price: skinPrices[4] },
    { name: 'Grinch Labubu', tier: 4, image: 'GrinchLabubu.png', price: skinPrices[4] },
    { name: 'Volcanic Labubu', tier: 5, image: 'VolcanicLabubu.png', price: skinPrices[5] },
    { name: 'Demon Labubu', tier: 3, image: 'demon-labubu.png', price: skinPrices[3] },
    { name: 'Ghost Labubu', tier: 3, image: 'ghost-labubu.png', price: skinPrices[3] },
    { name: 'Cyber Labubu', tier: 4, image: 'cyber-labubu.png', price: skinPrices[4] },
    { name: 'Ice Crystal Labubu', tier: 4, image: 'ice-crystal-labubu.png', price: skinPrices[4] },
    { name: 'Venom Labubu', tier: 5, image: 'venom-labubu.png', price: skinPrices[5] },
    { name: 'Samurai Labubu', tier: 5, image: 'ronin-labubu.png', price: skinPrices[5] },
    { name: 'Glitch Labubu', tier: 5, image: 'glitch-labubu.png', price: skinPrices[5] },
    { name: 'Golden Labubu', tier: 6, image: 'golden-labubu.png', price: skinPrices[6] }
];

window.girlishItems = [
    { name: 'Star Notepad', lottie: 'girlish-cleaned-starnotepad-34945.json', tier: 1, price: skinPrices[1] },
    { name: 'Ion Gem', lottie: 'girlish-cleaned-iongem-2891.json', tier: 1, price: skinPrices[1] },
    { name: 'Lollipop Pop', lottie: 'girlish-cleaned-lolpop-271620.json', tier: 2, price: skinPrices[2] },
    { name: 'Homemade Cake', lottie: 'girlish-cleaned-homemadecake-20291.json', tier: 2, price: skinPrices[2] },
    { name: 'Neko Helmet', lottie: 'girlish-cleaned-nekohelmet-402.json', tier: 3, price: skinPrices[3] },
    { name: 'Cuddly Toybear', lottie: 'girlish-cleaned-toybear-31469.json', tier: 3, price: skinPrices[3] },
    { name: 'Plush Pepe', lottie: 'girlish-cleaned-plushpepe-2707.json', tier: 3, price: skinPrices[3] },
    { name: 'Astral Shard', lottie: 'girlish-cleaned-astralshard-3087.json', tier: 4, price: skinPrices[4] },
    { name: 'Winter Wreath', lottie: 'girlish-cleaned-winterwreath-9594.json', tier: 4, price: skinPrices[4] },
    { name: 'Eternal Candle', lottie: 'girlish-cleaned-eternalcandle-17246.json', tier: 5, price: skinPrices[5] },
    { name: 'Pastel Lootbag', lottie: 'girlish-cleaned-lootbag-7825.json', tier: 5, price: skinPrices[5] }
];

window.newMoneyItems = [
    { name: 'Golden Lootbag', lottie: 'moneyrain-cleaned-lootbag-4244.json', tier: 1, price: skinPrices[1] },
    { name: 'Vintage Record Player', lottie: 'moneyrain-cleaned-recordplayer-5940.json', tier: 1, price: skinPrices[1] },
    { name: 'Diamond Star Notepad', lottie: 'moneyrain-cleaned-starnotepad-32502.json', tier: 2, price: skinPrices[2] },
    { name: 'Luxury Swiss Watch', lottie: 'moneyrain-cleaned-swisswatch-3145.json', tier: 2, price: skinPrices[2] },
    { name: 'Retro Tamagadget', lottie: 'moneyrain-cleaned-tamagadget-1168.json', tier: 3, price: skinPrices[3] },
    { name: 'Classic Top Hat', lottie: 'moneyrain-cleaned-tophat-32663.json', tier: 3, price: skinPrices[3] },
    { name: 'Golden Toy Bear', lottie: 'moneyrain-cleaned-toybear-35493.json', tier: 4, price: skinPrices[4] },
    { name: 'Premium Vintage Cigar', lottie: 'moneyrain-cleaned-vintagecigar-12246.json', tier: 4, price: skinPrices[4] },
    { name: 'Gilded Winter Wreath', lottie: 'moneyrain-cleaned-winterwreath-31568.json', tier: 5, price: skinPrices[5] }
];

// Case opening tracking (Consider moving to caseOpening.js)
let caseOpeningsCount = 0;
let guaranteedTier3NextOpening = false;

// Activity log constants (Consider moving to activityLog.js)
const MAX_ACTIVITIES = 5;
const MAX_STORED_ACTIVITIES = 20;

// TON Connect - instance will be here, initialization in tonConnect.js
let tonConnectUI = null;

// Initialize Supabase Client (Make sure Supabase SDK is loaded before this file)
let supabaseClient = null;
let supabase = null; // Alias for convenience

if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabase = supabaseClient;
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