import os
import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup, LabeledPrice
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, PreCheckoutQueryHandler, MessageHandler, filters
from supabase import create_client, Client
import json
import time

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
    """Handle pre-checkout queries for payment validation according to official documentation."""
    query = update.pre_checkout_query
    
    try:
        logger.info(f"Pre-checkout query received: {query.id}")
        
        # Parse payload to validate the purchase
        payload_data = json.loads(query.invoice_payload)
        case_type = payload_data.get('case_type')
        user_id = payload_data.get('user_id')
        
        logger.info(f"Validating order: User {user_id}, Case {case_type}, Amount {query.total_amount}")
        
        # Validate case type exists and is available
        if case_type not in CASE_PRICES_STARS:
            await query.answer(ok=False, error_message="Sorry, this case type is no longer available.")
            return
        
        # Validate price matches expected amount
        expected_amount = CASE_PRICES_STARS[case_type]
        if query.total_amount != expected_amount:
            await query.answer(ok=False, error_message=f"Price mismatch. Expected {expected_amount} stars.")
            return
        
        # Validate user ID matches
        if user_id != query.from_user.id:
            await query.answer(ok=False, error_message="User validation failed.")
            return
        
        # Validate currency is Telegram Stars
        if query.currency != "XTR":
            await query.answer(ok=False, error_message="Invalid currency. Only Telegram Stars accepted.")
            return
        
        # Additional business logic validation can go here
        # For example: check inventory, user restrictions, etc.
        
        # All validations passed - approve the order
        await query.answer(ok=True)
        logger.info(f"Pre-checkout approved for user {user_id}, case {case_type}")
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in pre-checkout payload")
        await query.answer(ok=False, error_message="Invalid order data.")
    except Exception as e:
        logger.error(f"Pre-checkout error: {e}")
        await query.answer(ok=False, error_message="Validation failed. Please try again.")

