import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { PoolService } from '../services/pool';

export const browsePoolsCommand = async (ctx: Context) => {
  const publicPools = PoolService.getPublicPools();
  const trendingPools = PoolService.getTrendingPools(3);

  if (publicPools.length === 0) {
    const noPoolsText = `🔍 *No Public Pools Available*

There are currently no public pools to browse.

*Be the first to create one!*`;

    const noPoolsKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🏗️ Create First Pool', 'create_pool'),
        Markup.button.callback('🔍 Find Raids', 'find_raids')
      ],
      [Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
    ]);

    await ctx.reply(noPoolsText, {
      parse_mode: 'Markdown',
      ...noPoolsKeyboard
    });
    return;
  }

  let browseText = `🔍 *Discover Public Pools*

🔥 *Trending Now:*
${trendingPools.map((pool, index) => {
  const stats = PoolService.getPoolStats(pool.id);
  const timeLeft = Math.max(0, pool.expiresAt.getTime() - Date.now());
  const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
  
  return `${index + 1}. *${pool.name}* 🔥
   💰 ${pool.reward} SOL | ⏰ ${hoursLeft}h | 👥 ${stats?.participants || 0}
   🏷️ ${pool.tags.length > 0 ? pool.tags.slice(0, 3).map(tag => `#${tag}`).join(' ') : 'No tags'}`;
}).join('\n\n')}

📊 *Total Public Pools:* ${publicPools.length}
🎯 *Active Participants:* ${publicPools.reduce((sum, pool) => sum + pool.participants.length, 0)}

*What would you like to do?*`;

  const browseKeyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('🔥 Trending Pools', 'trending_pools'),
      Markup.button.callback('🔍 Search Pools', 'search_pools')
    ],
    [
      Markup.button.callback('📱 By Category', 'pools_by_category'),
      Markup.button.callback('💰 By Reward', 'pools_by_reward')
    ],
    [
      Markup.button.callback('🏗️ Create Pool', 'create_pool'),
      Markup.button.callback('📢 Share Pool', 'share_pool')
    ],
    [Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
  ]);

  await ctx.reply(browseText, {
    parse_mode: 'Markdown',
    ...browseKeyboard
  });
};
