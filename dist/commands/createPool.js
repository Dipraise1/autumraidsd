"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPoolCommand = void 0;
const telegraf_1 = require("telegraf");
const createPoolCommand = async (ctx) => {
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
    const keyboard = telegraf_1.Markup.inlineKeyboard([
        [
            telegraf_1.Markup.button.callback('✏️ Start Creation', 'start_pool_creation')
        ],
        [
            telegraf_1.Markup.button.callback('📋 View My Pools', 'view_my_pools'),
            telegraf_1.Markup.button.callback('🔍 Browse Pools', 'browse_pools')
        ],
        [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
    ]);
    await ctx.reply(createText, {
        parse_mode: 'Markdown',
        ...keyboard
    });
};
exports.createPoolCommand = createPoolCommand;
