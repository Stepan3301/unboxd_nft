import os
import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup, LabeledPrice
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, PreCheckoutQueryHandler, MessageHandler, filters
from supabase import create_client, Client
import json

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
# Set higher logging level for httpx to avoid excessive logs
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# Bot token provided by BotFather
TOKEN = "7548063060:AAFRPyueo070wzlN-Ui0MzKGLXiz1YcUK5U"

# IMPORTANT: Replace with your actual bot username
BOT_USERNAME = "UnboxdNFT_bot"  # Replace with your actual bot username

# Define the URL where your web app is hosted
# Updated to use your GitHub Pages URL
WEBAPP_URL = "https://stepan3301.github.io/unboxd_nft/webapp.html"

# Supabase credentials - replace with your own
SUPABASE_URL = "https://vjlsmlkwoiwpercoljfo.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbHNtbGt3b2l3cGVyY29samZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMzA2MDAsImV4cCI6MjA2MzYwNjYwMH0.47EOGnJIl7XfTqJOW8PjHlpAOYuj27sd-u9CdteoDR0"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Case prices in Telegram Stars
CASE_PRICES_STARS = {
    'labubu': 1,
    'darkaura': 2,
    'girlish': 3,
    'newmoney': 5
}

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

# NEW: Telegram Stars Payment Handlers

async def buy_case_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /buy_case command for Telegram Stars payments."""
    await register_user(update.effective_user)
    
    # Create inline keyboard with case options
    keyboard = [
        [InlineKeyboardButton("🌟 Labubu Case - 1 ⭐", callback_data="buy_case_labubu")],
        [InlineKeyboardButton("🌟 Dark Aura Case - 2 ⭐", callback_data="buy_case_darkaura")],
        [InlineKeyboardButton("🌟 Girlish Case - 3 ⭐", callback_data="buy_case_girlish")],
        [InlineKeyboardButton("🌟 New Money Case - 5 ⭐", callback_data="buy_case_newmoney")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Choose a case to purchase with Telegram Stars:",
        reply_markup=reply_markup
    )

async def handle_buy_case_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle case purchase callbacks."""
    query = update.callback_query
    await query.answer()
    
    case_type = query.data.replace('buy_case_', '')
    
    if case_type not in CASE_PRICES_STARS:
        await query.edit_message_text("Invalid case type.")
        return
    
    stars_price = CASE_PRICES_STARS[case_type]
    
    # Create invoice for Telegram Stars
    title = f"{case_type.title()} Case"
    description = f"Open a {case_type} case and get random NFT items!"
    payload = json.dumps({
        'case_type': case_type,
        'user_id': query.from_user.id,
        'timestamp': update.effective_message.date.timestamp()
    })
    
    # Create price list (amounts are in smallest currency unit, for stars it's 1:1)
    prices = [LabeledPrice(label=title, amount=stars_price)]
    
    try:
        # Send invoice
        await context.bot.send_invoice(
            chat_id=query.from_user.id,
            title=title,
            description=description,
            payload=payload,
            provider_token="",  # Empty for Telegram Stars
            currency="XTR",  # Telegram Stars currency
            prices=prices,
            start_parameter=f"buy_case_{case_type}"
        )
        
        await query.edit_message_text(f"Invoice sent for {title}! Check your messages.")
        
        # Log invoice creation
        try:
            supabase.table('invoices').insert({
                'telegram_id': query.from_user.id,
                'case_type': case_type,
                'stars_amount': stars_price,
                'status': 'pending',
                'payload': payload
            }).execute()
        except Exception as e:
            logger.error(f"Error logging invoice: {e}")
            
    except Exception as e:
        logger.error(f"Error sending invoice: {e}")
        await query.edit_message_text("Sorry, there was an error creating the invoice. Please try again.")

