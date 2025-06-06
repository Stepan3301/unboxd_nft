import os
import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup, LabeledPrice
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, PreCheckoutQueryHandler, MessageHandler, filters
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

# IMPORTANT: Updated to match user's actual bot username
BOT_USERNAME = "unboxdnft_bot"  # Changed from UnboxdNFT_bot to match @unboxdnft_bot

# Define the URL where your web app is hosted
# Updated to use your GitHub Pages URL
WEBAPP_URL = "https://stepan3301.github.io/unboxd_nft/webapp.html"

# Case prices in Telegram Stars
CASE_PRICES_STARS = {
    'labubu': 1,
    'darkaura': 2,
    'girlish': 3,
    'newmoney': 5
}

# In-memory storage for testing (replace with database in production)
invoices_storage = {}
payments_storage = {}

# NEW: Payment context storage to track active payments
payment_contexts = {}  # user_id -> {case_type, stars_amount, timestamp, invoice_id}

def store_payment_context(user_id, case_type, stars_amount, invoice_id):
    """Store payment context for tracking"""
    payment_contexts[user_id] = {
        'case_type': case_type,
        'stars_amount': stars_amount,
        'timestamp': int(time.time()),
        'invoice_id': invoice_id,
        'status': 'pending'
    }
    logger.info(f"[Payment Context] Stored context for user {user_id}: {case_type}")

def get_payment_context(user_id):
    """Get payment context for user"""
    return payment_contexts.get(user_id)

def clear_payment_context(user_id):
    """Clear payment context after completion"""
    if user_id in payment_contexts:
        del payment_contexts[user_id]
        logger.info(f"[Payment Context] Cleared context for user {user_id}")

async def register_user(user):
    """Register user (simplified for testing)"""
    logger.info(f"User registered: {user.id} - {user.first_name}")
    return True

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message with a button that opens the web app."""
    await register_user(update.effective_user)
    
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
    
    await register_user(update.effective_user)
    
    if query.data == "start":
        await query.message.reply_text("Let's get started with UnboxdNFT! Use the 'Open UnboxdNFT App' button to access the NFT cases.")
    elif query.data == "about":
        await query.message.reply_text("UnboxdNFT is a Telegram Mini App that lets you open NFT cases and collect digital items.")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /help is issued."""
    await register_user(update.effective_user)
    await update.message.reply_text("Use /start to get the main menu with options.")

async def about_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send information about the bot when the command /about is issued."""
    await register_user(update.effective_user)
    await update.message.reply_text("UnboxdNFT is a Telegram Mini App that lets you open NFT cases and collect digital items.")

async def balance_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show user balance."""
    await register_user(update.effective_user)
    await update.message.reply_text("Your current balance: 1000 (testing)")

