"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharePoolCommand = void 0;
const telegraf_1 = require("telegraf");
const pool_1 = require("../services/pool");
const sharePoolCommand = async (ctx) => {
    const userId = ctx.from?.id.toString() || 'unknown';
    const userPools = pool_1.PoolService.getPoolsByCreator(userId);
    if (userPools.length === 0) {
        const noPoolsText = `❌ *No Pools to Share*

You haven't created any pools yet. 

*Create a pool first, then share it with your groups!*`;
        const noPoolsKeyboard = telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('🏗️ Create Pool', 'create_pool'),
                telegraf_1.Markup.button.callback('🔍 Browse Pools', 'browse_pools')
            ],
            [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
        ]);
        await ctx.reply(noPoolsText, {
            parse_mode: 'Markdown',
            ...noPoolsKeyboard
        });
        return;
    }
    let shareText = `📢 *Share Your Pools*

*Your Active Pools:*

${userPools.map((pool, index) => {
        const stats = pool_1.PoolService.getPoolStats(pool.id);
        const timeLeft = Math.max(0, pool.expiresAt.getTime() - Date.now());
        const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
        return `${index + 1}. *${pool.name}*
   💰 ${pool.reward} SOL | ⏰ ${hoursLeft}h | 👥 ${stats?.participants || 0}
   ${pool.isPublic ? '✅ Public' : '🔒 Private'} | ${pool.groupName ? `📱 ${pool.groupName}` : ''}`;
    }).join('\n\n')}

*Select a pool to share:*`;
    const poolButtons = userPools.map((pool, index) => [
        telegraf_1.Markup.button.callback(`📢 Share ${pool.name}`, `share_pool_${pool.id}`)
    ]);
    const shareKeyboard = telegraf_1.Markup.inlineKeyboard([
        ...poolButtons,
        [
            telegraf_1.Markup.button.callback('🔗 Share All to Group', 'share_all_to_group'),
            telegraf_1.Markup.button.callback('📊 Pool Analytics', 'pool_analytics')
        ],
        [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
    ]);
    await ctx.reply(shareText, {
        parse_mode: 'Markdown',
        ...shareKeyboard
    });
};
exports.sharePoolCommand = sharePoolCommand;
