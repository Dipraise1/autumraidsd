import { Context } from 'telegraf';
import { Markup } from 'telegraf';

export const huntCommand = async (ctx: Context) => {
  const huntText = `🔍 *Hunt for Raids*

*Available Raids:*
🎯 Crypto Project Launch - 0.005 SOL
🎨 NFT Collection - 0.003 SOL
🚀 DeFi Protocol - 0.008 SOL

*Select a raid to join:*`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('🚀 Join Crypto Launch', 'join_crypto'),
      Markup.button.callback('🎨 Join NFT Collection', 'join_nft')
    ],
    [
      Markup.button.callback('🔗 Join DeFi Protocol', 'join_defi'),
      Markup.button.callback('🔄 Refresh', 'refresh_hunt')
    ],
    [Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
  ]);

  await ctx.reply(huntText, {
    parse_mode: 'Markdown',
    ...keyboard
  });
};
