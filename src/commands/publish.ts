import { Context } from 'telegraf';
import { Markup } from 'telegraf';

export const publishCommand = async (ctx: Context) => {
  const publishText = `📢 *Publish Your Pool*

*Publishing Options:*

1. **Public Announcement** - Share with all users
2. **Targeted Groups** - Share with specific communities
3. **Social Media** - Cross-platform promotion
4. **Analytics** - Track engagement and performance

*Select publishing method:*`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('📢 Public Announcement', 'publish_public'),
      Markup.button.callback('🎯 Targeted Groups', 'publish_targeted')
    ],
    [
      Markup.button.callback('📱 Social Media', 'publish_social'),
      Markup.button.callback('📊 Analytics', 'publish_analytics')
    ],
    [Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
  ]);

  await ctx.reply(publishText, {
    parse_mode: 'Markdown',
    ...keyboard
  });
};
