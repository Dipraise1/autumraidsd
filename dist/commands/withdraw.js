"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawCommand = void 0;
const telegraf_1 = require("telegraf");
const withdrawCommand = async (ctx) => {
    const withdrawText = `💸 *Withdraw SOL*

*Available Balance:* 0.125 SOL
*Minimum Withdrawal:* 0.001 SOL
*Network Fee:* 0.000005 SOL

*Select withdrawal option:*`;
    const keyboard = telegraf_1.Markup.inlineKeyboard([
        [
            telegraf_1.Markup.button.callback('💸 Withdraw All', 'withdraw_all'),
            telegraf_1.Markup.button.callback('💰 Custom Amount', 'custom_withdraw')
        ],
        [
            telegraf_1.Markup.button.callback('🏦 Set Wallet', 'set_wallet'),
            telegraf_1.Markup.button.callback('📊 Fee Calculator', 'fee_calculator')
        ],
        [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
    ]);
    await ctx.reply(withdrawText, {
        parse_mode: 'Markdown',
        ...keyboard
    });
};
exports.withdrawCommand = withdrawCommand;
