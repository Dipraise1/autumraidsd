"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.balanceCommand = void 0;
const telegraf_1 = require("telegraf");
const balanceCommand = async (ctx) => {
    const balanceText = `💰 *Your Balance*

*Available:* 0.125 SOL
*Pending:* 0.025 SOL
*Total Earned:* 0.450 SOL

*Recent Activity:*
✅ +0.005 SOL - Raid #1 completed
✅ +0.003 SOL - Raid #2 completed
⏳ +0.025 SOL - Raid #3 pending`;
    const keyboard = telegraf_1.Markup.inlineKeyboard([
        [
            telegraf_1.Markup.button.callback('💸 Withdraw', 'withdraw'),
            telegraf_1.Markup.button.callback('📊 Transaction History', 'history')
        ],
        [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
    ]);
    await ctx.reply(balanceText, {
        parse_mode: 'Markdown',
        ...keyboard
    });
};
exports.balanceCommand = balanceCommand;
