"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const dotenv_1 = __importDefault(require("dotenv"));
const start_1 = require("./commands/start");
const sharePool_1 = require("./commands/sharePool");
const browsePools_1 = require("./commands/browsePools");
const handlers_1 = require("./handlers");
// Load environment variables
dotenv_1.default.config();
const bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
// Register commands
bot.start(start_1.startCommand);
// Register pool commands
bot.command('sharepool', sharePool_1.sharePoolCommand);
bot.command('browsepools', browsePools_1.browsePoolsCommand);
// Register handlers
(0, handlers_1.handleCallbackQueries)(bot);
(0, handlers_1.handleTextMessages)(bot);
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