async def buy_case_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /buy_case command for Telegram Stars payments."""
    await register_user(update.effective_user)
    
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
    
    title = f"{case_type.title()} Case"
    description = f"Open a {case_type} case and get random NFT items!"
    payload = json.dumps({
        'case_type': case_type,
        'user_id': query.from_user.id,
        'timestamp': update.effective_message.date.timestamp()
    })
    
    prices = [LabeledPrice(label=title, amount=stars_price)]
    
    try:
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
        
        # Store invoice in memory
        invoice_id = f"{query.from_user.id}_{int(time.time())}"
        invoices_storage[invoice_id] = {
            'telegram_id': query.from_user.id,
            'case_type': case_type,
            'stars_amount': stars_price,
            'status': 'pending',
            'payload': payload
        }
        logger.info(f"Invoice stored: {invoice_id}")
            
    except Exception as e:
        logger.error(f"Error sending invoice: {e}")
        await query.edit_message_text("Sorry, there was an error creating the invoice. Please try again.")

async def pre_checkout_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle pre-checkout queries for payment validation."""
    query = update.pre_checkout_query
    
    try:
        logger.info(f"[Pre-Checkout] Query received: {query.id}")
        print(f"[Pre-Checkout] Query received: {query.id}")
        
        payload_data = json.loads(query.invoice_payload)
        case_type = payload_data.get('case_type')
        user_id = payload_data.get('user_id')
        
        logger.info(f"[Pre-Checkout] Validating: User {user_id}, Case {case_type}, Amount {query.total_amount}")
        print(f"[Pre-Checkout] Validating: User {user_id}, Case {case_type}, Amount {query.total_amount}")
        
        # Validate case type exists and is available
        if case_type not in CASE_PRICES_STARS:
            error_msg = "Sorry, this case type is no longer available."
            logger.error(f"[Pre-Checkout] Invalid case type: {case_type}")
            await query.answer(ok=False, error_message=error_msg)
            return
        
        # Validate price matches expected amount
        expected_amount = CASE_PRICES_STARS[case_type]
        if query.total_amount != expected_amount:
            error_msg = f"Price mismatch. Expected {expected_amount} stars."
            logger.error(f"[Pre-Checkout] Price mismatch: expected {expected_amount}, got {query.total_amount}")
            await query.answer(ok=False, error_message=error_msg)
            return
        
        # Validate user ID matches
        if user_id != query.from_user.id:
            error_msg = "User validation failed."
            logger.error(f"[Pre-Checkout] User ID mismatch: payload {user_id}, actual {query.from_user.id}")
            await query.answer(ok=False, error_message=error_msg)
            return
        
        # Validate currency is Telegram Stars
        if query.currency != "XTR":
            error_msg = "Invalid currency. Only Telegram Stars accepted."
            logger.error(f"[Pre-Checkout] Invalid currency: {query.currency}")
            await query.answer(ok=False, error_message=error_msg)
            return
        
        # All validations passed - approve the order
        await query.answer(ok=True)
        logger.info(f"[Pre-Checkout] Approved for user {user_id}, case {case_type}")
        print(f"[Pre-Checkout] Payment approved for {case_type} case")
        
    except json.JSONDecodeError:
        error_msg = "Invalid order data."
        logger.error("[Pre-Checkout] Invalid JSON in pre-checkout payload")
        await query.answer(ok=False, error_message=error_msg)
    except Exception as e:
        error_msg = "Validation failed. Please try again."
        logger.error(f"[Pre-Checkout] Error: {e}")
        print(f"[Pre-Checkout] Error: {e}")
        await query.answer(ok=False, error_message=error_msg)

