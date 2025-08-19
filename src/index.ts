import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { startCommand } from './commands/start';
import { sharePoolCommand } from './commands/sharePool';
import { browsePoolsCommand } from './commands/browsePools';
import { handleCallbackQueries, handleTextMessages } from './handlers';

// Load environment variables
dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

// Register commands
bot.start(startCommand);

// Register pool commands
bot.command('sharepool', sharePoolCommand);
bot.command('browsepools', browsePoolsCommand);

// Register handlers
handleCallbackQueries(bot);
handleTextMessages(bot);

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ An error occurred. Please try again.');
});

// Start bot
bot.launch()
  .then(() => {
    console.log('🚀 Raid2Earn bot started successfully!');
  })
  .catch((error) => {
    console.error('❌ Failed to start bot:', error);
  });

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
