import { Context } from 'telegraf';
import { Markup } from 'telegraf';

export const withdrawCommand = async (ctx: Context) => {
  const withdrawText = `💸 *Withdraw SOL*

*Available Balance:* 0.125 SOL
*Minimum Withdrawal:* 0.001 SOL
*Network Fee:* 0.000005 SOL

*Select withdrawal option:*`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('💸 Withdraw All', 'withdraw_all'),
      Markup.button.callback('💰 Custom Amount', 'custom_withdraw')
    ],
    [
      Markup.button.callback('🏦 Set Wallet', 'set_wallet'),
      Markup.button.callback('📊 Fee Calculator', 'fee_calculator')
    ],
    [Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
  ]);

  await ctx.reply(withdrawText, {
    parse_mode: 'Markdown',
    ...keyboard
  });
};
