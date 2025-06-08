import os
import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup, LabeledPrice
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, PreCheckoutQueryHandler, MessageHandler, filters
import json
import time
import asyncio
import sqlite3

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
# Set higher logging level for httpx to avoid excessive logs
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# ИСПРАВЛЕНИЕ: Безопасное получение токена
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '7548063060:AAFRPyueo070wzlN-Ui0MzKGLXiz1YcUK5U')
if TOKEN == '7548063060:AAFRPyueo070wzlN-Ui0MzKGLXiz1YcUK5U' and os.getenv('TELEGRAM_BOT_TOKEN') is None:
    logger.warning("Using hardcoded token. Please set TELEGRAM_BOT_TOKEN environment variable for production.")

# IMPORTANT: Updated to match user's actual bot username
BOT_USERNAME = "unboxdnft_bot"  # Changed from UnboxdNFT_bot to match @unboxdnft_bot

# ИСПРАВЛЕНИЕ: Правильный URL WebApp
WEBAPP_URL = "https://stepan3301.github.io/unboxd_nft/index.html"  # Изменено с webapp.html на index.html

# Case prices in Telegram Stars
CASE_PRICES_STARS = {
    'labubu': 1,
    'darkaura': 2,
    'girlish': 3,
    'newmoney': 5
}

# ИСПРАВЛЕНИЕ: Добавить персистентное хранение (SQLite для простоты)
def init_database():
    """Initialize SQLite database for storing invoices and payments"""
    conn = sqlite3.connect('bot_data.db')
    cursor = conn.cursor()
    
    # Create invoices table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            telegram_id INTEGER,
            case_type TEXT,
            stars_amount INTEGER,
            status TEXT,
            payload TEXT,
            invoice_link TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create payments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            telegram_id INTEGER,
            case_type TEXT,
            stars_amount INTEGER,
            telegram_payment_charge_id TEXT,
            provider_payment_charge_id TEXT,
            payload TEXT,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_database()

# NEW: Payment context storage to track active payments
payment_contexts = {}  # user_id -> {case_type, stars_amount, timestamp, invoice_id}

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
        'timestamp': int(time.time()),
        'source': 'inline_button'
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
        
        # Store invoice in database
        conn = sqlite3.connect('bot_data.db')
        cursor = conn.cursor()
        invoice_id = f"{query.from_user.id}_{int(time.time())}"
        
        cursor.execute('''
            INSERT INTO invoices (id, telegram_id, case_type, stars_amount, status, payload)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (invoice_id, query.from_user.id, case_type, stars_price, 'pending', payload))
        
        conn.commit()
        conn.close()
        logger.info(f"Invoice stored: {invoice_id}")
            
    except Exception as e:
        logger.error(f"Error sending invoice: {e}")
        await query.edit_message_text("Sorry, there was an error creating the invoice. Please try again.")

async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """ИСПРАВЛЕННАЯ версия обработки данных от WebApp"""
    try:
        web_app_data = update.message.web_app_data.data
        data = json.loads(web_app_data)
        action = data.get('action')
        
        if action == 'get_invoice_link':
            case_type = data.get('case_type')
            user_id = data.get('user_id')
            stars_amount = data.get('stars_amount')
            
            # Validate data
            if not case_type or case_type not in CASE_PRICES_STARS:
                await update.message.reply_text("❌ Invalid case type")
                return
                
            if CASE_PRICES_STARS[case_type] != stars_amount:
                await update.message.reply_text("❌ Invalid price")
                return
            
            sender_user_id = update.message.from_user.id
            
            # Create invoice
            title = f"{case_type.title()} Case"
            description = f"Open a {case_type} case and get random NFT items!"
            
            payload = json.dumps({
                'case_type': case_type,
                'user_id': sender_user_id,
                'stars_amount': stars_amount,
                'timestamp': int(time.time()),
                'source': 'webapp_invoice_link'
            })
            
            prices = [LabeledPrice(label=title, amount=stars_amount)]
            
            try:
                # Create invoice link
                invoice_link = await context.bot.create_invoice_link(
                    title=title,
                    description=description,
                    payload=payload,
                    provider_token="",  # Empty for Telegram Stars
                    currency="XTR",
                    prices=prices
                )
                
                # Store in database
                conn = sqlite3.connect('bot_data.db')
                cursor = conn.cursor()
                invoice_id = f"{sender_user_id}_{int(time.time())}"
                
                cursor.execute('''
                    INSERT INTO invoices (id, telegram_id, case_type, stars_amount, status, payload, invoice_link)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (invoice_id, sender_user_id, case_type, stars_amount, 'pending', payload, invoice_link))
                
                conn.commit()
                conn.close()
                
                # ИСПРАВЛЕНИЕ: Отправить ссылку обратно в WebApp
                # Используем специальный формат сообщения, который WebApp может обработать
                response_data = {
                    'action': 'invoice_link_response',
                    'success': True,
                    'invoice_link': invoice_link,
                    'case_type': case_type,
                    'stars_amount': stars_amount,
                    'invoice_id': invoice_id
                }
                
                # Отправляем ответ в чат (WebApp может его перехватить)
                await update.message.reply_text(
                    f"✅ Invoice created!\n\nInvoice data: {json.dumps(response_data)}",
                    parse_mode='Markdown'
                )
                
                # АЛЬТЕРНАТИВНОЕ РЕШЕНИЕ: Использовать inline кнопку с invoice_link
                keyboard = [[InlineKeyboardButton("💫 Pay with Stars", url=invoice_link)]]
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                await update.message.reply_text(
                    f"💫 **{title}** - {stars_amount} ⭐\n\n"
                    f"Click the button below to pay with Telegram Stars:",
                    reply_markup=reply_markup,
                    parse_mode='Markdown'
                )
                    
            except Exception as invoice_error:
                logger.error(f"Invoice creation error: {invoice_error}")
                await update.message.reply_text(f"❌ Failed to create invoice: {str(invoice_error)}")
                
    except Exception as e:
        logger.error(f"WebApp data handling error: {e}")
        await update.message.reply_text(f"❌ Error: {str(e)}")