async def successful_payment_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle successful payments."""
    payment = update.message.successful_payment
    
    try:
        payload_data = json.loads(payment.invoice_payload)
        case_type = payload_data.get('case_type')
        user_id = payload_data.get('user_id')
        
        logger.info(f"[Payment Success] Payment successful: {payment.telegram_payment_charge_id}")
        logger.info(f"[Payment Success] User: {user_id}, Case: {case_type}, Amount: {payment.total_amount} stars")
        print(f"[Payment Success] Payment ID: {payment.telegram_payment_charge_id}, User: {user_id}, Case: {case_type}")
        
        # Get and validate payment context
        payment_context = get_payment_context(user_id)
        if payment_context:
            logger.info(f"[Payment Success] Found payment context: {payment_context}")
            # Use context data as source of truth
            case_type = payment_context['case_type']
        else:
            logger.warning(f"[Payment Success] No payment context found for user {user_id}")
        
        # Store payment in memory
        payment_id = f"{user_id}_{int(time.time())}"
        payments_storage[payment_id] = {
            'telegram_id': user_id,
            'case_type': case_type,
            'stars_amount': payment.total_amount,
            'telegram_payment_charge_id': payment.telegram_payment_charge_id,
            'provider_payment_charge_id': payment.provider_payment_charge_id,
            'payload': payment.invoice_payload,
            'status': 'completed',
            'timestamp': int(time.time())
        }
        
        # Clear payment context
        clear_payment_context(user_id)
        
        success_message = (
            f"🎉 **PAYMENT SUCCESSFUL!** 🎉\n\n"
            f"💫 **{case_type.title()} Case** purchased for **{payment.total_amount} ⭐**\n\n"
            f"✅ Your payment has been processed successfully!\n"
            f"🎮 **Your case will open automatically in the WebApp.**\n"
            f"🎁 Get ready to see what amazing items you've won!\n\n"
            f"📋 **Payment Receipt:**\n"
            f"• Transaction ID: `{payment.telegram_payment_charge_id}`\n"
            f"• Case Type: {case_type.title()}\n"
            f"• Amount: {payment.total_amount} Telegram Stars\n"
            f"• Status: Completed ✅\n\n"
            f"🔄 **Return to the app now to see your case opening!**"
        )
        
        await update.message.reply_text(success_message, parse_mode='Markdown')
        
        logger.info(f"[Payment Success] Payment {payment.telegram_payment_charge_id} processed successfully")
        
    except json.JSONDecodeError:
        logger.error("[Payment Success] Invalid JSON payload in successful payment")
        await update.message.reply_text(
            "✅ **Payment Successful!** 💫\n\n"
            "Your payment has been received, but there was an issue processing the order details.\n"
            "Please contact support with your payment confirmation.\n\n"
            f"Payment ID: `{payment.telegram_payment_charge_id}`",
            parse_mode='Markdown'
        )
    except Exception as e:
        logger.error(f"[Payment Success] Error handling successful payment: {e}")
        await update.message.reply_text(
            "✅ **Payment Successful!** 💫\n\n"
            f"Your payment of {payment.total_amount} ⭐ has been processed!\n"
            "However, there was an error processing your order.\n\n"
            "**Don't worry - your payment has been recorded and we will resolve this issue.**\n\n"
            f"Payment ID: `{payment.telegram_payment_charge_id}`\n"
            "Please contact support if your case doesn't open automatically.",
            parse_mode='Markdown'
        )

async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle data sent from the WebApp."""
    try:
        web_app_data = update.message.web_app_data.data
        
        print(f"\n{'='*60}")
        print(f"[WebApp] 🚀 RAW DATA RECEIVED FROM WEBAPP")
        print(f"[WebApp] Raw data length: {len(web_app_data)}")
        print(f"[WebApp] Raw data: {web_app_data}")
        print(f"[WebApp] Message from user: {update.message.from_user.id} (@{update.message.from_user.username})")
        print(f"[WebApp] Chat ID: {update.message.chat.id}")
        print(f"{'='*60}\n")
        
        try:
            data = json.loads(web_app_data)
            logger.info(f"[WebApp] Parsed data successfully: {data}")
            print(f"[WebApp] ✅ Parsed JSON: {data}")
        except json.JSONDecodeError as json_error:
            error_msg = f"❌ Invalid JSON format: {str(json_error)}"
            logger.error(f"[WebApp] JSON parsing error: {json_error}")
            print(f"[WebApp] ❌ JSON Error: {json_error}")
            await update.message.reply_text(error_msg)
            return
        
        action = data.get('action')
        print(f"[WebApp] 🎯 Action detected: {action}")
        
        if action == 'test_connection':
            print(f"[WebApp] 🧪 TEST CONNECTION received!")
            print(f"[WebApp] Test data: {data}")
            await update.message.reply_text(
                "✅ **Bot Connection Test Successful!**\n\n"
                f"📱 WebApp is connected to @UnboxdNFT_bot\n"
                f"👤 User ID: {data.get('user_id', 'Unknown')}\n"
                f"🕐 Timestamp: {data.get('timestamp', 'Unknown')}\n\n"
                "🌟 **Ready to process Telegram Stars payments!**",
                parse_mode='Markdown'
            )
            return
            
        elif action == 'send_stars_invoice':
            case_type = data.get('case_type')
            user_id = data.get('user_id')
            stars_amount = data.get('stars_amount')
            
            print(f"[WebApp] 🌟 STARS INVOICE REQUEST:")
            print(f"[WebApp]   - Case Type: {case_type}")
            print(f"[WebApp]   - User ID: {user_id}")
            print(f"[WebApp]   - Stars Amount: {stars_amount}")
            print(f"[WebApp]   - Expected Price: {CASE_PRICES_STARS.get(case_type, 'Unknown')}")
            
            logger.info(f"[WebApp] Processing stars invoice: case={case_type}, user={user_id}, amount={stars_amount}")
            
            # Validate data
            if not case_type or case_type not in CASE_PRICES_STARS:
                error_msg = f"❌ Invalid case type: {case_type}"
                logger.error(error_msg)
                print(f"[WebApp] ❌ Validation failed: {error_msg}")
                await update.message.reply_text(error_msg)
                return
                
            if CASE_PRICES_STARS[case_type] != stars_amount:
                error_msg = f"❌ Invalid price. Expected {CASE_PRICES_STARS[case_type]}, got {stars_amount}"
                logger.error(error_msg)
                print(f"[WebApp] ❌ Price validation failed: {error_msg}")
                await update.message.reply_text(error_msg)
                return
            
            # Use the message sender's chat ID
            chat_id = update.message.chat.id
            sender_user_id = update.message.from_user.id
            
            print(f"[WebApp] 📋 Invoice Details:")
            print(f"[WebApp]   - Target Chat ID: {chat_id}")
            print(f"[WebApp]   - Sender User ID: {sender_user_id}")
            print(f"[WebApp]   - Requested User ID: {user_id}")
            
            # Prepare invoice
            title = f"{case_type.title()} Case"
            description = f"Open a {case_type} case and get random NFT items!"
            
            payload = json.dumps({
                'case_type': case_type,
                'user_id': sender_user_id,
                'stars_amount': stars_amount,
                'timestamp': int(time.time()),
                'source': 'webapp_stars'
            })
            
            prices = [LabeledPrice(label=title, amount=stars_amount)]
            
            try:
                print(f"[WebApp] 📤 Sending invoice to chat {chat_id}...")
                logger.info(f"[WebApp] Sending invoice to chat {chat_id}...")
                
                message = await context.bot.send_invoice(
                    chat_id=chat_id,
                    title=title,
                    description=description,
                    payload=payload,
                    provider_token="",
                    currency="XTR",
                    prices=prices,
                    start_parameter=f"stars_{case_type}_{int(time.time())}"
                )
                
                print(f"[WebApp] ✅ Invoice sent successfully!")
                print(f"[WebApp]   - Message ID: {message.message_id}")
                print(f"[WebApp]   - Chat ID: {message.chat.id}")
                logger.info(f"[WebApp] Invoice sent successfully! Message ID: {message.message_id}")
                
                # Store invoice in memory
                invoice_id = f"{sender_user_id}_{int(time.time())}"
                invoices_storage[invoice_id] = {
                    'telegram_id': sender_user_id,
                    'case_type': case_type,
                    'stars_amount': stars_amount,
                    'status': 'pending',
                    'payload': payload,
                    'message_id': message.message_id
                }
                logger.info(f"[WebApp] Invoice stored in memory: {invoice_id}")
                print(f"[WebApp] 💾 Invoice stored: {invoice_id}")
                
                # NEW: Store payment context for tracking
                store_payment_context(sender_user_id, case_type, stars_amount, invoice_id)
                print(f"[WebApp] 🎯 Payment context stored for user {sender_user_id}")
                
                await update.message.reply_text(
                    f"✅ **Invoice Created Successfully!**\n\n"
                    f"💫 **{title}** - {stars_amount} ⭐\n"
                    f"📋 Please tap the invoice above to pay with Telegram Stars.\n\n"
                    f"💡 After payment, your case will open automatically in the app!"
                )
                    
            except Exception as invoice_error:
                error_msg = f"❌ Failed to create invoice: {str(invoice_error)}"
                logger.error(f"[WebApp] Invoice error: {invoice_error}")
                print(f"[WebApp] ❌ Invoice creation failed: {invoice_error}")
                await update.message.reply_text(error_msg)
                return
        
        else:
            unknown_action = data.get('action', 'unknown')
            logger.warning(f"[WebApp] Unknown action: {unknown_action}")
            print(f"[WebApp] ❓ Unknown action received: {unknown_action}")
            await update.message.reply_text(f"❓ Unknown action: {unknown_action}")
            
    except Exception as e:
        error_msg = f"❌ Error processing request: {str(e)}"
        logger.error(f"[WebApp] General error: {e}")
        print(f"[WebApp] 🚨 General error: {e}")
        await update.message.reply_text(error_msg)

def main() -> None:
    """Start the bot."""
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
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))

    print("[Bot] Starting UnboxdNFT Telegram Bot (Simplified Version)...")
    print("[Bot] Bot is ready to handle Telegram Stars payments!")
    
    # Run the bot until the user presses Ctrl-C
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main() 