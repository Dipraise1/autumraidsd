# Raid2Earn Bot

A Telegram bot for Raid2Earn with Solana blockchain integration and Twitter verification.

## Features

- **Telegram Bot Integration**: Full bot functionality with commands and handlers
- **Solana Blockchain**: Wallet management, transactions, and blockchain operations
- **Twitter Verification (2025 Compliant)**: Username verification and OAuth authentication
- **Pool Management**: Create and manage reward pools
- **Reward System**: Distribute rewards based on verified actions

## Twitter Integration (2025 Compliant)

The bot includes a fully updated Twitter service that's compliant with Twitter's 2025 API requirements.

### Features

- **Username Verification**: Verify Twitter usernames exist using Twitter API v2
- **OAuth Authentication**: Full OAuth 2.0 flow for user authentication
- **Action Verification**: Verify tweets, retweets, likes, follows, replies, and quotes
- **Rate Limiting**: Built-in rate limit handling and optimization
- **Batch Processing**: Verify multiple usernames efficiently
- **Error Handling**: Comprehensive error handling with detailed error messages

### API Endpoints Used

- `GET /2/users/by/username/{username}` - Username verification
- `GET /2/users/me` - User profile information
- `GET /2/users/me/tweets` - User's tweets
- `GET /2/users/me/retweeted` - User's retweets
- `GET /2/users/me/liked_tweets` - User's liked tweets
- `GET /2/users/me/following` - User's following list
- `POST /2/oauth2/token` - OAuth token exchange

### Required Scopes

- `tweet.read` - Read user's tweets
- `users.read` - Read user profile information
- `follows.read` - Read user's following list
- `like.read` - Read user's liked tweets
- `offline.access` - Refresh token access

### Environment Variables

```bash
# Twitter API Configuration (2025)
TWITTER_CLIENT_ID=your_twitter_client_id_here
TWITTER_CLIENT_SECRET=your_twitter_client_secret_here
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
TWITTER_REDIRECT_URI=https://your-domain.com/auth/twitter/callback
```

### Usage Examples

```typescript
import { twitterService } from './dist/services/twitter.js';

// Verify a single username
const result = await twitterService.verifyUsername('elonmusk');
if (result.success && result.exists) {
  console.log(`User exists: ${result.user?.displayName}`);
}

// Verify multiple usernames
const usernames = ['elonmusk', 'twitter', 'github'];
const results = await twitterService.verifyMultipleUsernames(usernames);

// Generate OAuth URL
const authData = twitterService.generateAuthUrl('user-123');
console.log(`OAuth URL: ${authData.url}`);

// Check service status
const status = twitterService.getServiceStatus();
console.log(`API Version: ${status.apiVersion}`);
```

### Testing

Run the Twitter integration tests:

```bash
npm run test:twitter
```

This will test:
- Environment variable configuration
- Username verification
- OAuth URL generation
- Service configuration validation

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `env.example` to `.env` and configure your credentials
4. Build the project: `npm run build`
5. Start the bot: `npm start`

## Development

- **Build**: `npm run build`
- **Dev Mode**: `npm run dev`
- **Clean**: `npm run clean`

## Architecture

The bot is built with TypeScript and follows a modular architecture:

- **Commands**: Bot command handlers
- **Services**: Business logic services (Twitter, Solana, etc.)
- **Handlers**: Event handlers and middleware
- **Types**: TypeScript type definitions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
