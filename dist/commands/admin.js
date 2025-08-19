"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCommand = void 0;
const telegraf_1 = require("telegraf");
const adminCommand = async (ctx) => {
    const adminText = `🔐 *Admin Panel*

*Administrative Functions:*

• **User Management** - Ban/unban users, view stats
• **Pool Management** - Approve/reject pools, monitor activity
• **System Health** - Check bot status, performance metrics
• **Analytics** - Platform statistics and insights

*Select admin action:*`;
    const keyboard = telegraf_1.Markup.inlineKeyboard([
        [
            telegraf_1.Markup.button.callback('👥 User Management', 'admin_users'),
            telegraf_1.Markup.button.callback('🏗️ Pool Management', 'admin_pools')
        ],
        [
            telegraf_1.Markup.button.callback('💚 System Health', 'admin_health'),
            telegraf_1.Markup.button.callback('📊 Analytics', 'admin_analytics')
        ],
        [
            telegraf_1.Markup.button.callback('🔒 Raid Lock', 'raid_lock'),
            telegraf_1.Markup.button.callback('📋 Version Info', 'version_info')
        ],
        [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
    ]);
    await ctx.reply(adminText, {
        parse_mode: 'Markdown',
        ...keyboard
    });
};
exports.adminCommand = adminCommand;