async def pre_checkout_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle pre-checkout queries for payment validation."""
    query = update.pre_checkout_query
    
    try:
        logger.info(f"[Pre-Checkout] Query received: {query.id}")
        
        payload_data = json.loads(query.invoice_payload)
        case_type = payload_data.get('case_type')
        user_id = payload_data.get('user_id')
        
        logger.info(f"[Pre-Checkout] Validating: User {user_id}, Case {case_type}, Amount {query.total_amount}")
        
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
        
        # All validations passed
        logger.info(f"[Pre-Checkout] Validation successful for user {user_id}")
        await query.answer(ok=True)
        
    except Exception as e:
        logger.error(f"[Pre-Checkout] Error: {e}")
        await query.answer(ok=False, error_message="Payment validation failed.")

async def successful_payment_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """ИСПРАВЛЕННАЯ обработка успешных платежей"""
    payment = update.message.successful_payment
    
    try:
        payload_data = json.loads(payment.invoice_payload)
        case_type = payload_data.get('case_type')
        user_id = payload_data.get('user_id')
        
        # Store payment in database
        conn = sqlite3.connect('bot_data.db')
        cursor = conn.cursor()
        payment_id = f"{user_id}_{int(time.time())}"
        
        cursor.execute('''
            INSERT INTO payments (id, telegram_id, case_type, stars_amount, telegram_payment_charge_id, 
                                provider_payment_charge_id, payload, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (payment_id, user_id, case_type, payment.total_amount, 
              payment.telegram_payment_charge_id, payment.provider_payment_charge_id, 
              payment.invoice_payload, 'completed'))
        
        conn.commit()
        conn.close()
        
        # Send success message
        success_message = (
            f"🎉 **PAYMENT SUCCESSFUL!** 🎉\n\n"
            f"💫 **{case_type.title()} Case** purchased for **{payment.total_amount} ⭐**\n\n"
            f"✅ Your case will open automatically in the WebApp!\n\n"
            f"📋 **Receipt:**\n"
            f"• Transaction ID: `{payment.telegram_payment_charge_id}`\n"
            f"• Case: {case_type.title()}\n"
            f"• Amount: {payment.total_amount} Stars\n\n"
            f"🔄 **Return to the app to see your case opening!**"
        )
        
        await update.message.reply_text(success_message, parse_mode='Markdown')
        
        # НОВОЕ: Уведомить WebApp о успешном платеже
        # Отправляем специальное сообщение, которое WebApp может обработать
        notification_data = {
            'action': 'payment_success',
            'case_type': case_type,
            'payment_id': payment.telegram_payment_charge_id,
            'stars_amount': payment.total_amount
        }
        
        await update.message.reply_text(
            f"Payment notification: {json.dumps(notification_data)}",
            parse_mode='Markdown'
        )
        
    except Exception as e:
        logger.error(f"Payment processing error: {e}")
        await update.message.reply_text(
            "✅ Payment received but there was an error processing it. "
            "Please contact support with your payment ID: "
            f"`{payment.telegram_payment_charge_id}`",
            parse_mode='Markdown'
        )

def main() -> None:
    """Start the bot."""
    # Create the Application
    application = Application.builder().token(TOKEN).build()

    # Add handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("about", about_command))
    application.add_handler(CommandHandler("balance", balance_command))
    application.add_handler(CommandHandler("buy_case", buy_case_command))
    
    # Add callback query handler for buttons
    application.add_handler(CallbackQueryHandler(button_callback, pattern="^(start|about)$"))
    application.add_handler(CallbackQueryHandler(handle_buy_case_callback, pattern="^buy_case_"))
    
    # Add payment handlers
    application.add_handler(PreCheckoutQueryHandler(pre_checkout_callback))
    application.add_handler(MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment_callback))
    
    # Add WebApp data handler
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))

    # Run the bot
    logger.info("Starting bot...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main() 