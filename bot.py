import os
import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from supabase import create_client, Client

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
# Set higher logging level for httpx to avoid excessive logs
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# Bot token provided by BotFather
TOKEN = "7548063060:AAFRPyueo070wzlN-Ui0MzKGLXiz1YcUK5U"

# Define the URL where your web app is hosted
# Updated to use your GitHub Pages URL
WEBAPP_URL = "https://stepan3301.github.io/unboxd_nft/webapp.html"

# Supabase credentials - replace with your own
SUPABASE_URL = "https://vjlsmlkwoiwpercoljfo.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbHNtbGt3b2l3cGVyY29samZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMzA2MDAsImV4cCI6MjA2MzYwNjYwMH0.47EOGnJIl7XfTqJOW8PjHlpAOYuj27sd-u9CdteoDR0"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


async def register_user(user):
    """Register user in the database if they don't exist yet"""
    try:
        # Call the function we created in SQL to add user and initialize balance
        result = supabase.rpc(
            'add_user_with_balance',
            {
                'p_telegram_id': user.id,
                'p_username': user.username or '',
                'p_first_name': user.first_name or '',
                'p_last_name': user.last_name or ''
            }
        ).execute()
        
        logger.info(f"User registration: {result}")
        return True
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        return False

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message with a button that opens the web app."""
    # Register user in database
    await register_user(update.effective_user)
    
    # Create button that links to the web app
    keyboard = [
        [InlineKeyboardButton("Start", callback_data="start")],
        [InlineKeyboardButton("About", callback_data="about")],
        [InlineKeyboardButton("Open UnboxdNFT App", web_app=WebAppInfo(url=WEBAPP_URL))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Welcome to UnboxdNFT Bot! Choose an option:",
        reply_markup=reply_markup
    )

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle button callbacks."""
    query = update.callback_query
    await query.answer()
    
    # Register user in database
    await register_user(update.effective_user)
    
    if query.data == "start":
        await query.message.reply_text("Let's get started with UnboxdNFT! Use the 'Open UnboxdNFT App' button to access the NFT cases.")
    elif query.data == "about":
        await query.message.reply_text("UnboxdNFT is a Telegram Mini App that lets you open NFT cases and collect digital items.")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /help is issued."""
    # Register user in database
    await register_user(update.effective_user)
    
    await update.message.reply_text("Use /start to get the main menu with options.")

async def about_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send information about the bot when the command /about is issued."""
    # Register user in database
    await register_user(update.effective_user)
    
    await update.message.reply_text("UnboxdNFT is a Telegram Mini App that lets you open NFT cases and collect digital items.")

async def balance_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show user balance."""
    # Register user in database
    await register_user(update.effective_user)
    
    try:
        # Get user balance
        result = supabase.rpc(
            'get_balance',
            {'p_telegram_id': update.effective_user.id}
        ).execute()
        
        balance = result.data
        await update.message.reply_text(f"Your current balance: {balance}")
    except Exception as e:
        logger.error(f"Error fetching balance: {e}")
        await update.message.reply_text("Sorry, couldn't fetch your balance at this time.")

def main() -> None:
    """Start the bot."""
    # Create the Application and pass it your bot's token
    application = Application.builder().token(TOKEN).build()

    # Add handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("about", about_command))
    application.add_handler(CommandHandler("balance", balance_command))
    application.add_handler(CallbackQueryHandler(button_callback))

    # Run the bot until the user presses Ctrl-C
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main() 