#!/bin/bash

# This script applies the improved roulette animation to webapp.html
# It replaces three functions:
# 1. initializeRoulette
# 2. startRouletteAnimation
# 3. openCase

# Create a backup first
echo "Creating backup of webapp.html as webapp.html.roulette_backup"
cp webapp.html webapp.html.roulette_backup

# Define the path to the improved functions
ROULETTE_FIX="roulette_fix.js"

# Check if the roulette fix file exists
if [ ! -f "$ROULETTE_FIX" ]; then
    echo "Error: $ROULETTE_FIX not found!"
    exit 1
fi

echo "Applying roulette fixes to webapp.html..."

# 1. Add the shuffleArray function before the initializeRoulette function
# First, let's get the line number where initializeRoulette is defined
INIT_ROULETTE_LINE=$(grep -n "function initializeRoulette" webapp.html | cut -d':' -f1)

if [ -z "$INIT_ROULETTE_LINE" ]; then
    echo "Error: Could not find initializeRoulette function in webapp.html"
    exit 1
fi

echo "Found initializeRoulette at line $INIT_ROULETTE_LINE"

# Extract the shuffleArray function from the fix file
SHUFFLE_ARRAY=$(sed -n '/function shuffleArray/,/^}/p' "$ROULETTE_FIX")

# Insert the shuffleArray function before initializeRoulette
sed -i '' "${INIT_ROULETTE_LINE}i\\
${SHUFFLE_ARRAY}
" webapp.html

echo "Added shuffleArray function"

# 2. Replace the initializeRoulette function
# Find the start and end lines of the function
INIT_START=$(grep -n "function initializeRoulette" webapp.html | cut -d':' -f1)
INIT_END=$(awk "NR>=$INIT_START{if(\$0~/^        }/){print NR; exit}}" webapp.html)

if [ -z "$INIT_START" ] || [ -z "$INIT_END" ]; then
    echo "Error: Could not find boundaries of initializeRoulette function"
    exit 1
fi

echo "Found initializeRoulette from line $INIT_START to $INIT_END"

# Extract the new initializeRoulette function from the fix file
NEW_INIT=$(sed -n '/function initializeRoulette/,/^}/p' "$ROULETTE_FIX")

# Replace the old function with the new one
sed -i '' "${INIT_START},${INIT_END}c\\
${NEW_INIT}
" webapp.html

echo "Replaced initializeRoulette function"

# 3. Replace the startRouletteAnimation function
# Find the start and end lines of the function
START_ANIM_START=$(grep -n "function startRouletteAnimation" webapp.html | cut -d':' -f1)
START_ANIM_END=$(awk "NR>=$START_ANIM_START{if(\$0~/^        }/){print NR; exit}}" webapp.html)

if [ -z "$START_ANIM_START" ] || [ -z "$START_ANIM_END" ]; then
    echo "Error: Could not find boundaries of startRouletteAnimation function"
    exit 1
fi

echo "Found startRouletteAnimation from line $START_ANIM_START to $START_ANIM_END"

# Extract the new startRouletteAnimation function from the fix file
NEW_START_ANIM=$(sed -n '/function startRouletteAnimation/,/^}/p' "$ROULETTE_FIX")

# Replace the old function with the new one
sed -i '' "${START_ANIM_START},${START_ANIM_END}c\\
${NEW_START_ANIM}
" webapp.html

echo "Replaced startRouletteAnimation function"

# 4. Replace the openCase function
# Find the start and end lines of the function
OPEN_CASE_START=$(grep -n "function openCase" webapp.html | cut -d':' -f1)
OPEN_CASE_END=$(awk "NR>=$OPEN_CASE_START{if(\$0~/^        }/){print NR; exit}}" webapp.html)

if [ -z "$OPEN_CASE_START" ] || [ -z "$OPEN_CASE_END" ]; then
    echo "Error: Could not find boundaries of openCase function"
    exit 1
fi

echo "Found openCase from line $OPEN_CASE_START to $OPEN_CASE_END"

# Extract the new openCase function from the fix file
NEW_OPEN_CASE=$(sed -n '/function openCase/,/^}/p' "$ROULETTE_FIX")

# Replace the old function with the new one
sed -i '' "${OPEN_CASE_START},${OPEN_CASE_END}c\\
${NEW_OPEN_CASE}
" webapp.html

echo "Replaced openCase function"

echo "All roulette improvements have been applied!"
echo "Original file is backed up as webapp.html.roulette_backup" 