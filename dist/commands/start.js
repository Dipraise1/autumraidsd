"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCommand = void 0;
const telegraf_1 = require("telegraf");
const wallet_1 = require("../services/wallet");
const startCommand = async (ctx) => {
    const telegramId = ctx.from?.id.toString() || 'unknown';
    const telegramUsername = ctx.from?.username;
    // Check if user already exists
    let userProfile = wallet_1.WalletService.getUserProfile(telegramId);
    if (!userProfile) {
        // Create new user with wallet
        userProfile = wallet_1.WalletService.createUserProfile(telegramId, telegramUsername);
        const welcomeText = `🎉 *Welcome to Raid2Earn!*

Your account has been created successfully!

💳 *Your Wallet:*
\`${userProfile.wallet?.publicKey}\`

📊 *Your Stats:*
• Balance: ${userProfile.wallet?.balance.toFixed(3)} SOL
• Rank: ${userProfile.rank}
• Total Earned: ${userProfile.totalEarned.toFixed(3)} SOL

🚀 *Start earning SOL by participating in X (Twitter) campaigns!*

*What would you like to do?*`;
        const keyboard = telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('🔗 Connect X Account', 'connect_x'),
                telegraf_1.Markup.button.callback('🔍 Find Raids', 'find_raids')
            ],
            [
                telegraf_1.Markup.button.callback('💰 My Wallet', 'my_balance'),
                telegraf_1.Markup.button.callback('📊 My Stats', 'my_stats')
            ],
            [
                telegraf_1.Markup.button.callback('🏗️ Create Pool', 'create_pool'),
                telegraf_1.Markup.button.callback('📢 Share Pools', 'share_pool')
            ],
            [
                telegraf_1.Markup.button.callback('🔍 Browse Pools', 'browse_pools'),
                telegraf_1.Markup.button.callback('⚙️ Settings', 'settings')
            ]
        ]);
        await ctx.reply(welcomeText, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    }
    else {
        // Existing user
        const welcomeText = `🚀 *Welcome back to Raid2Earn!*

💳 *Your Wallet:*
\`${userProfile.wallet?.publicKey}\`

📊 *Your Stats:*
• Balance: ${userProfile.wallet?.balance.toFixed(3)} SOL
• Rank: ${userProfile.rank}
• Total Earned: ${userProfile.totalEarned.toFixed(3)} SOL
• X Username: ${userProfile.xUsername || 'Not connected'}

*What would you like to do?*`;
        const keyboard = telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('🔍 Find Raids', 'find_raids'),
                telegraf_1.Markup.button.callback('💰 My Wallet', 'my_balance')
            ],
            [
                telegraf_1.Markup.button.callback('🔗 Connect X Account', 'connect_x'),
                telegraf_1.Markup.button.callback('📊 My Stats', 'my_stats')
            ],
            [
                telegraf_1.Markup.button.callback('🏗️ Create Pool', 'create_pool'),
                telegraf_1.Markup.button.callback('📢 Share Pools', 'share_pool')
            ],
            [
                telegraf_1.Markup.button.callback('🔍 Browse Pools', 'browse_pools'),
                telegraf_1.Markup.button.callback('⚙️ Settings', 'settings')
            ]
        ]);
        await ctx.reply(welcomeText, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    }
};
exports.startCommand = startCommand;
