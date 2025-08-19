import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { PoolService } from '../services/pool';

export const sharePoolCommand = async (ctx: Context) => {
  const userId = ctx.from?.id.toString() || 'unknown';
  const userPools = PoolService.getPoolsByCreator(userId);

  if (userPools.length === 0) {
    const noPoolsText = `❌ *No Pools to Share*

You haven't created any pools yet. 

*Create a pool first, then share it with your groups!*`;

    const noPoolsKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🏗️ Create Pool', 'create_pool'),
        Markup.button.callback('🔍 Browse Pools', 'browse_pools')
      ],
      [Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
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
  const stats = PoolService.getPoolStats(pool.id);
  const timeLeft = Math.max(0, pool.expiresAt.getTime() - Date.now());
  const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
  
  return `${index + 1}. *${pool.name}*
   💰 ${pool.reward} SOL | ⏰ ${hoursLeft}h | 👥 ${stats?.participants || 0}
   ${pool.isPublic ? '✅ Public' : '🔒 Private'} | ${pool.groupName ? `📱 ${pool.groupName}` : ''}`;
}).join('\n\n')}

*Select a pool to share:*`;

  const poolButtons = userPools.map((pool, index) => [
    Markup.button.callback(`📢 Share ${pool.name}`, `share_pool_${pool.id}`)
  ]);

  const shareKeyboard = Markup.inlineKeyboard([
    ...poolButtons,
    [
      Markup.button.callback('🔗 Share All to Group', 'share_all_to_group'),
      Markup.button.callback('📊 Pool Analytics', 'pool_analytics')
    ],
    [Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
  ]);

  await ctx.reply(shareText, {
    parse_mode: 'Markdown',
    ...shareKeyboard
  });
};
