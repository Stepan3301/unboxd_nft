# Roulette Animation Improvements

## Overview
This update enhances the roulette animation in the UnboxdNFT mini-app with:
1. Randomized NFT order on each spin
2. Consistent animation direction and behavior
3. Smoother animation with improved physics
4. Prevention of disappearing items during scrolling

## Key Implementations

### 1. Fisher-Yates Shuffle Algorithm
Added a `shuffleArray` function to randomize NFTs every time the case is opened:
```javascript
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
```

### 2. Enhanced Roulette Initialization
Updated the `initializeRoulette` function to create three differently shuffled sets of NFTs:
```javascript
// First set - completely random
const firstSet = shuffleArray(labubuSkins);
// Second set - different shuffle
const secondSet = shuffleArray(labubuSkins);
// Third set - different shuffle again
const thirdSet = shuffleArray(labubuSkins);

// Combine all sets
const allSets = [...firstSet, ...secondSet, ...thirdSet];
```

### 3. Improved Animation Physics
Implemented smoother animation using requestAnimationFrame and cubic-bezier curves:
```javascript
// Easing function - starts fast, slows down (ease-out)
const easedProgress = 1 - Math.pow(1 - progress, 3);
```

### 4. Consistent Direction & Cycling
Added logic to ensure animations always move in a consistent direction and items properly cycle during scrolling:
```javascript
// Calculate how far we need to move to reach the target
if (targetX > startX) {
    totalDistance = targetX - startX - rouletteWidth;
} else {
    totalDistance = targetX - startX;
}

// Handle cycling of the roulette during animation
const normalizedPosition = currentPosition % rouletteWidth;
```

### 5. Minimum Distance Enforcement
Ensured a satisfying spin by enforcing a minimum spin distance:
```javascript
// Ensure we move at least 3000px for a good spin effect
if (Math.abs(totalDistance) < 3000) {
    // Add additional full rotations to ensure minimum distance
    const additionalRotations = Math.ceil((3000 - Math.abs(totalDistance)) / rouletteWidth);
    totalDistance -= additionalRotations * rouletteWidth;
}
```

### 6. Force Reflow for Rendering Issues
Used force reflow techniques to prevent rendering glitches:
```javascript
rouletteTrack.style.transition = 'none';
rouletteTrack.style.transform = 'translateX(0)';
rouletteTrack.offsetHeight; // Force a reflow
```

## Benefits
- Better user experience with more randomized outcomes
- More reliable and consistent animation behavior
- Smoother animations with natural-feeling physics
- No more disappearing items during animation
- More satisfying spinning effect with proper deceleration 