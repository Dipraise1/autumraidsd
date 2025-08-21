"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.balanceCommand = void 0;
const telegraf_1 = require("telegraf");
const wallet_1 = require("../services/wallet");
const balanceCommand = async (ctx) => {
    try {
        const userId = ctx.from?.id.toString() || 'unknown';
        const userProfile = wallet_1.WalletService.getUserProfile(userId);
        if (!userProfile || !userProfile.wallet) {
            const startKeyboard = telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🚀 Start Bot', 'back_to_menu')]
            ]);
            await ctx.reply('❌ Please start the bot first to create your wallet!', startKeyboard);
            return;
        }
        // Get real blockchain balance
        const realBalance = await wallet_1.WalletService.getRealWalletBalance(userId);
        // Get recent transactions from blockchain
        const recentTransactions = await wallet_1.WalletService.getRecentTransactions(userId, 5);
        // Get network status
        const networkStatus = await wallet_1.WalletService.getNetworkStatus();
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
        }
        else {
            balanceText += '\n📭 No recent transactions found';
        }
        balanceText += `\n\n*X Account:* ${userProfile.xUsername || 'Not connected'}`;
        const keyboard = telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('💸 Withdraw', 'withdraw'),
                telegraf_1.Markup.button.callback('📊 Transaction History', 'history')
            ],
            [
                telegraf_1.Markup.button.callback('🔗 Connect X', 'connect_x'),
                telegraf_1.Markup.button.callback('🔄 Refresh Balance', 'refresh_balance')
            ],
            [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
        ]);
        await ctx.reply(balanceText, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    }
    catch (error) {
        console.error('Error in balance command:', error);
        await ctx.reply('❌ Error loading balance. Please try again.');
    }
};
exports.balanceCommand = balanceCommand;
