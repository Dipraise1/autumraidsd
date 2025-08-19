import { Context } from 'telegraf';
import { Markup } from 'telegraf';

export const adminCommand = async (ctx: Context) => {
  const adminText = `🔐 *Admin Panel*

*Administrative Functions:*

• **User Management** - Ban/unban users, view stats
• **Pool Management** - Approve/reject pools, monitor activity
• **System Health** - Check bot status, performance metrics
• **Analytics** - Platform statistics and insights

*Select admin action:*`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('👥 User Management', 'admin_users'),
      Markup.button.callback('🏗️ Pool Management', 'admin_pools')
    ],
    [
      Markup.button.callback('💚 System Health', 'admin_health'),
      Markup.button.callback('📊 Analytics', 'admin_analytics')
    ],
    [
      Markup.button.callback('🔒 Raid Lock', 'raid_lock'),
      Markup.button.callback('📋 Version Info', 'version_info')
    ],
    [Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
  ]);

  await ctx.reply(adminText, {
    parse_mode: 'Markdown',
    ...keyboard
  });
};
