# Hosting the Telegram Mini App on GitHub Pages

Follow these steps to host your Telegram Mini App on GitHub Pages:

1. Create a new GitHub repository named `unboxd_nft`

2. Initialize a Git repository in your project folder:
   ```
   git init
   git add webapp.html
   git commit -m "Initial commit with webapp"
   ```

3. Connect your local repository to GitHub:
   ```
   git remote add origin https://github.com/troitskiystepan/unboxd_nft.git
   git branch -M main
   git push -u origin main
   ```

4. Enable GitHub Pages in your repository settings:
   - Go to your repository on GitHub
   - Click on "Settings"
   - Scroll down to "GitHub Pages" section
   - Select "main" branch as the source
   - Click "Save"

5. Your Mini App will be available at:
   `https://troitskiystepan.github.io/unboxd_nft/webapp.html`

6. Make sure this URL matches the `WEBAPP_URL` in your bot.py file

## Updating the Mini App

Whenever you make changes to your webapp.html file:

1. Commit and push your changes:
   ```
   git add webapp.html
   git commit -m "Update webapp"
   git push
   ```

2. The changes will be automatically published on GitHub Pages (may take a few minutes)

## Testing the Telegram Mini App

1. Visit `https://t.me/your_bot_username` in a browser or open your bot in the Telegram app
2. Start the bot and click the "Open UnboxdNFT App" button
3. The Mini App should open displaying "Hello user!" 