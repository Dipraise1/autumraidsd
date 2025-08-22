# Raid2Earn Telegram Bot

A simple, modern Telegram bot for the Raid2Earn platform. Users can earn SOL by participating in social media campaigns on Twitter/X.

## 🚀 Features

- **Auto Wallet Creation** - Solana wallet generated for each user
- **X Username Collection** - Link your Twitter/X account for tracking
- **Username Verification** - Verify Twitter usernames exist before raids
- **Public Pool Creation** - Create and share raid campaigns publicly
- **Group Integration** - Share pools in Telegram groups and channels
- **Pool Discovery** - Browse trending and public pools
- **Modern Button UI** - No slash commands, just clean buttons
- **Find Raids** - Browse available campaigns
- **Track Balance** - Monitor your SOL earnings and wallet
- **User Profiles** - Complete stats and earnings tracking
- **Simple Navigation** - Intuitive menu system

## 🛠️ Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp env.example .env
   # Edit .env with your bot token and Twitter API credentials
   ```

3. **Get bot token:**
   - Message @BotFather on Telegram
   - Create new bot with `/newbot`
   - Copy the token to `.env`

4. **Set up Twitter API (2025):**
   - Follow the [Twitter Setup Guide](TWITTER_SETUP_2025.md)
   - Get your API keys and Bearer Token
   - Add them to your `.env` file

5. **Run the bot:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## 📱 Bot Commands

- `/start` - Main menu (only command needed)
- `/verify username` - Verify Twitter username exists
- `/sharepool` - Share your pools with groups
- `/browsepools` - Discover public pools

## 🎯 UI Design

- **Clean buttons** instead of text commands
- **Emoji icons** for visual appeal
- **Markdown formatting** for better readability
- **Intuitive navigation** with back buttons
- **Modern 2025 style** interface

## 🔧 Development

```bash
npm run dev      # Start with hot reload
npm run build    # Build for production
npm start        # Run production build
npm run clean    # Clean build files
```

## 📋 TODO

- [x] Add Solana wallet generation for users
- [x] Collect X (Twitter) usernames for tracking
- [x] **NEW: Username verification system**
- [x] Create user profile system
- [x] Display wallet addresses and balances
- [x] Public pool creation functionality
- [x] Group sharing and pool discovery
- [x] Pool management and analytics
- [x] **NEW: Twitter API integration for 2025**
- [ ] Implement automated reward distribution
- [ ] Add admin panel for pool management
- [ ] Add real Solana blockchain integration
- [ ] Add withdrawal functionality

## 🐦 Twitter Integration (2025)

The bot now includes comprehensive Twitter/X integration:

- **Username Verification**: Verify usernames exist before raids
- **OAuth 2.0 Flow**: Secure user authentication
- **Action Verification**: Verify raid completion (tweets, likes, follows)
- **Rate Limit Handling**: Respects Twitter's API limits
- **Public API Access**: Uses Bearer Token for username checks

See [TWITTER_SETUP_2025.md](TWITTER_SETUP_2025.md) for complete setup instructions.

## 🔒 Security Features

- **OAuth 2.0 with PKCE**: Modern authentication flow
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes all user inputs
- **Error Handling**: Graceful failure handling
- **Environment Variables**: Secure credential management
