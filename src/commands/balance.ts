import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { WalletService } from '../services/wallet';

export const balanceCommand = async (ctx: Context) => {
  try {
    const userId = ctx.from?.id.toString() || 'unknown';
    const userProfile = WalletService.getUserProfile(userId);
    
    if (!userProfile || !userProfile.wallet) {
      const startKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🚀 Start Bot', 'back_to_menu')]
      ]);
      
      await ctx.reply('❌ Please start the bot first to create your wallet!', startKeyboard);
      return;
    }

    // Get real blockchain balance
    const realBalance = await WalletService.getRealWalletBalance(userId);
    
    // Get recent transactions from blockchain
    const recentTransactions = await WalletService.getRecentTransactions(userId, 5);
    
    // Get network status
    const networkStatus = await WalletService.getNetworkStatus();
    
    let balanceText = `💰 *Your Real Blockchain Balance*

*Wallet Address:*
\`${userProfile.wallet.publicKey}\`

*Live Balance:*
💰 Available: ${realBalance.toFixed(6)} SOL
📊 Total Earned: ${userProfile.totalEarned.toFixed(6)} SOL
🏆 Rank: ${userProfile.rank}

*Network Status:*
${networkStatus.connected ? '🟢 Connected' : '🔴 Disconnected'}
${networkStatus.connected ? `📡 Slot: ${networkStatus.slot}` : ''}
${networkStatus.connected ? `⏰ Block Time: ${new Date(networkStatus.blockTime * 1000).toLocaleString()}` : ''}

*Recent Blockchain Transactions:*`;

    if (recentTransactions.length > 0) {
      recentTransactions.forEach((tx, index) => {
        const emoji = tx.type === 'receive' ? '✅' : tx.type === 'send' ? '💸' : '🔄';
        const timeAgo = Math.floor((Date.now() - tx.timestamp.getTime()) / (1000 * 60));
        const timeUnit = timeAgo < 60 ? 'min' : 'hours';
        const timeValue = timeAgo < 60 ? timeAgo : Math.floor(timeAgo / 60);
        
        balanceText += `\n${emoji} ${tx.type === 'receive' ? '+' : '-'}${tx.amount.toFixed(6)} SOL - ${tx.type} (${timeValue} ${timeUnit} ago)`;
      });
    } else {
      balanceText += '\n📭 No recent transactions found';
    }

    balanceText += `\n\n*X Account:* ${userProfile.xUsername || 'Not connected'}`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('💸 Withdraw', 'withdraw'),
        Markup.button.callback('📊 Transaction History', 'history')
      ],
      [
        Markup.button.callback('🔗 Connect X', 'connect_x'),
        Markup.button.callback('🔄 Refresh Balance', 'refresh_balance')
      ],
      [Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
    ]);

    await ctx.reply(balanceText, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  } catch (error) {
    console.error('Error in balance command:', error);
    await ctx.reply('❌ Error loading balance. Please try again.');
  }
};