async def successful_payment_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle successful payments according to Telegram Stars official documentation."""
    payment = update.message.successful_payment
    
    try:
        # Parse payload to get order details
        payload_data = json.loads(payment.invoice_payload)
        case_type = payload_data.get('case_type')
        user_id = payload_data.get('user_id')
        
        logger.info(f"Telegram Stars payment successful: {payment.telegram_payment_charge_id}")
        logger.info(f"User: {user_id}, Case: {case_type}, Amount: {payment.total_amount} stars")
        
        # Store the payment according to official documentation
        # The telegram_payment_charge_id is critical for potential refunds
        payment_record = supabase.table('payments').insert({
            'telegram_id': user_id,
            'case_type': case_type,
            'stars_amount': payment.total_amount,
            'telegram_payment_charge_id': payment.telegram_payment_charge_id,
            'provider_payment_charge_id': payment.provider_payment_charge_id,
            'payload': payment.invoice_payload,
            'status': 'completed'
        }).execute()
        
        # Update corresponding invoice status
        supabase.table('invoices').update({
            'status': 'completed',
            'telegram_payment_charge_id': payment.telegram_payment_charge_id,
            'updated_at': 'NOW()'
        }).eq('telegram_id', user_id).eq('payload', payment.invoice_payload).execute()
        
        # Send receipt/confirmation message according to documentation
        await update.message.reply_text(
            f"🎉 Payment Successful!\n\n"
            f"💫 {case_type.title()} Case purchased for {payment.total_amount} ⭐\n"
            f"🎮 Your case will be opened automatically in the WebApp.\n"
            f"📋 Payment ID: {payment.telegram_payment_charge_id}\n\n"
            f"Return to the app to see your new items!"
        )
        
        logger.info(f"Payment {payment.telegram_payment_charge_id} processed successfully")
        
        # Note: According to the documentation, at this point we should "deliver the goods"
        # The WebApp will handle case opening via the invoiceClosed event listener
        # The processStarsPaymentSuccess function will be called automatically
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON payload in successful payment")
        await update.message.reply_text(
            "✅ Payment received, but there was an error processing the order details. "
            "Please contact support with your payment confirmation."
        )
    except Exception as e:
        logger.error(f"Error handling successful payment: {e}")
        await update.message.reply_text(
            "✅ Payment successful! However, there was an error processing your order. "
            "Please contact support - your payment has been recorded and we will resolve this issue."
        )

async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle data sent from the WebApp."""
    try:
        web_app_data = update.message.web_app_data.data
        data = json.loads(web_app_data)
        
        logger.info(f"Received WebApp data: {data}")
        
        # Handle direct invoice creation request
        if data.get('method') == 'sendInvoice' or data.get('action') == 'create_invoice':
            # Extract invoice parameters
            if 'invoice_params' in data:
                invoice_params = data['invoice_params']
            else:
                # Direct method call format
                invoice_params = {
                    'chat_id': data.get('chat_id'),
                    'title': data.get('title'),
                    'description': data.get('description'),
                    'payload': data.get('payload'),
                    'provider_token': data.get('provider_token', ''),
                    'currency': data.get('currency', 'XTR'),
                    'prices': data.get('prices', [])
                }
            
            chat_id = invoice_params.get('chat_id')
            title = invoice_params.get('title')
            description = invoice_params.get('description')
            payload = invoice_params.get('payload')
            currency = invoice_params.get('currency', 'XTR')
            prices_data = invoice_params.get('prices', [])
            
            # Validate required fields
            if not all([chat_id, title, description, payload, prices_data]):
                await update.message.reply_text("❌ Invalid invoice parameters.")
                return
            
            # Parse payload to get case info
            try:
                if isinstance(payload, str):
                    payload_data = json.loads(payload)
                else:
                    payload_data = payload
                    payload = json.dumps(payload)
                    
                case_type = payload_data.get('case_type')
                stars_amount = payload_data.get('stars_amount')
                user_id = payload_data.get('user_id')
            except json.JSONDecodeError:
                await update.message.reply_text("❌ Invalid payload format.")
                return
            
            # Validate case type and price
            if case_type not in CASE_PRICES_STARS:
                await update.message.reply_text("❌ Invalid case type.")
                return
                
            if CASE_PRICES_STARS[case_type] != stars_amount:
                await update.message.reply_text("❌ Invalid price.")
                return
            
            # Create LabeledPrice objects
            prices = [LabeledPrice(label=price['label'], amount=price['amount']) for price in prices_data]
            
            try:
                # Send invoice using Telegram Stars
                await context.bot.send_invoice(
                    chat_id=chat_id,
                    title=title,
                    description=description,
                    payload=payload,
                    provider_token="",  # Empty for Telegram Stars
                    currency=currency,  # XTR for Telegram Stars
                    prices=prices,
                    start_parameter=f"webapp_invoice_{case_type}_{int(time.time())}"
                )
                
                await update.message.reply_text(f"✅ Invoice sent for {title}!")
                
                # Log invoice creation in database
                try:
                    supabase.table('invoices').insert({
                        'telegram_id': user_id,
                        'case_type': case_type,
                        'stars_amount': stars_amount,
                        'status': 'pending',
                        'payload': payload
                    }).execute()
                    logger.info(f"Invoice logged for user {user_id}, case {case_type}")
                except Exception as e:
                    logger.error(f"Error logging WebApp invoice: {e}")
                    
            except Exception as e:
                logger.error(f"Error sending WebApp invoice: {e}")
                await update.message.reply_text("❌ Sorry, there was an error creating the invoice. Please try again.")
        
        # Handle direct invoice sending according to official Telegram Stars guide
        elif data.get('action') == 'send_stars_invoice':
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
            
            # Prepare invoice according to official documentation
            title = f"{case_type.title()} Case"
            description = f"Open a {case_type} case and get random NFT items!"
            
            # Create unique payload for this invoice
            payload = json.dumps({
                'case_type': case_type,
                'user_id': user_id,
                'stars_amount': stars_amount,
                'timestamp': int(time.time()),
                'source': 'webapp_stars'
            })
            
            # Create prices array - amount should be in Stars (not smallest unit for XTR)
            prices = [LabeledPrice(label=title, amount=stars_amount)]
            
            try:
                # Send invoice using official Telegram Stars API
                # Following the guide: https://core.telegram.org/bots/payments-stars
                message = await context.bot.send_invoice(
                    chat_id=user_id,
                    title=title,
                    description=description,
                    payload=payload,
                    provider_token="",  # Empty string for digital goods (Telegram Stars)
                    currency="XTR",     # Telegram Stars currency
                    prices=prices,
                    start_parameter=f"stars_{case_type}_{int(time.time())}"
                )
                
                logger.info(f"Telegram Stars invoice sent successfully to user {user_id} for {case_type}")
                
                # Log invoice creation in database
                try:
                    supabase.table('invoices').insert({
                        'telegram_id': user_id,
                        'case_type': case_type,
                        'stars_amount': stars_amount,
                        'status': 'pending',
                        'payload': payload,
                        'message_id': message.message_id
                    }).execute()
                    logger.info(f"Invoice logged in database for user {user_id}")
                except Exception as e:
                    logger.error(f"Error logging invoice: {e}")
                
                # Send confirmation to WebApp user (this message will appear in the chat)
                await update.message.reply_text(
                    f"💫 Invoice sent for {title}!\n"
                    f"💰 Price: {stars_amount} ⭐\n"
                    f"📋 Tap the invoice above to pay with Telegram Stars."
                )
                    
            except Exception as e:
                logger.error(f"Error sending Telegram Stars invoice: {e}")
                await update.message.reply_text(
                    "❌ Sorry, there was an error creating the invoice. Please try again.\n"
                    f"Error details: {str(e)}"
                )
        
        # Handle simplified stars invoice creation (legacy)
        elif data.get('action') == 'create_stars_invoice':
            case_type = data.get('case_type')
            user_id = data.get('user_id')
            stars_amount = data.get('stars_amount')
            title = data.get('title')
            description = data.get('description')
            
            # Validate data
            if not case_type or case_type not in CASE_PRICES_STARS:
                await update.message.reply_text("❌ Invalid case type.")
                return
                
            if CASE_PRICES_STARS[case_type] != stars_amount:
                await update.message.reply_text("❌ Invalid price.")
                return
            
            # Create invoice payload
            payload = json.dumps({
                'case_type': case_type,
                'user_id': user_id,
                'stars_amount': stars_amount,
                'timestamp': int(time.time()),
                'source': 'webapp_stars'
            })
            
            # Create LabeledPrice for Telegram Stars
            prices = [LabeledPrice(label=title, amount=stars_amount)]
            
            try:
                # Send invoice using Telegram Stars API
                await context.bot.send_invoice(
                    chat_id=user_id,
                    title=title,
                    description=description,
                    payload=payload,
                    provider_token="",  # Empty for Telegram Stars
                    currency="XTR",  # Telegram Stars currency
                    prices=prices,
                    start_parameter=f"stars_{case_type}_{int(time.time())}"
                )
                
                await update.message.reply_text(f"✅ Stars invoice sent for {title}!")
                
                # Log invoice creation
                try:
                    supabase.table('invoices').insert({
                        'telegram_id': user_id,
                        'case_type': case_type,
                        'stars_amount': stars_amount,
                        'status': 'pending',
                        'payload': payload
                    }).execute()
                    logger.info(f"Stars invoice logged for user {user_id}, case {case_type}")
                except Exception as e:
                    logger.error(f"Error logging stars invoice: {e}")
                    
            except Exception as e:
                logger.error(f"Error sending stars invoice: {e}")
                await update.message.reply_text("❌ Sorry, there was an error creating the Stars invoice. Please try again.")
        
        # Handle legacy buy_case action (backward compatibility)
        elif data.get('action') == 'buy_case':
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
            
    except json.JSONDecodeError:
        logger.error("Invalid JSON in WebApp data")
        await update.message.reply_text("❌ Invalid data format.")
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