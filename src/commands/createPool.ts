import { Context } from 'telegraf';
import { Markup } from 'telegraf';

export const createPoolCommand = async (ctx: Context) => {
  const createText = `🏗️ *Create a New Pool*

*Pool Creation Form:*

Please provide the following details:
• Pool name & description
• Reward per action (in SOL)
• Duration (in hours)
• Required actions
• Budget (in SOL)
• Maximum participants (optional)
• Tags for discovery
• Make it public for groups

*Click "Start Creation" to begin:*`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('✏️ Start Creation', 'start_pool_creation')
    ],
    [
      Markup.button.callback('📋 View My Pools', 'view_my_pools'),
      Markup.button.callback('🔍 Browse Pools', 'browse_pools')
    ],
    [Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
  ]);

  await ctx.reply(createText, {
    parse_mode: 'Markdown',
    ...keyboard
  });
};
