# Raid2Earn Telegram Bot

A simple, modern Telegram bot for the Raid2Earn platform. Users can earn SOL by participating in social media campaigns on Twitter/X.

## 🚀 Features

- **Auto Wallet Creation** - Solana wallet generated for each user
- **X Username Collection** - Link your Twitter/X account for tracking
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
   # Edit .env with your bot token
   ```

3. **Get bot token:**
   - Message @BotFather on Telegram
   - Create new bot with `/newbot`
   - Copy the token to `.env`

4. **Run the bot:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## 📱 Bot Commands

- `/start` - Main menu (only command needed)
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
- [x] Create user profile system
- [x] Display wallet addresses and balances
- [x] Public pool creation functionality
- [x] Group sharing and pool discovery
- [x] Pool management and analytics
- [ ] Integrate with X (Twitter) API for verification
- [ ] Implement automated reward distribution
- [ ] Add admin panel for pool management
- [ ] Add real Solana blockchain integration
- [ ] Add withdrawal functionality
