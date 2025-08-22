import { randomBytes, createHash } from 'crypto';

export interface TwitterConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  bearerToken?: string; // For public API access
}

export interface TwitterUser {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  createdAt: string;
  description: string;
}

export interface TwitterAction {
  id: string;
  type: 'tweet' | 'retweet' | 'like' | 'follow' | 'reply' | 'quote';
  content?: string;
  targetId?: string;
  targetUsername?: string;
  timestamp: Date;
  verified: boolean;
  proof?: string; // URL or ID proof
}

export interface OAuthState {
  state: string;
  codeVerifier: string;
  timestamp: number;
}

export interface UsernameVerificationResult {
  success: boolean;
  exists: boolean;
  user?: TwitterUser;
  error?: string;
}

export class TwitterService {
  private config: TwitterConfig;
  private oauthStates: Map<string, OAuthState> = new Map();

  constructor(config: TwitterConfig) {
    this.config = config;
  }

  /**
   * Verify username exists without OAuth (public API)
   * This is the main method for 2025 username verification
   */
  async verifyUsername(username: string): Promise<UsernameVerificationResult> {
    try {
      // Remove @ if present
      const cleanUsername = username.replace('@', '');
      
      // Use Twitter's public API to check if username exists
      const response = await fetch(`https://api.twitter.com/2/users/by/username/${cleanUsername}`, {
        headers: {
          'Authorization': `Bearer ${this.config.bearerToken}`,
          'User-Agent': 'Raid2Earn Bot/1.0',
        },
      });

      if (response.status === 404) {
        return {
          success: true,
          exists: false,
        };
      }

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.data) {
        return {
          success: true,
          exists: false,
        };
      }

      const user = data.data;
      
      // Get additional user fields
      const userResponse = await fetch(
        `https://api.twitter.com/2/users/by/username/${cleanUsername}?user.fields=profile_image_url,verified,public_metrics,created_at,description`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.bearerToken}`,
            'User-Agent': 'Raid2Earn Bot/1.0',
          },
        }
      );

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const userInfo = userData.data;
        const metrics = userInfo.public_metrics;

        const twitterUser: TwitterUser = {
          id: userInfo.id,
          username: userInfo.username,
          displayName: userInfo.name,
          profileImageUrl: userInfo.profile_image_url || '',
          verified: userInfo.verified || false,
          followersCount: metrics?.followers_count || 0,
          followingCount: metrics?.following_count || 0,
          tweetCount: metrics?.tweet_count || 0,
          createdAt: userInfo.created_at || '',
          description: userInfo.description || '',
        };

        return {
          success: true,
          exists: true,
          user: twitterUser,
        };
      }

      return {
        success: true,
        exists: true,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.name,
          profileImageUrl: '',
          verified: false,
          followersCount: 0,
          followingCount: 0,
          tweetCount: 0,
          createdAt: '',
          description: '',
        },
      };
    } catch (error: any) {
      console.error('Error verifying username:', error);
      return {
        success: false,
        exists: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify multiple usernames at once (for batch verification)
   */
  async verifyMultipleUsernames(usernames: string[]): Promise<Map<string, UsernameVerificationResult>> {
    const results = new Map<string, UsernameVerificationResult>();
    
    // Process in batches to avoid rate limiting
    const batchSize = 100;
    for (let i = 0; i < usernames.length; i += batchSize) {
      const batch = usernames.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (username) => {
        const result = await this.verifyUsername(username);
        return { username, result };
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ username, result }) => {
        results.set(username, result);
      });
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < usernames.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Generate OAuth authorization URL for full access
   * This is for users who want to verify their own actions
   */
  generateAuthUrl(userId: string): { url: string; state: string; codeVerifier: string } {
    const state = this.generateRandomString(32);
    const codeVerifier = this.generateRandomString(64);
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    const oauthState: OAuthState = {
      state,
      codeVerifier,
      timestamp: Date.now(),
    };

    this.oauthStates.set(userId, oauthState);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const url = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

    return { url, state, codeVerifier };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    codeVerifier: string,
    userId: string
  ): Promise<{ success: boolean; accessToken?: string; refreshToken?: string; error?: string }> {
    try {
      const oauthState = this.oauthStates.get(userId);
      if (!oauthState || oauthState.codeVerifier !== codeVerifier) {
        return { success: false, error: 'Invalid code verifier' };
      }

      // Check if state is expired
      if (Date.now() - oauthState.timestamp > 10 * 60 * 1000) { // 10 minutes
        this.oauthStates.delete(userId);
        return { success: false, error: 'OAuth state expired' };
      }

      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.config.redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(`Token exchange failed: ${errorData.error || tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();
      
      // Clean up OAuth state
      this.oauthStates.delete(userId);
      
      return {
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      };
    } catch (error: any) {
      console.error('Error exchanging code for token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Twitter user profile with OAuth access
   */
  async getUserProfile(accessToken: string): Promise<{ success: boolean; user?: TwitterUser; error?: string }> {
    try {
      const response = await fetch(
        'https://api.twitter.com/2/users/me?user.fields=profile_image_url,verified,public_metrics,created_at,description',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Raid2Earn Bot/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const user = data.data;
      const metrics = user.public_metrics;

      const twitterUser: TwitterUser = {
        id: user.id,
        username: user.username,
        displayName: user.name,
        profileImageUrl: user.profile_image_url || '',
        verified: user.verified || false,
        followersCount: metrics?.followers_count || 0,
        followingCount: metrics?.following_count || 0,
        tweetCount: metrics?.tweet_count || 0,
        createdAt: user.created_at || '',
        description: user.description || '',
      };

      return { success: true, user: twitterUser };
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify user action (tweet, retweet, like, follow) with OAuth access
   */
  async verifyAction(
    accessToken: string,
    action: TwitterAction
  ): Promise<{ success: boolean; verified: boolean; error?: string }> {
    try {
      switch (action.type) {
        case 'tweet':
          return await this.verifyTweet(accessToken, action);
        case 'retweet':
          return await this.verifyRetweet(accessToken, action);
        case 'like':
          return await this.verifyLike(accessToken, action);
        case 'follow':
          return await this.verifyFollow(accessToken, action);
        case 'reply':
          return await this.verifyReply(accessToken, action);
        case 'quote':
          return await this.verifyQuote(accessToken, action);
        default:
          return { success: false, verified: false, error: 'Unknown action type' };
      }
    } catch (error: any) {
      console.error('Error verifying action:', error);
      return { success: false, verified: false, error: error.message };
    }
  }

  /**
   * Verify tweet action
   */
  private async verifyTweet(
    accessToken: string,
    action: TwitterAction
  ): Promise<{ success: boolean; verified: boolean; error?: string }> {
    try {
      const response = await fetch(
        `https://api.twitter.com/2/users/me/tweets?max_results=100&tweet.fields=created_at,text`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Raid2Earn Bot/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      const tweets = data.data || [];

      // Check if the required tweet exists within the last 24 hours
      const requiredTweet = tweets.find((tweet: any) => {
        const tweetTime = new Date(tweet.created_at);
        const actionTime = new Date(action.timestamp);
        const timeDiff = Math.abs(tweetTime.getTime() - actionTime.getTime());
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        return tweet.text.includes(action.content || '') && hoursDiff <= 24;
      });

      return {
        success: true,
        verified: !!requiredTweet,
      };
    } catch (error: any) {
      return { success: false, verified: false, error: error.message };
    }
  }

  /**
   * Verify retweet action
   */
  private async verifyRetweet(
    accessToken: string,
    action: TwitterAction
  ): Promise<{ success: boolean; verified: boolean; error?: string }> {
    try {
      const response = await fetch(
        `https://api.twitter.com/2/users/me/retweeted?max_results=100&tweet.fields=created_at`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Raid2Earn Bot/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      const retweets = data.data || [];

      // Check if the required retweet exists within the last 24 hours
      const requiredRetweet = retweets.find((retweet: any) => {
        const retweetTime = new Date(retweet.created_at);
        const actionTime = new Date(action.timestamp);
        const timeDiff = Math.abs(retweetTime.getTime() - actionTime.getTime());
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        return retweet.id === action.targetId && hoursDiff <= 24;
      });

      return {
        success: true,
        verified: !!requiredRetweet,
      };
    } catch (error: any) {
      return { success: false, verified: false, error: error.message };
    }
  }

  /**
   * Verify like action
   */
  private async verifyLike(
    accessToken: string,
    action: TwitterAction
  ): Promise<{ success: boolean; verified: boolean; error?: string }> {
    try {
      const response = await fetch(
        `https://api.twitter.com/2/users/me/liked_tweets?max_results=100&tweet.fields=created_at`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Raid2Earn Bot/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      const likedTweets = data.data || [];

      // Check if the required like exists within the last 24 hours
      const requiredLike = likedTweets.find((tweet: any) => {
        const likeTime = new Date(tweet.created_at);
        const actionTime = new Date(action.timestamp);
        const timeDiff = Math.abs(likeTime.getTime() - actionTime.getTime());
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        return tweet.id === action.targetId && hoursDiff <= 24;
      });

      return {
        success: true,
        verified: !!requiredLike,
      };
    } catch (error: any) {
      return { success: false, verified: false, error: error.message };
    }
  }

  /**
   * Verify follow action
   */
  private async verifyFollow(
    accessToken: string,
    action: TwitterAction
  ): Promise<{ success: boolean; verified: boolean; error?: string }> {
    try {
      const response = await fetch(
        `https://api.twitter.com/2/users/me/following?max_results=1000`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Raid2Earn Bot/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      const following = data.data || [];

      // Check if the required follow exists
      const requiredFollow = following.find((user: any) => 
        user.username === action.targetUsername
      );

      return {
        success: true,
        verified: !!requiredFollow,
      };
    } catch (error: any) {
      return { success: false, verified: false, error: error.message };
    }
  }

  /**
   * Verify reply action
   */
  private async verifyReply(
    accessToken: string,
    action: TwitterAction
  ): Promise<{ success: boolean; verified: boolean; error?: string }> {
    try {
      const response = await fetch(
        `https://api.twitter.com/2/users/me/tweets?max_results=100&tweet.fields=created_at,text,in_reply_to_user_id`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Raid2Earn Bot/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      const tweets = data.data || [];

      // Check if the required reply exists within the last 24 hours
      const requiredReply = tweets.find((tweet: any) => {
        const tweetTime = new Date(tweet.created_at);
        const actionTime = new Date(action.timestamp);
        const timeDiff = Math.abs(tweetTime.getTime() - actionTime.getTime());
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        return tweet.in_reply_to_user_id === action.targetId &&
               tweet.text.includes(action.content || '') &&
               hoursDiff <= 24;
      });

      return {
        success: true,
        verified: !!requiredReply,
      };
    } catch (error: any) {
      return { success: false, verified: false, error: error.message };
    }
  }

  /**
   * Verify quote tweet action
   */
  private async verifyQuote(
    accessToken: string,
    action: TwitterAction
  ): Promise<{ success: boolean; verified: boolean; error?: string }> {
    try {
      const response = await fetch(
        `https://api.twitter.com/2/users/me/tweets?max_results=100&tweet.fields=created_at,text,referenced_tweets`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Raid2Earn Bot/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      const tweets = data.data || [];

      // Check if the required quote exists within the last 24 hours
      const requiredQuote = tweets.find((tweet: any) => {
        const tweetTime = new Date(tweet.created_at);
        const actionTime = new Date(action.timestamp);
        const timeDiff = Math.abs(tweetTime.getTime() - actionTime.getTime());
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        const isQuote = tweet.referenced_tweets?.some((ref: any) => 
          ref.type === 'quoted' && ref.id === action.targetId
        );
        
        return isQuote && tweet.text.includes(action.content || '') && hoursDiff <= 24;
      });

      return {
        success: true,
        verified: !!requiredQuote,
      };
    } catch (error: any) {
      return { success: false, verified: false, error: error.message };
    }
  }

  /**
   * Generate random string for OAuth
   */
  private generateRandomString(length: number): string {
    return randomBytes(length).toString('base64url');
  }

  /**
   * Generate PKCE code challenge
   */
  private generateCodeChallenge(codeVerifier: string): string {
    const hash = createHash('sha256');
    hash.update(codeVerifier);
    return hash.digest('base64url');
  }

  /**
   * Clean up expired OAuth states
   */
  cleanupExpiredStates(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    for (const [userId, state] of this.oauthStates.entries()) {
      if (now - state.timestamp > maxAge) {
        this.oauthStates.delete(userId);
      }
    }
  }

  /**
   * Get rate limit information
   */
  async getRateLimitInfo(accessToken: string): Promise<{ success: boolean; limits?: any; error?: string }> {
    try {
      const response = await fetch('https://api.twitter.com/2/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'Raid2Earn Bot/1.0',
        },
      });

      const rateLimitRemaining = response.headers.get('x-rate-limit-remaining');
      const rateLimitReset = response.headers.get('x-rate-limit-reset');
      const rateLimitLimit = response.headers.get('x-rate-limit-limit');

      return {
        success: true,
        limits: {
          remaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : null,
          reset: rateLimitReset ? parseInt(rateLimitReset) : null,
          limit: rateLimitLimit ? parseInt(rateLimitLimit) : null,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Default configuration for 2025
export const defaultTwitterConfig: TwitterConfig = {
  clientId: process.env.TWITTER_CLIENT_ID || '',
  clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
  redirectUri: process.env.TWITTER_REDIRECT_URI || 'https://your-domain.com/auth/twitter/callback',
  scopes: ['tweet.read', 'users.read', 'follows.read', 'like.read', 'offline.access'],
  bearerToken: process.env.TWITTER_BEARER_TOKEN || '', // For public API access
};

// Export singleton instance
export const twitterService = new TwitterService(defaultTwitterConfig);
