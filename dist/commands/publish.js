"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishCommand = void 0;
const telegraf_1 = require("telegraf");
const publishCommand = async (ctx) => {
    const publishText = `📢 *Publish Your Pool*

*Publishing Options:*

1. **Public Announcement** - Share with all users
2. **Targeted Groups** - Share with specific communities
3. **Social Media** - Cross-platform promotion
4. **Analytics** - Track engagement and performance

*Select publishing method:*`;
    const keyboard = telegraf_1.Markup.inlineKeyboard([
        [
            telegraf_1.Markup.button.callback('📢 Public Announcement', 'publish_public'),
            telegraf_1.Markup.button.callback('🎯 Targeted Groups', 'publish_targeted')
        ],
        [
            telegraf_1.Markup.button.callback('📱 Social Media', 'publish_social'),
            telegraf_1.Markup.button.callback('📊 Analytics', 'publish_analytics')
        ],
        [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
    ]);
    await ctx.reply(publishText, {
        parse_mode: 'Markdown',
        ...keyboard
    });
};
exports.publishCommand = publishCommand;
