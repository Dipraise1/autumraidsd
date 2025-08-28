import { Context } from 'telegraf';
import { twitterService } from '../services/twitter';

export async function verifyUsernameCommand(ctx: Context) {
  try {
    // Check if user has provided a username
    const messageText = (ctx.message as any)?.text || '';
    const username = messageText.replace('/verify', '').trim();

    if (!username) {
      return ctx.reply(
        '🔍 **Username Verification**\n\n' +
        'Please provide a Twitter/X username to verify:\n\n' +
        '`/verify username` - Verify a specific username\n' +
        '`/verify @username` - Also works with @ symbol\n\n' +
        '**Example:** `/verify elonmusk`',
        { parse_mode: 'Markdown' }
      );
    }

    // Show verification in progress
    const progressMsg = await ctx.reply('🔍 Verifying username...');

    // Verify the username
    const result = await twitterService.verifyUsername(username);

    if (!result.success) {
      await ctx.telegram.editMessageText(
        ctx.chat?.id,
        progressMsg.message_id,
        undefined,
        '❌ **Verification Failed**\n\n' +
        `Error: ${result.error}\n\n` +
        'Please try again or contact support.',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    if (!result.exists) {
      await ctx.telegram.editMessageText(
        ctx.chat?.id,
        progressMsg.message_id,
        undefined,
        '❌ **Username Not Found**\n\n' +
        `The username \`${username}\` does not exist on Twitter/X.\n\n` +
        '**Possible reasons:**\n' +
        '• Username is misspelled\n' +
        '• Account was deleted or suspended\n' +
        '• Username changed recently',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Username exists, show detailed information
    const user = result.user!;
    const verifiedBadge = user.verified ? '✅' : '❌';
    const profileImage = user.profileImageUrl || '🖼️ No profile image';
    
    const response = 
      '✅ **Username Verified Successfully!**\n\n' +
      `**Username:** @${user.username}\n` +
      `**Display Name:** ${user.displayName}\n` +
      `**Verified Account:** ${verifiedBadge}\n` +
      `**Followers:** ${user.followersCount.toLocaleString()}\n` +
      `**Following:** ${user.followingCount.toLocaleString()}\n` +
      `**Total Tweets:** ${user.tweetCount.toLocaleString()}\n` +
      `**Account Created:** ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}\n\n` +
      (user.description ? `**Bio:** ${user.description}\n\n` : '') +
      '🎯 **This username is valid for raids!**\n\n' +
      'You can now use this username in your raid campaigns.';

    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      progressMsg.message_id,
      undefined,
      response,
      { parse_mode: 'Markdown' }
    );

  } catch (error) {
    console.error('Error in verifyUsername command:', error);
    ctx.reply(
      '❌ **Verification Error**\n\n' +
      'An unexpected error occurred while verifying the username.\n' +
      'Please try again or contact support.',
      { parse_mode: 'Markdown' }
    );
  }
}
