"""Telegram Bot for simple authentication flow."""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import Application, CommandHandler, ContextTypes
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.user import User
from app.models.login_token import LoginToken

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Token expiration (7 days)
TOKEN_EXPIRE_DAYS = 7


def create_short_token(db: Session, user_id: int, telegram_id: int) -> str:
    """Create a short login token."""
    # Generate unique token
    token = LoginToken.generate_token()
    
    # Make sure token is unique
    while db.query(LoginToken).filter(LoginToken.token == token).first():
        token = LoginToken.generate_token()
    
    # Create token record
    login_token = LoginToken(
        token=token,
        user_id=user_id,
        telegram_id=telegram_id,
        expires_at=datetime.now() + timedelta(days=TOKEN_EXPIRE_DAYS)
    )
    db.add(login_token)
    db.commit()
    
    return token


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the /start command - create user and send login link."""
    if not update.effective_user:
        await update.message.reply_text("Sorry, I couldn't identify you. Please try again.")
        return
    
    user_data = update.effective_user
    
    # Get database session
    db: Session = SessionLocal()
    
    try:
        # Find or create user
        user = db.query(User).filter(User.telegram_id == user_data.id).first()
        
        if not user:
            user = User(
                telegram_id=user_data.id,
                username=user_data.username,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                photo_url=None,
                last_login=datetime.now()
            )
            db.add(user)
            logger.info(f"Created new user: {user_data.username} ({user_data.id})")
        else:
            # Update user info
            user.username = user_data.username
            user.first_name = user_data.first_name
            user.last_name = user_data.last_name
            user.last_login = datetime.now()
            logger.info(f"Updated existing user: {user_data.username} ({user_data.id})")
        
        db.commit()
        db.refresh(user)
        
        # Create short token instead of long JWT
        short_token = create_short_token(db, user.id, user.telegram_id)
        
        # Create magic link with short token
        frontend_url = settings.frontend_url
        magic_link = f"{frontend_url}/login?token={short_token}"
        
        # Send welcome message with magic link
        welcome_message = (
            f"👋 Welcome, {user_data.first_name}!\n\n"
            f"🚀 Click the button below to access your Investment Dashboard:\n\n"
            f'<a href=\"{magic_link}\">Login to Dashboard</a>\n\n'
            f"✨ This link is valid for 7 days. Keep it secure!"
        )

        print(welcome_message)
        
        await update.message.reply_text(welcome_message, parse_mode=ParseMode.HTML, disable_web_page_preview=True)
        
    except Exception as e:
        logger.error(f"Error in start_command: {e}")
        await update.message.reply_text(
            "Sorry, something went wrong. Please try again later."
        )
    finally:
        db.close()


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the /help command."""
    help_text = (
        "📊 Investment Dashboard Bot\n\n"
        "Commands:\n"
        "/start - Get your login link\n"
        "/help - Show this help message\n\n"
        "Simply use /start to get a secure link to access your dashboard!"
    )
    await update.message.reply_text(help_text)


def main() -> None:
    """Start the bot."""
    token = settings.telegram_bot_token
    
    if not token:
        logger.error("TELEGRAM_BOT_TOKEN is not set in environment variables!")
        return
    
    # Create the Application
    application = Application.builder().token(token).build()
    
    # Register command handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    
    # Start the bot
    logger.info("Starting bot...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()

