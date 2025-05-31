// Supabase configuration
const SUPABASE_URL = 'https://qkuqlxwqblmegyhrdwgm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdXFseHdxYmxtZWd5aHJkd2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg4NDc1NjcsImV4cCI6MjA0NDQyMzU2N30.x-9N3O1g0qT88GvSy-LHlOXczGt9vQUCT2vU0u0x4ZM';

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

// Case opening tracking (Consider moving to caseOpening.js)
let caseOpeningsCount = 0;
let guaranteedTier3NextOpening = false;

// Activity log constants (Consider moving to activityLog.js)
const MAX_ACTIVITIES = 5;
const MAX_STORED_ACTIVITIES = 20;

// TON Connect - instance will be here, initialization in tonConnect.js
let tonConnectUI = null;

// Skin prices per tier (Potentially used by inventory.js and caseOpening.js)
const skinPrices = {
    1: 20,   // Common
    2: 50,   // Rare
    3: 120,  // Epic
    4: 300,  // Legendary
    5: 750,  // Mythic
    6: 10000 // Divine
};

// Dark Aura skins data for preloading (Used by caseOpening.js, roulette.js)
const darkAuraSkins = [
    { name: 'Haunted Desk Calendar', tier: 1, price: 20, image: 'cleaned-deskcalendar-280571.json', type: 'lottie' },
    { name: 'Mad Pumpkin Spirit', tier: 2, price: 50, image: 'cleaned-madpumpkin-7551.json', type: 'lottie' },
    { name: 'Electric Skull', tier: 3, price: 120, image: 'cleaned-electricskull-8221.json', type: 'lottie' },
    { name: 'Mystic Crystal Ball', tier: 3, price: 150, image: 'darkaura-cleaned-crystalball-9027.json', type: 'lottie' },
    { name: 'Cursed Voodoo Doll', tier: 4, price: 300, image: 'cleaned-voodoodoll-7970.json', type: 'lottie' },
    { name: 'Bewitched Ginger Cookie', tier: 4, price: 300, image: 'cleaned-gingercookie-20477.json', type: 'lottie' },
    { name: 'Cursed Genie Lamp', tier: 4, price: 350, image: 'darkaura-cleaned-genielamp-4594.json', type: 'lottie' },
    { name: 'Mystical Signet Ring', tier: 5, price: 750, image: 'cleaned-signetring-14328.json', type: 'lottie' },
    { name: 'Eternal Shadow Rose', tier: 5, price: 800, image: 'darkaura-cleaned-eternalrose-7069.json', type: 'lottie' },
    { name: 'Mini Oscar Phantom', tier: 6, price: 10000, image: 'cleaned-minioscar-1983.json', type: 'lottie' },
    { name: 'Scared Cat Obelisk', tier: 6, price: 10000, image: 'cleaned-scaredcat-18595.json', type: 'lottie' }
];

// Initialize Supabase Client (Make sure Supabase SDK is loaded before this file)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabase = supabaseClient; // Alias for convenience

// Initialize Telegram WebApp (Make sure Telegram SDK is loaded before this)
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

console.log('[Config] config.js loaded'); 