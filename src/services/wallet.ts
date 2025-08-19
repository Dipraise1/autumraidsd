import { Keypair, PublicKey, Connection } from '@solana/web3.js';
import * as crypto from 'crypto';

// Simple encryption key (in production, use proper environment variable)
const ENCRYPTION_KEY = crypto.scryptSync('raid2earn-secret', 'salt', 32);

export interface UserWallet {
  publicKey: string;
  encryptedPrivateKey: string;
  balance: number;
  createdAt: Date;
}

export interface UserProfile {
  telegramId: string;
  telegramUsername?: string;
  xUsername?: string;
  wallet?: UserWallet;
  totalEarned: number;
  raidsCompleted: number;
  rank: string;
  createdAt: Date;
}

// In-memory storage (replace with database in production)
const userProfiles: Map<string, UserProfile> = new Map();

export class WalletService {
  static generateWallet(): { publicKey: string; privateKey: string } {
    const keypair = Keypair.generate();
    return {
      publicKey: keypair.publicKey.toString(),
      privateKey: Buffer.from(keypair.secretKey).toString('base64')
    };
  }

  static encryptPrivateKey(privateKey: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  static decryptPrivateKey(encryptedPrivateKey: string): string {
    const parts = encryptedPrivateKey.split(':');
    if (parts.length === 2) {
      // New format with IV
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } else {
      // Fallback for simple format (for demo purposes)
      return encryptedPrivateKey; // Just return as-is for demo
    }
  }

  static createUserProfile(telegramId: string, telegramUsername?: string): UserProfile {
    const wallet = this.generateWallet();
    const encryptedPrivateKey = this.encryptPrivateKey(wallet.privateKey);

    const userWallet: UserWallet = {
      publicKey: wallet.publicKey,
      encryptedPrivateKey,
      balance: 0,
      createdAt: new Date()
    };

    const profile: UserProfile = {
      telegramId,
      telegramUsername,
      wallet: userWallet,
      totalEarned: 0,
      raidsCompleted: 0,
      rank: 'Newbie',
      createdAt: new Date()
    };

    userProfiles.set(telegramId, profile);
    return profile;
  }

  static getUserProfile(telegramId: string): UserProfile | undefined {
    return userProfiles.get(telegramId);
  }

  static updateUserProfile(telegramId: string, updates: Partial<UserProfile>): UserProfile | undefined {
    const profile = userProfiles.get(telegramId);
    if (profile) {
      const updatedProfile = { ...profile, ...updates };
      userProfiles.set(telegramId, updatedProfile);
      return updatedProfile;
    }
    return undefined;
  }

  static setXUsername(telegramId: string, xUsername: string): boolean {
    const profile = userProfiles.get(telegramId);
    if (profile) {
      profile.xUsername = xUsername;
      userProfiles.set(telegramId, profile);
      return true;
    }
    return false;
  }

  static getAllProfiles(): UserProfile[] {
    return Array.from(userProfiles.values());
  }

  static async getWalletBalance(publicKey: string): Promise<number> {
    try {
      // In production, use your RPC endpoint
      const connection = new Connection('https://api.devnet.solana.com');
      const balance = await connection.getBalance(new PublicKey(publicKey));
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return 0;
    }
  }

  static addEarnings(telegramId: string, amount: number): boolean {
    const profile = userProfiles.get(telegramId);
    if (profile && profile.wallet) {
      profile.wallet.balance += amount;
      profile.totalEarned += amount;
      
      // Update rank based on total earned
      if (profile.totalEarned >= 1) {
        profile.rank = 'Gold Raider';
      } else if (profile.totalEarned >= 0.5) {
        profile.rank = 'Silver Raider';
      } else if (profile.totalEarned >= 0.1) {
        profile.rank = 'Bronze Raider';
      }

      userProfiles.set(telegramId, profile);
      return true;
    }
    return false;
  }
}
