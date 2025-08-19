import { Context } from 'telegraf';
import { Markup } from 'telegraf';

export const balanceCommand = async (ctx: Context) => {
  const balanceText = `💰 *Your Balance*

*Available:* 0.125 SOL
*Pending:* 0.025 SOL
*Total Earned:* 0.450 SOL

*Recent Activity:*
✅ +0.005 SOL - Raid #1 completed
✅ +0.003 SOL - Raid #2 completed
⏳ +0.025 SOL - Raid #3 pending`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('💸 Withdraw', 'withdraw'),
      Markup.button.callback('📊 Transaction History', 'history')
    ],
    [Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
  ]);

  await ctx.reply(balanceText, {
    parse_mode: 'Markdown',
    ...keyboard
  });
};
