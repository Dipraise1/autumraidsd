"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.huntCommand = void 0;
const telegraf_1 = require("telegraf");
const huntCommand = async (ctx) => {
    const huntText = `🔍 *Hunt for Raids*

*Available Raids:*
🎯 Crypto Project Launch - 0.005 SOL
🎨 NFT Collection - 0.003 SOL
🚀 DeFi Protocol - 0.008 SOL

*Select a raid to join:*`;
    const keyboard = telegraf_1.Markup.inlineKeyboard([
        [
            telegraf_1.Markup.button.callback('🚀 Join Crypto Launch', 'join_crypto'),
            telegraf_1.Markup.button.callback('🎨 Join NFT Collection', 'join_nft')
        ],
        [
            telegraf_1.Markup.button.callback('🔗 Join DeFi Protocol', 'join_defi'),
            telegraf_1.Markup.button.callback('🔄 Refresh', 'refresh_hunt')
        ],
        [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
    ]);
    await ctx.reply(huntText, {
        parse_mode: 'Markdown',
        ...keyboard
    });
};
exports.huntCommand = huntCommand;
