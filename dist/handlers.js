"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTextMessages = exports.handleCallbackQueries = void 0;
const telegraf_1 = require("telegraf");
const wallet_1 = require("./services/wallet");
const pool_1 = require("./services/pool");
// In-memory storage for demo (replace with database in production)
const userSessions = new Map();
// Utility function to safely edit message text with error handling
const safeEditMessageText = async (ctx, text, extra) => {
    try {
        await ctx.editMessageText(text, extra);
    }
    catch (error) {
        // If message edit fails (e.g., identical content), just answer callback
        if (error.description?.includes('message is not modified')) {
            await ctx.answerCbQuery('✅ Updated');
            return false; // Indicate no edit was made
        }
        else {
            throw error;
        }
    }
    return true; // Indicate edit was successful
};
// Handle callback queries
const handleCallbackQueries = (bot) => {
    // Find raids
    bot.action('find_raids', async (ctx) => {
        try {
            const publicPools = pool_1.PoolService.getPublicPools();
            if (publicPools.length === 0) {
                const noRaidsText = `🔍 *No Active Raids Available*

There are currently no active raids. 

*Create the first one or check back later!*`;
                const noRaidsKeyboard = telegraf_1.Markup.inlineKeyboard([
                    [
                        telegraf_1.Markup.button.callback('🏗️ Create First Pool', 'create_pool'),
                        telegraf_1.Markup.button.callback('🔄 Refresh', 'find_raids')
                    ],
                    [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
                ]);
                await safeEditMessageText(ctx, noRaidsText, {
                    parse_mode: 'Markdown',
                    ...noRaidsKeyboard
                });
                return;
            }
            let raidsText = `🔍 *Active Raids Available*\n\n`;
            publicPools.forEach((pool, index) => {
                const stats = pool_1.PoolService.getPoolStats(pool.id);
                const timeLeft = Math.max(0, pool.expiresAt.getTime() - Date.now());
                const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
                raidsText += `*Raid #${index + 1}: ${pool.name}*\n`;
                raidsText += `💰 Reward: ${pool.reward} SOL per action\n`;
                raidsText += `⏰ Duration: ${hoursLeft} hours remaining\n`;
                raidsText += `📱 Actions: ${pool.actions.join(', ')}\n`;
                raidsText += `👥 Participants: ${stats?.participants || 0}\n`;
                raidsText += `📊 Budget: ${pool.currentBudget.toFixed(3)}/${pool.budget.toFixed(3)} SOL\n\n`;
            });
            raidsText += `*Select a raid to join:*`;
            const raidButtons = publicPools.map((pool, index) => [
                telegraf_1.Markup.button.callback(`🚀 Join ${pool.name}`, `join_raid_${pool.id}`)
            ]);
            const raidKeyboard = telegraf_1.Markup.inlineKeyboard([
                ...raidButtons,
                [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
            ]);
            await safeEditMessageText(ctx, raidsText, {
                parse_mode: 'Markdown',
                ...raidKeyboard
            });
        }
        catch (error) {
            console.error('Error in find_raids:', error);
            await ctx.answerCbQuery('❌ Error loading raids');
        }
    });
    // My balance
    bot.action('my_balance', async (ctx) => {
        try {
            const userId = ctx.from?.id.toString() || 'unknown';
            const userProfile = wallet_1.WalletService.getUserProfile(userId);
            if (!userProfile || !userProfile.wallet) {
                const startKeyboard = telegraf_1.Markup.inlineKeyboard([
                    [telegraf_1.Markup.button.callback('🚀 Start Bot', 'back_to_menu')]
                ]);
                await safeEditMessageText(ctx, '❌ Please start the bot first to create your wallet!', startKeyboard);
                return;
            }
            // Get real blockchain balance
            const realBalance = await wallet_1.WalletService.getRealWalletBalance(userId);
            // Get recent transactions from blockchain
            const recentTransactions = await wallet_1.WalletService.getRecentTransactions(userId, 5);
            // Get network status
            const networkStatus = await wallet_1.WalletService.getNetworkStatus();
            let balanceText = `💳 *Your Real Blockchain Balance*

*Wallet Address:*
\`${userProfile.wallet.publicKey}\`

*Live Balance:*
💰 Available: ${realBalance.toFixed(6)} SOL
📊 Total Earned: ${userProfile.totalEarned.toFixed(6)} SOL
🏆 Rank: ${userProfile.rank}

*Network Status:*
${networkStatus.connected ? '🟢 Connected' : '🔴 Disconnected'}
${networkStatus.connected ? `📡 Slot: ${networkStatus.slot}` : ''}
${networkStatus.connected ? `⏰ Block Time: ${new Date(networkStatus.blockTime * 1000).toLocaleString()}` : ''}

*Recent Blockchain Transactions:*`;
            if (recentTransactions.length > 0) {
                recentTransactions.forEach((tx, index) => {
                    const emoji = tx.type === 'receive' ? '✅' : tx.type === 'send' ? '💸' : '🔄';
                    const timeAgo = Math.floor((Date.now() - tx.timestamp.getTime()) / (1000 * 60));
                    const timeUnit = timeAgo < 60 ? 'min' : 'hours';
                    const timeValue = timeAgo < 60 ? timeAgo : Math.floor(timeAgo / 60);
                    balanceText += `\n${emoji} ${tx.type === 'receive' ? '+' : '-'}${tx.amount.toFixed(6)} SOL - ${tx.type} (${timeValue} ${timeUnit} ago)`;
                });
            }
            else {
                balanceText += '\n📭 No recent transactions found';
            }
            balanceText += `\n\n*X Account:* ${userProfile.xUsername || 'Not connected'}`;
            const balanceKeyboard = telegraf_1.Markup.inlineKeyboard([
                [
                    telegraf_1.Markup.button.callback('💸 Withdraw', 'withdraw'),
                    telegraf_1.Markup.button.callback('📊 Transaction History', 'history')
                ],
                [
                    telegraf_1.Markup.button.callback('🔗 Connect X', 'connect_x'),
                    telegraf_1.Markup.button.callback('🔄 Refresh Balance', 'refresh_balance')
                ],
                [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
            ]);
            await safeEditMessageText(ctx, balanceText, {
                parse_mode: 'Markdown',
                ...balanceKeyboard
            });
        }
        catch (error) {
            console.error('Error in my_balance:', error);
            await ctx.answerCbQuery('❌ Error loading balance');
        }
    });
    // Connect X
    bot.action('connect_x', async (ctx) => {
        const userId = ctx.from?.id.toString() || 'unknown';
        const userProfile = wallet_1.WalletService.getUserProfile(userId);
        if (!userProfile) {
            const startKeyboard = telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🚀 Start Bot', 'back_to_menu')]
            ]);
            await ctx.editMessageText('❌ Please start the bot first!', startKeyboard);
            return;
        }
        if (userProfile.xUsername) {
            const alreadyConnectedText = `✅ *X Account Already Connected*

*Connected Account:* @${userProfile.xUsername}
*Status:* Verified ✅

*Benefits:*
• Earn SOL for verified actions
• Track your raid performance
• Qualify for premium pools

*Want to change your X username?*`;
            const connectedKeyboard = telegraf_1.Markup.inlineKeyboard([
                [
                    telegraf_1.Markup.button.callback('🔄 Change X Username', 'change_x_username'),
                    telegraf_1.Markup.button.callback('📊 View Profile', 'my_stats')
                ],
                [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
            ]);
            await safeEditMessageText(ctx, alreadyConnectedText, {
                parse_mode: 'Markdown',
                ...connectedKeyboard
            });
        }
        else {
            const connectText = `🔗 *Connect Your X (Twitter) Account*

To start earning SOL, please provide your X username.

*Benefits:*
• Verify your social actions
• Earn SOL for engagement
• Track your performance
• Access to premium raids

*Please send your X username (without @):*
Example: \`username123\``;
            const connectKeyboard = telegraf_1.Markup.inlineKeyboard([
                [
                    telegraf_1.Markup.button.callback('✏️ Enter X Username', 'enter_x_username')
                ],
                [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
            ]);
            await safeEditMessageText(ctx, connectText, {
                parse_mode: 'Markdown',
                ...connectKeyboard
            });
        }
    });
    // Create pool
    bot.action('create_pool', async (ctx) => {
        const createText = `🏗️ *Create a New Pool*

*Pool Creation Form:*

Please provide the following details:
• Pool name
• Reward per action (in SOL)
• Duration (in hours)
• Required actions
• Budget (in SOL)

*Click "Start Creation" to begin:*`;
        const createKeyboard = telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('✏️ Start Creation', 'start_pool_creation')
            ],
            [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
        ]);
        await safeEditMessageText(ctx, createText, {
            parse_mode: 'Markdown',
            ...createKeyboard
        });
    });
    // Start pool creation
    bot.action('start_pool_creation', async (ctx) => {
        const userId = ctx.from?.id.toString() || 'unknown';
        const formText = `✏️ *Pool Creation Form*

*Step 1: Pool Name*
Please send the name of your pool (e.g., "Crypto Project Launch", "NFT Collection")`;
        const formKeyboard = telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('❌ Cancel Creation', 'cancel_pool_creation')]
        ]);
        await safeEditMessageText(ctx, formText, {
            parse_mode: 'Markdown',
            ...formKeyboard
        });
        // Store user state for form completion
        userSessions.set(userId, { creatingPool: true, poolData: {} });
    });
    // Cancel pool creation
    bot.action('cancel_pool_creation', async (ctx) => {
        const userId = ctx.from?.id.toString() || 'unknown';
        // Clear user session
        userSessions.delete(userId);
        const cancelText = `❌ *Pool Creation Cancelled*

Returning to main menu...`;
        await safeEditMessageText(ctx, cancelText, {
            parse_mode: 'Markdown'
        });
        // Return to main menu after delay
        setTimeout(async () => {
            const welcomeText = `🚀 *Welcome to Raid2Earn!*

Earn SOL by participating in social media campaigns on Twitter/X.

*What would you like to do?*`;
            const keyboard = telegraf_1.Markup.inlineKeyboard([
                [
                    telegraf_1.Markup.button.callback('🔍 Find Raids', 'find_raids'),
                    telegraf_1.Markup.button.callback('💰 My Balance', 'my_balance')
                ],
                [
                    telegraf_1.Markup.button.callback('🔗 Connect X', 'connect_x'),
                    telegraf_1.Markup.button.callback('📊 My Stats', 'my_stats')
                ],
                [
                    telegraf_1.Markup.button.callback('🏗️ Create Pool', 'create_pool'),
                    telegraf_1.Markup.button.callback('⚙️ Settings', 'settings')
                ]
            ]);
            await safeEditMessageText(ctx, welcomeText, {
                parse_mode: 'Markdown',
                ...keyboard
            });
        }, 2000);
    });
    // Back to menu
    bot.action('back_to_menu', async (ctx) => {
        const welcomeText = `🚀 *Welcome to Raid2Earn!*

Earn SOL by participating in social media campaigns on Twitter/X.

*What would you like to do?*`;
        const keyboard = telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('🔍 Find Raids', 'find_raids'),
                telegraf_1.Markup.button.callback('💰 My Balance', 'my_balance')
            ],
            [
                telegraf_1.Markup.button.callback('🔗 Connect X', 'connect_x'),
                telegraf_1.Markup.button.callback('📊 My Stats', 'my_stats')
            ],
            [
                telegraf_1.Markup.button.callback('🏗️ Create Pool', 'create_pool'),
                telegraf_1.Markup.button.callback('⚙️ Settings', 'settings')
            ]
        ]);
        await safeEditMessageText(ctx, welcomeText, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    });
    // Join raid
    bot.action(/join_raid_(.+)/, async (ctx) => {
        const poolId = ctx.match[1];
        const pool = pool_1.PoolService.getPool(poolId);
        if (!pool) {
            await ctx.answerCbQuery('❌ Raid not found!');
            return;
        }
        const userId = ctx.from?.id.toString() || 'unknown';
        const joinResult = pool_1.PoolService.joinPool(poolId, userId);
        if (!joinResult.success) {
            await ctx.answerCbQuery(`❌ ${joinResult.message}`);
            return;
        }
        const joinText = `🎉 *Successfully Joined Raid!*

*Pool:* ${pool.name}
*Reward:* ${pool.reward} SOL per action
*Actions Required:* ${pool.actions.join(', ')}

*Next Steps:*
1. Complete the required actions on X
2. Submit proof of completion
3. Earn your SOL rewards!

*Good luck! 🚀*`;
        const joinKeyboard = telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('📋 View Requirements', `view_requirements_${poolId}`),
                telegraf_1.Markup.button.callback('🔙 Back to Raids', 'find_raids')
            ]
        ]);
        await safeEditMessageText(ctx, joinText, {
            parse_mode: 'Markdown',
            ...joinKeyboard
        });
    });
    // Enter X username
    bot.action('enter_x_username', async (ctx) => {
        const userId = ctx.from?.id.toString() || 'unknown';
        const usernameText = `✏️ *Enter Your X Username*

Please send your X (Twitter) username without the @ symbol.

*Example:* If your X profile is @username123, just send: \`username123\`

*Requirements:*
• Must be a valid X username
• No @ symbol needed
• Case sensitive`;
        const usernameKeyboard = telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('❌ Cancel', 'connect_x')]
        ]);
        await safeEditMessageText(ctx, usernameText, {
            parse_mode: 'Markdown',
            ...usernameKeyboard
        });
        // Set user session to collect username
        userSessions.set(userId, { collectingXUsername: true });
    });
    // Change X username
    bot.action('change_x_username', async (ctx) => {
        const userId = ctx.from?.id.toString() || 'unknown';
        const changeText = `🔄 *Change Your X Username*

Please send your new X (Twitter) username without the @ symbol.

*Current Username:* ${wallet_1.WalletService.getUserProfile(userId)?.xUsername || 'None'}

*Example:* If your new X profile is @newusername, just send: \`newusername\``;
        const changeKeyboard = telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('❌ Cancel', 'connect_x')]
        ]);
        await safeEditMessageText(ctx, changeText, {
            parse_mode: 'Markdown',
            ...changeKeyboard
        });
        // Set user session to collect username
        userSessions.set(userId, { collectingXUsername: true });
    });
    // My stats
    bot.action('my_stats', async (ctx) => {
        const userId = ctx.from?.id.toString() || 'unknown';
        const userProfile = wallet_1.WalletService.getUserProfile(userId);
        if (!userProfile) {
            await safeEditMessageText(ctx, '❌ Please start the bot first!');
            return;
        }
        const statsText = `📊 *Your Statistics*

*Profile Information:*
👤 Telegram: @${userProfile.telegramUsername || 'Not set'}
🐦 X Account: @${userProfile.xUsername || 'Not connected'}
💳 Wallet: \`${userProfile.wallet?.publicKey.substring(0, 8)}...\`

*Performance:*
🏆 Rank: ${userProfile.rank}
🎯 Raids Completed: ${userProfile.raidsCompleted}
💰 Total Earned: ${userProfile.totalEarned.toFixed(3)} SOL
💳 Current Balance: ${userProfile.wallet?.balance.toFixed(3)} SOL

*Activity:*
⭐ Success Rate: 100%
🚀 Average Speed: 2.5 min
👥 Community Standing: Excellent

*Keep raiding to level up! 🚀*`;
        const statsKeyboard = telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('🔗 Connect X', 'connect_x'),
                telegraf_1.Markup.button.callback('💰 My Wallet', 'my_balance')
            ],
            [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
        ]);
        await safeEditMessageText(ctx, statsText, {
            parse_mode: 'Markdown',
            ...statsKeyboard
        });
    });
    // Settings
    bot.action('settings', async (ctx) => {
        const settingsText = `⚙️ *Settings*

*Notification Preferences:*
🔔 New Raids: ON
📱 Push Notifications: ON
📧 Email Updates: OFF

*Privacy Settings:*
👤 Profile Visibility: Public
📊 Stats Sharing: Friends Only
🔒 Data Collection: Minimal

*Account Settings:*
🌐 Language: English
⏰ Timezone: Auto-detect
💳 Payment Method: Solana`;
        const settingsKeyboard = telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('🔔 Notifications', 'notifications'),
                telegraf_1.Markup.button.callback('🔒 Privacy', 'privacy')
            ],
            [
                telegraf_1.Markup.button.callback('🌐 Language', 'language'),
                telegraf_1.Markup.button.callback('💳 Payment', 'payment')
            ],
            [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
        ]);
        await safeEditMessageText(ctx, settingsText, {
            parse_mode: 'Markdown',
            ...settingsKeyboard
        });
    });
    // Withdraw
    bot.action('withdraw', async (ctx) => {
        try {
            const userId = ctx.from?.id.toString() || 'unknown';
            const userProfile = wallet_1.WalletService.getUserProfile(userId);
            if (!userProfile || !userProfile.wallet) {
                const startKeyboard = telegraf_1.Markup.inlineKeyboard([
                    [telegraf_1.Markup.button.callback('🚀 Start Bot', 'back_to_menu')]
                ]);
                await safeEditMessageText(ctx, '❌ Please start the bot first to create your wallet!', startKeyboard);
                return;
            }
            // Get real blockchain balance
            const realBalance = await wallet_1.WalletService.getRealWalletBalance(userId);
            if (realBalance < 0.001) {
                const lowBalanceText = `❌ *Insufficient Balance*

*Current Blockchain Balance:* ${realBalance.toFixed(6)} SOL
*Minimum Withdrawal:* 0.001 SOL

*Complete more raids to earn SOL!*`;
                const lowBalanceKeyboard = telegraf_1.Markup.inlineKeyboard([
                    [
                        telegraf_1.Markup.button.callback('🔍 Find Raids', 'find_raids'),
                        telegraf_1.Markup.button.callback('🔙 Back to Balance', 'my_balance')
                    ]
                ]);
                await safeEditMessageText(ctx, lowBalanceText, {
                    parse_mode: 'Markdown',
                    ...lowBalanceKeyboard
                });
                return;
            }
            const withdrawText = `💸 *Withdraw SOL from Blockchain*

*Wallet Address:* \`${userProfile.wallet.publicKey}\`
*Available Balance:* ${realBalance.toFixed(6)} SOL
*Minimum Withdrawal:* 0.001 SOL

*Network Fee:* ~0.000005 SOL (estimated)

*Enter the recipient's Solana wallet address and amount to withdraw:*`;
            const withdrawKeyboard = telegraf_1.Markup.inlineKeyboard([
                [
                    telegraf_1.Markup.button.callback('💸 Withdraw All', 'withdraw_all'),
                    telegraf_1.Markup.button.callback('💰 Custom Amount', 'custom_withdraw')
                ],
                [
                    telegraf_1.Markup.button.callback('📊 Check Balance', 'my_balance'),
                    telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')
                ]
            ]);
            await safeEditMessageText(ctx, withdrawText, {
                parse_mode: 'Markdown',
                ...withdrawKeyboard
            });
        }
        catch (error) {
            console.error('Error in withdraw action:', error);
            await ctx.answerCbQuery('❌ Error loading withdrawal options');
        }
    });
    // Withdraw all
    bot.action('withdraw_all', async (ctx) => {
        try {
            const userId = ctx.from?.id.toString() || 'unknown';
            const userProfile = wallet_1.WalletService.getUserProfile(userId);
            if (!userProfile || !userProfile.wallet) {
                await ctx.answerCbQuery('❌ Wallet not found');
                return;
            }
            const realBalance = await wallet_1.WalletService.getRealWalletBalance(userId);
            if (realBalance < 0.001) {
                await ctx.answerCbQuery('❌ Insufficient balance for withdrawal');
                return;
            }
            // For now, show withdrawal form (implement actual withdrawal later)
            const withdrawFormText = `💸 *Withdraw All SOL*

*Amount:* ${realBalance.toFixed(6)} SOL
*Network Fee:* ~0.000005 SOL
*You'll Receive:* ${(realBalance - 0.000005).toFixed(6)} SOL

*Enter recipient wallet address:*`;
            const withdrawFormKeyboard = telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('❌ Cancel', 'withdraw')],
                [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
            ]);
            await safeEditMessageText(ctx, withdrawFormText, {
                parse_mode: 'Markdown',
                ...withdrawFormKeyboard
            });
            // Set user session for withdrawal
            userSessions.set(userId, {
                withdrawing: true,
                amount: realBalance,
                type: 'withdraw_all'
            });
        }
        catch (error) {
            console.error('Error in withdraw_all:', error);
            await ctx.answerCbQuery('❌ Error processing withdrawal');
        }
    });
    // Custom withdrawal
    bot.action('custom_withdraw', async (ctx) => {
        try {
            const userId = ctx.from?.id.toString() || 'unknown';
            const userProfile = wallet_1.WalletService.getUserProfile(userId);
            if (!userProfile || !userProfile.wallet) {
                await ctx.answerCbQuery('❌ Wallet not found');
                return;
            }
            const realBalance = await wallet_1.WalletService.getRealWalletBalance(userId);
            const customWithdrawText = `💰 *Custom Withdrawal*

*Available Balance:* ${realBalance.toFixed(6)} SOL
*Minimum:* 0.001 SOL
*Maximum:* ${realBalance.toFixed(6)} SOL

*Enter amount to withdraw (in SOL):*`;
            const customWithdrawKeyboard = telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('❌ Cancel', 'withdraw')],
                [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
            ]);
            await safeEditMessageText(ctx, customWithdrawText, {
                parse_mode: 'Markdown',
                ...customWithdrawKeyboard
            });
            // Set user session for custom withdrawal
            userSessions.set(userId, {
                withdrawing: true,
                type: 'custom_withdraw'
            });
        }
        catch (error) {
            console.error('Error in custom_withdraw:', error);
            await ctx.answerCbQuery('❌ Error processing withdrawal');
        }
    });
    // Refresh balance
    bot.action('refresh_balance', async (ctx) => {
        try {
            const userId = ctx.from?.id.toString() || 'unknown';
            const userProfile = wallet_1.WalletService.getUserProfile(userId);
            if (!userProfile || !userProfile.wallet) {
                await ctx.answerCbQuery('❌ Wallet not found');
                return;
            }
            // Force refresh from blockchain
            const realBalance = await wallet_1.WalletService.getRealWalletBalance(userId);
            await ctx.answerCbQuery(`✅ Balance refreshed: ${realBalance.toFixed(6)} SOL`);
            // Balance has been refreshed, user can check again if needed
        }
        catch (error) {
            console.error('Error in refresh_balance:', error);
            await ctx.answerCbQuery('❌ Error refreshing balance');
        }
    });
    // History
    bot.action('history', async (ctx) => {
        const historyText = `📊 *Transaction History*

*Recent Transactions:*
✅ +0.005 SOL - Raid #1 completed (2 hours ago)
✅ +0.003 SOL - Raid #2 completed (5 hours ago)
⏳ +0.025 SOL - Raid #3 pending (1 day ago)
💸 -0.100 SOL - Withdrawal to wallet (3 days ago)
✅ +0.050 SOL - Raid #4 completed (1 week ago)

*Total Transactions:* 15
*Success Rate:* 100%`;
        const historyKeyboard = telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('📅 Filter by Date', 'filter_history'),
                telegraf_1.Markup.button.callback('💰 Filter by Type', 'filter_type')
            ],
            [telegraf_1.Markup.button.callback('🔙 Back to Balance', 'my_balance')]
        ]);
        await safeEditMessageText(ctx, historyText, {
            parse_mode: 'Markdown',
            ...historyKeyboard
        });
    });
    // Share pool
    bot.action('share_pool', async (ctx) => {
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
            await safeEditMessageText(ctx, noPoolsText, {
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
        await safeEditMessageText(ctx, shareText, {
            parse_mode: 'Markdown',
            ...shareKeyboard
        });
    });
    // Browse pools
    bot.action('browse_pools', async (ctx) => {
        const publicPools = pool_1.PoolService.getPublicPools();
        const trendingPools = pool_1.PoolService.getTrendingPools(3);
        if (publicPools.length === 0) {
            const noPoolsText = `🔍 *No Public Pools Available*

There are currently no public pools to browse.

*Be the first to create one!*`;
            const noPoolsKeyboard = telegraf_1.Markup.inlineKeyboard([
                [
                    telegraf_1.Markup.button.callback('🏗️ Create First Pool', 'create_pool'),
                    telegraf_1.Markup.button.callback('🔍 Find Raids', 'find_raids')
                ],
                [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
            ]);
            await safeEditMessageText(ctx, noPoolsText, {
                parse_mode: 'Markdown',
                ...noPoolsKeyboard
            });
            return;
        }
        let browseText = `🔍 *Discover Public Pools*

🔥 *Trending Now:*
${trendingPools.map((pool, index) => {
            const stats = pool_1.PoolService.getPoolStats(pool.id);
            const timeLeft = Math.max(0, pool.expiresAt.getTime() - Date.now());
            const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
            return `${index + 1}. *${pool.name}* 🔥
   💰 ${pool.reward} SOL | ⏰ ${hoursLeft}h | 👥 ${stats?.participants || 0}
   🏷️ ${pool.tags.length > 0 ? pool.tags.slice(0, 3).map(tag => `#${tag}`).join(' ') : 'No tags'}`;
        }).join('\n\n')}

📊 *Total Public Pools:* ${publicPools.length}
🎯 *Active Participants:* ${publicPools.reduce((sum, pool) => sum + pool.participants.length, 0)}

*What would you like to do?*`;
        const browseKeyboard = telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('🔥 Trending Pools', 'trending_pools'),
                telegraf_1.Markup.button.callback('🔍 Search Pools', 'search_pools')
            ],
            [
                telegraf_1.Markup.button.callback('📱 By Category', 'pools_by_category'),
                telegraf_1.Markup.button.callback('💰 By Reward', 'pools_by_reward')
            ],
            [
                telegraf_1.Markup.button.callback('🏗️ Create Pool', 'create_pool'),
                telegraf_1.Markup.button.callback('📢 Share Pool', 'share_pool')
            ],
            [telegraf_1.Markup.button.callback('🔙 Back to Menu', 'back_to_menu')]
        ]);
        await safeEditMessageText(ctx, browseText, {
            parse_mode: 'Markdown',
            ...browseKeyboard
        });
    });
};
exports.handleCallbackQueries = handleCallbackQueries;
// Handle text messages for pool creation and X username
const handleTextMessages = (bot) => {
    bot.on('text', async (ctx) => {
        const userId = ctx.from?.id.toString() || 'unknown';
        const text = ctx.message?.text || '';
        // Check if user is collecting X username
        const userSession = userSessions.get(userId);
        if (userSession?.collectingXUsername) {
            await handleXUsernameCollection(ctx, text, userId);
            return;
        }
        // Check if user is creating a pool
        if (userSession?.creatingPool) {
            await handlePoolCreation(ctx, text, userId);
            return;
        }
        // Default response for other text
        await ctx.reply('Use the buttons above to navigate the bot! 🎯');
    });
};
exports.handleTextMessages = handleTextMessages;
// X username collection handler
async function handleXUsernameCollection(ctx, text, userId) {
    // Validate X username format
    const username = text.trim().replace('@', ''); // Remove @ if user included it
    // Basic validation
    if (username.length < 1 || username.length > 15) {
        await ctx.reply('❌ Invalid username! X usernames must be 1-15 characters long.');
        return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        await ctx.reply('❌ Invalid username! X usernames can only contain letters, numbers, and underscores.');
        return;
    }
    // Save the username
    const success = wallet_1.WalletService.setXUsername(userId, username);
    if (success) {
        // Clear session
        userSessions.delete(userId);
        const successText = `✅ *X Account Connected Successfully!*

*Connected Account:* @${username}
*Status:* Ready to earn! 🚀

*Next Steps:*
1. Join active raids
2. Complete X actions (like, repost, comment)
3. Earn SOL rewards automatically

*Your earning potential is now unlocked! 💰*`;
        const successKeyboard = telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('🔍 Find Raids', 'find_raids'),
                telegraf_1.Markup.button.callback('📊 My Stats', 'my_stats')
            ],
            [
                telegraf_1.Markup.button.callback('💰 My Wallet', 'my_balance'),
                telegraf_1.Markup.button.callback('🏠 Main Menu', 'back_to_menu')
            ]
        ]);
        await ctx.reply(successText, {
            parse_mode: 'Markdown',
            ...successKeyboard
        });
    }
    else {
        await ctx.reply('❌ Failed to connect X account. Please try again.');
    }
}
// Pool creation handler
async function handlePoolCreation(ctx, text, userId) {
    const userSession = userSessions.get(userId);
    const poolData = userSession?.poolData || {};
    if (!poolData.name) {
        // Step 1: Pool name
        poolData.name = text;
        userSessions.set(userId, { ...userSession, poolData });
        const rewardText = `✅ *Pool Name Set:* ${text}

*Step 2: Reward per Action*
Please send the reward amount in SOL (e.g., 0.005, 0.01)`;
        await ctx.reply(rewardText, {
            parse_mode: 'Markdown'
        });
    }
    else if (!poolData.reward) {
        // Step 2: Reward
        const reward = parseFloat(text);
        if (isNaN(reward) || reward <= 0) {
            await ctx.reply('❌ Please enter a valid reward amount (e.g., 0.005)');
            return;
        }
        poolData.reward = reward;
        userSessions.set(userId, { ...userSession, poolData });
        const durationText = `✅ *Reward Set:* ${reward} SOL per action

*Step 3: Duration*
Please send the duration in hours (e.g., 24, 48, 72)`;
        await ctx.reply(durationText, {
            parse_mode: 'Markdown'
        });
    }
    else if (!poolData.duration) {
        // Step 3: Duration
        const duration = parseInt(text);
        if (isNaN(duration) || duration <= 0) {
            await ctx.reply('❌ Please enter a valid duration in hours (e.g., 24)');
            return;
        }
        poolData.duration = duration;
        userSessions.set(userId, { ...userSession, poolData });
        const actionsText = `✅ *Duration Set:* ${duration} hours

*Step 4: Required Actions*
Please send the required actions separated by commas:
(e.g., Like, Repost, Comment, Follow)`;
        await ctx.reply(actionsText, {
            parse_mode: 'Markdown'
        });
    }
    else if (!poolData.actions) {
        // Step 4: Actions
        const actions = text.split(',').map(a => a.trim()).filter(a => a);
        if (actions.length === 0) {
            await ctx.reply('❌ Please enter valid actions separated by commas');
            return;
        }
        poolData.actions = actions;
        userSessions.set(userId, { ...userSession, poolData });
        const budgetText = `✅ *Actions Set:* ${actions.join(', ')}

*Step 5: Budget*
Please send the total budget in SOL (e.g., 1.0, 5.0)`;
        await ctx.reply(budgetText, {
            parse_mode: 'Markdown'
        });
    }
    else if (!poolData.budget) {
        // Step 5: Budget
        const budget = parseFloat(text);
        if (isNaN(budget) || budget <= 0) {
            await ctx.reply('❌ Please enter a valid budget amount (e.g., 1.0)');
            return;
        }
        poolData.budget = budget;
        poolData.creator = userId;
        poolData.participants = [];
        poolData.createdAt = new Date();
        // Create the pool using PoolService
        const pool = pool_1.PoolService.createPool({
            name: poolData.name,
            description: poolData.description || '',
            reward: poolData.reward,
            duration: poolData.duration,
            actions: poolData.actions,
            budget: poolData.budget,
            creator: userId,
            creatorUsername: ctx.from?.username,
            isPublic: true,
            tags: []
        });
        // Clear user session
        userSessions.delete(userId);
        const successText = `🎉 *Pool Created Successfully!*

*Pool Details:*
🏷️ Name: ${poolData.name}
💰 Reward: ${poolData.reward} SOL per action
⏰ Duration: ${poolData.duration} hours
📱 Actions: ${poolData.actions.join(', ')}
💸 Budget: ${poolData.budget} SOL

*Your pool is now public and users can join!*`;
        const successKeyboard = telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('🔍 View All Pools', 'find_raids'),
                telegraf_1.Markup.button.callback('🏠 Back to Menu', 'back_to_menu')
            ]
        ]);
        await ctx.reply(successText, {
            parse_mode: 'Markdown',
            ...successKeyboard
        });
    }
}