async def pre_checkout_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle pre-checkout queries for payment validation."""
    query = update.pre_checkout_query
    
    try:
        # Parse payload to validate the purchase
        payload_data = json.loads(query.invoice_payload)
        case_type = payload_data.get('case_type')
        user_id = payload_data.get('user_id')
        
        # Validate case type and price
        if case_type not in CASE_PRICES_STARS:
            await query.answer(ok=False, error_message="Invalid case type.")
            return
        
        expected_amount = CASE_PRICES_STARS[case_type]
        if query.total_amount != expected_amount:
            await query.answer(ok=False, error_message="Price mismatch.")
            return
        
        # Validate user
        if user_id != query.from_user.id:
            await query.answer(ok=False, error_message="User mismatch.")
            return
        
        # All validations passed
        await query.answer(ok=True)
        logger.info(f"Pre-checkout validated for user {user_id}, case {case_type}")
        
    except Exception as e:
        logger.error(f"Pre-checkout error: {e}")
        await query.answer(ok=False, error_message="Validation failed.")

async def successful_payment_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle successful payments."""
    payment = update.message.successful_payment
    
    try:
        # Parse payload
        payload_data = json.loads(payment.invoice_payload)
        case_type = payload_data.get('case_type')
        user_id = payload_data.get('user_id')
        
        logger.info(f"Payment successful: {payment.telegram_payment_charge_id} for user {user_id}, case {case_type}")
        
        # Log payment in database
        payment_result = supabase.table('payments').insert({
            'telegram_id': user_id,
            'case_type': case_type,
            'stars_amount': payment.total_amount,
            'telegram_payment_charge_id': payment.telegram_payment_charge_id,
            'provider_payment_charge_id': payment.provider_payment_charge_id,
            'payload': payment.invoice_payload,
            'status': 'completed'
        }).execute()
        
        # Update invoice status
        supabase.table('invoices').update({
            'status': 'completed',
            'telegram_payment_charge_id': payment.telegram_payment_charge_id
        }).eq('telegram_id', user_id).eq('payload', payment.invoice_payload).execute()
        
        # Send confirmation message
        await update.message.reply_text(
            f"🎉 Payment successful! Your {case_type.title()} Case has been purchased.\n"
            f"💫 Paid: {payment.total_amount} ⭐\n"
            f"🎮 Open the app to claim your case!"
        )
        
    except Exception as e:
        logger.error(f"Error handling successful payment: {e}")
        await update.message.reply_text("Payment received, but there was an error processing it. Please contact support.")

async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle data sent from the WebApp."""
    try:
        web_app_data = update.message.web_app_data.data
        data = json.loads(web_app_data)
        
        logger.info(f"Received WebApp data: {data}")
        
        if data.get('action') == 'buy_case':
            case_type = data.get('case_type')
            user_id = data.get('user_id')
            stars_amount = data.get('stars_amount')
            
            # Validate data
            if not case_type or case_type not in CASE_PRICES_STARS:
                await update.message.reply_text("❌ Invalid case type.")
                return
                
            if CASE_PRICES_STARS[case_type] != stars_amount:
                await update.message.reply_text("❌ Invalid price.")
                return
            
            # Create invoice automatically
            title = f"{case_type.title()} Case"
            description = f"Open a {case_type} case and get random NFT items!"
            payload = json.dumps({
                'case_type': case_type,
                'user_id': user_id,
                'timestamp': data.get('timestamp'),
                'source': 'webapp'
            })
            
            prices = [LabeledPrice(label=title, amount=stars_amount)]
            
            try:
                # Send invoice directly to the user
                await context.bot.send_invoice(
                    chat_id=user_id,
                    title=title,
                    description=description,
                    payload=payload,
                    provider_token="",  # Empty for Telegram Stars
                    currency="XTR",  # Telegram Stars currency
                    prices=prices,
                    start_parameter=f"webapp_buy_case_{case_type}"
                )
                
                await update.message.reply_text(f"✅ Invoice sent for {title}!")
                
                # Log invoice creation
                try:
                    supabase.table('invoices').insert({
                        'telegram_id': user_id,
                        'case_type': case_type,
                        'stars_amount': stars_amount,
                        'status': 'pending',
                        'payload': payload
                    }).execute()
                except Exception as e:
                    logger.error(f"Error logging WebApp invoice: {e}")
                    
            except Exception as e:
                logger.error(f"Error sending WebApp invoice: {e}")
                await update.message.reply_text("❌ Sorry, there was an error creating the invoice. Please try again.")
        
        else:
            await update.message.reply_text("❓ Unknown action received from WebApp.")
            
    except Exception as e:
        logger.error(f"Error handling WebApp data: {e}")
        await update.message.reply_text("❌ Error processing WebApp request.")

def main() -> None:
    """Start the bot."""
    # Create the Application and pass it your bot's token
    application = Application.builder().token(TOKEN).build()

    # Add handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("about", about_command))
    application.add_handler(CommandHandler("balance", balance_command))
    application.add_handler(CommandHandler("buy_case", buy_case_command))
    application.add_handler(CallbackQueryHandler(handle_buy_case_callback, pattern="^buy_case_"))
    application.add_handler(CallbackQueryHandler(button_callback))
    application.add_handler(PreCheckoutQueryHandler(pre_checkout_callback))
    application.add_handler(MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment_callback))
    application.add_handler(MessageHandler(filters.WEB_APP_DATA, handle_web_app_data))

    # Run the bot until the user presses Ctrl-C
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main() 