import { randomBytes, createHash } from 'crypto';

export interface TwitterConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
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
}

export interface TwitterAction {
  id: string;
  type: 'tweet' | 'retweet' | 'like' | 'follow' | 'reply';
  content?: string;
  targetId?: string;
  targetUsername?: string;
  timestamp: Date;
  verified: boolean;
}

export interface OAuthState {
  state: string;
  codeVerifier: string;
  timestamp: number;
}

export class TwitterService {
  private config: TwitterConfig;
  private oauthStates: Map<string, OAuthState> = new Map();

  constructor(config: TwitterConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL
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

      // For now, simulate token exchange (implement real OAuth flow later)
      const mockAccessToken = `mock_token_${Date.now()}`;
      
      // Clean up OAuth state
      this.oauthStates.delete(userId);
      
      return {
        success: true,
        accessToken: mockAccessToken,
        refreshToken: `mock_refresh_${Date.now()}`,
      };
    } catch (error: any) {
      console.error('Error exchanging code for token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Twitter user profile
   */
  async getUserProfile(accessToken: string): Promise<{ success: boolean; user?: TwitterUser; error?: string }> {
    try {
      const response = await fetch('https://api.twitter.com/2/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'Raid2Earn Bot',
        },
      });

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const user = data.data;

      // Get additional user fields
      const userResponse = await fetch(
        `https://api.twitter.com/2/users/me?user.fields=profile_image_url,verified,public_metrics`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Raid2Earn Bot',
          },
        }
      );

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const metrics = userData.data.public_metrics;

        const twitterUser: TwitterUser = {
          id: user.id,
          username: user.username,
          displayName: user.name,
          profileImageUrl: userData.data.profile_image_url,
          verified: userData.data.verified || false,
          followersCount: metrics?.followers_count || 0,
          followingCount: metrics?.following_count || 0,
          tweetCount: metrics?.tweet_count || 0,
        };

        return { success: true, user: twitterUser };
      }

      return { success: false, error: 'Failed to get user profile' };
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify user action (tweet, retweet, like, follow)
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
        `https://api.twitter.com/2/users/me/tweets?max_results=10&tweet.fields=created_at,text`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Raid2Earn Bot',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      const tweets = data.data || [];

      // Check if the required tweet exists
      const requiredTweet = tweets.find((tweet: any) => 
        tweet.text.includes(action.content || '') &&
        new Date(tweet.created_at) >= action.timestamp
      );

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
        `https://api.twitter.com/2/users/me/retweeted?max_results=10&tweet.fields=created_at`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Raid2Earn Bot',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      const retweets = data.data || [];

      // Check if the required retweet exists
      const requiredRetweet = retweets.find((retweet: any) => 
        retweet.id === action.targetId &&
        new Date(retweet.created_at) >= action.timestamp
      );

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
        `https://api.twitter.com/2/users/me/liked_tweets?max_results=10&tweet.fields=created_at`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Raid2Earn Bot',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      const likedTweets = data.data || [];

      // Check if the required like exists
      const requiredLike = likedTweets.find((tweet: any) => 
        tweet.id === action.targetId &&
        new Date(tweet.created_at) >= action.timestamp
      );

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
            'User-Agent': 'Raid2Earn Bot',
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
        `https://api.twitter.com/2/users/me/tweets?max_results=10&tweet.fields=created_at,text,in_reply_to_user_id`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Raid2Earn Bot',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      const tweets = data.data || [];

      // Check if the required reply exists
      const requiredReply = tweets.find((tweet: any) => 
        tweet.in_reply_to_user_id === action.targetId &&
        tweet.text.includes(action.content || '') &&
        new Date(tweet.created_at) >= action.timestamp
      );

      return {
        success: true,
        verified: !!requiredReply,
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
}

// Default configuration
export const defaultTwitterConfig: TwitterConfig = {
  clientId: process.env.TWITTER_CLIENT_ID || '',
  clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
  redirectUri: process.env.TWITTER_REDIRECT_URI || 'https://your-domain.com/auth/twitter/callback',
  scopes: ['tweet.read', 'users.read', 'follows.read', 'like.read'],
};

// Export singleton instance
export const twitterService = new TwitterService(defaultTwitterConfig);
