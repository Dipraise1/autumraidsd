"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawCommand = void 0;
const telegraf_1 = require("telegraf");
const wallet_1 = require("../services/wallet");
const withdrawCommand = async (ctx) => {
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
        if (realBalance < 0.001) {
            const lowBalanceText = `❌ *Insufficient Balance*

*Current Blockchain Balance:* ${realBalance.toFixed(6)} SOL
*Minimum Withdrawal:* 0.001 SOL

*Complete more raids to earn SOL!*`;
            const lowBalanceKeyboard = telegraf_1.Markup.inlineKeyboard([
                [
                    telegraf_1.Markup.button.callback('🔍 Find Raids', 'find_raids'),
                    telegraf_1.Markup.button.callback('🔙 Back to Balance', 'my_balance')
                ]
            ]);
            await ctx.reply(lowBalanceText, {
                parse_mode: 'Markdown',
                ...lowBalanceKeyboard
            });
            return;
        }
        const withdrawText = `💸 *Withdraw SOL from Blockchain*

*Wallet Address:* \`${userProfile.wallet.publicKey}\`
*Available Balance:* ${realBalance.toFixed(6)} SOL
*Minimum Withdrawal:* 0.001 SOL

*Network Fee:* ~0.000005 SOL (estimated)

*Enter the recipient's Solana wallet address and amount to withdraw:*`;
        const withdrawKeyboard = telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('💸 Withdraw All', 'withdraw_all'),
                telegraf_1.Markup.button.callback('💰 Custom Amount', 'custom_withdraw')
            ],
            [
                telegraf_1.Markup.button.callback('📊 Check Balance', 'my_balance'),
                telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')
            ]
        ]);
        await ctx.reply(withdrawText, {
            parse_mode: 'Markdown',
            ...withdrawKeyboard
        });
        // Set user session for withdrawal process
        // This will be handled by the handlers.ts file
    }
    catch (error) {
        console.error('Error in withdraw command:', error);
        await ctx.reply('❌ Error loading withdrawal options. Please try again.');
    }
};
exports.withdrawCommand = withdrawCommand;
