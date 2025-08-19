import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { WalletService } from '../services/wallet';

export const startCommand = async (ctx: Context) => {
  const telegramId = ctx.from?.id.toString() || 'unknown';
  const telegramUsername = ctx.from?.username;
  
  // Check if user already exists
  let userProfile = WalletService.getUserProfile(telegramId);
  
  if (!userProfile) {
    // Create new user with wallet
    userProfile = WalletService.createUserProfile(telegramId, telegramUsername);
    
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

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🔗 Connect X Account', 'connect_x'),
        Markup.button.callback('🔍 Find Raids', 'find_raids')
      ],
      [
        Markup.button.callback('💰 My Wallet', 'my_balance'),
        Markup.button.callback('📊 My Stats', 'my_stats')
      ],
      [
        Markup.button.callback('🏗️ Create Pool', 'create_pool'),
        Markup.button.callback('📢 Share Pools', 'share_pool')
      ],
      [
        Markup.button.callback('🔍 Browse Pools', 'browse_pools'),
        Markup.button.callback('⚙️ Settings', 'settings')
      ]
    ]);

    await ctx.reply(welcomeText, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  } else {
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

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🔍 Find Raids', 'find_raids'),
        Markup.button.callback('💰 My Wallet', 'my_balance')
      ],
      [
        Markup.button.callback('🔗 Connect X Account', 'connect_x'),
        Markup.button.callback('📊 My Stats', 'my_stats')
      ],
      [
        Markup.button.callback('🏗️ Create Pool', 'create_pool'),
        Markup.button.callback('📢 Share Pools', 'share_pool')
      ],
      [
        Markup.button.callback('🔍 Browse Pools', 'browse_pools'),
        Markup.button.callback('⚙️ Settings', 'settings')
      ]
    ]);

    await ctx.reply(welcomeText, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  }
};
