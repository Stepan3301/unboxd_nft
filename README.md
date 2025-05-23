# UnboxdNFT Telegram Bot

A Telegram bot with a Mini App for NFT cases.

## Setup

1. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Host the webapp.html file:
   - For development, you can use GitHub Pages or any static hosting service
   - Update the `WEBAPP_URL` in bot.py to point to your hosted webapp.html file

3. Run the bot:
   ```
   python bot.py
   ```

## Features

- /start - Displays main menu with buttons
- /help - Shows help message
- /about - Shows information about the bot
- Inline buttons for Start and About information
- "Open UnboxdNFT App" button to launch the Telegram Mini App

## Mini App

The Mini App is currently a basic placeholder displaying "Hello user!". Further development will include NFT case functionality. 