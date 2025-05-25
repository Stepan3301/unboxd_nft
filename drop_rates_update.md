# Drop Rate Changes and Guaranteed Tier 3 Implementation

## Overview
This update modifies the NFT drop probabilities and implements a guaranteed Tier 3 or better item every fourth case opening to improve user satisfaction and engagement.

## Drop Rate Changes

### Previous Drop Rates:
- Tier 1 (Skeleton Labubu): 50%
- Tier 2 (Zombie & Candy Labubu): 25% each (50% total)
- Tier 3 (Circus & Alien Labubu): 15% each (30% total)
- Tier 4 (Grass & Deep Sea Labubu): 5% each (10% total)
- Tier 5 (Grinch Labubu): 1%
- Tier 6 (Volcanic Labubu): 0.00001%

### New Drop Rates:
- Tier 1 (Skeleton Labubu): 73.0%
- Tier 2 (Zombie & Candy Labubu): 10.0% each (20.0% total)
- Tier 3 (Circus & Alien Labubu): 2.5% each (5.0% total)
- Tier 4 (Grass & Deep Sea Labubu): 0.7% each (1.4% total)
- Tier 5 (Grinch Labubu): 0.5%
- Tier 6 (Volcanic Labubu): 0.1%

## Guaranteed Tier 3 System

### Implementation
A new system guarantees users receive a Tier 3 or better item every fourth case opening, improving satisfaction for regular users.

### Key Components:
1. **Case Opening Counter**: Tracks the number of cases opened by each user
2. **Guaranteed Flag**: Ensures Tier 3+ items on every fourth opening (4th, 8th, 12th, etc.)
3. **localStorage Persistence**: Maintains the counter between sessions
4. **User-Specific Tracking**: Uses Telegram ID to store individual progress

### Code Implementation

```javascript
// Case opening tracking variables
let caseOpeningsCount = 0;
let guaranteedTier3NextOpening = false;

// Check if user should get a guaranteed Tier 3 or better
function shouldProvideGuaranteedTier3() {
    caseOpeningsCount++;
    
    if (guaranteedTier3NextOpening) {
        guaranteedTier3NextOpening = false;
        return true;
    }
    
    if (caseOpeningsCount % 4 === 0) {
        return true;
    }
    
    return false;
}

// Get a guaranteed Tier 3 or better item
function getGuaranteedTier3OrBetter() {
    const tier3OrBetter = labubuSkins.filter(skin => skin.tier >= 3);
    // Logic to select from these higher-tier items...
}
```

### User Experience Benefits
1. **Higher Engagement**: Users are incentivized to open multiple cases
2. **Improved Satisfaction**: Regular users are guaranteed better items periodically
3. **Reduced Frustration**: Prevents long streaks of only getting common items
4. **Progression Feeling**: Creates a sense of progress toward a guaranteed reward

## Technical Implementation
- Added localStorage-based persistence to track case openings across sessions
- Implemented proper probability normalization for the guaranteed drops
- Added console logging for debugging and monitoring purposes
- Used a modular approach that can be easily adjusted or expanded 