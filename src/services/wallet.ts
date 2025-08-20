import { Keypair, PublicKey, Connection } from '@solana/web3.js';
import * as crypto from 'crypto';
import { solanaService, WalletInfo, TransactionInfo } from './solana';

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

  /**
   * Get real wallet balance from Solana blockchain
   */
  static async getRealWalletBalance(telegramId: string): Promise<number> {
    const profile = userProfiles.get(telegramId);
    if (!profile?.wallet) {
      return 0;
    }

    try {
      const balance = await solanaService.getWalletBalance(profile.wallet.publicKey);
      
      // Update local balance
      profile.wallet.balance = balance;
      userProfiles.set(telegramId, profile);
      
      return balance;
    } catch (error) {
      console.error('Error getting real wallet balance:', error);
      return profile.wallet.balance; // Return cached balance
    }
  }

  /**
   * Send SOL to another wallet
   */
  static async sendSol(
    fromTelegramId: string,
    toPublicKey: string,
    amount: number
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    const profile = userProfiles.get(fromTelegramId);
    if (!profile?.wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    if (profile.wallet.balance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    try {
      const privateKey = this.decryptPrivateKey(profile.wallet.encryptedPrivateKey);
      const result = await solanaService.sendSol(privateKey, toPublicKey, amount);
      
      if (result.success) {
        // Update local balance
        profile.wallet.balance -= amount;
        userProfiles.set(fromTelegramId, profile);
      }
      
      return result;
    } catch (error: any) {
      console.error('Error sending SOL:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recent transactions from blockchain
   */
  static async getRecentTransactions(telegramId: string, limit: number = 10): Promise<TransactionInfo[]> {
    const profile = userProfiles.get(telegramId);
    if (!profile?.wallet) {
      return [];
    }

    try {
      return await solanaService.getRecentTransactions(profile.wallet.publicKey, limit);
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      return [];
    }
  }

  /**
   * Verify wallet ownership
   */
  static async verifyWalletOwnership(telegramId: string, message: string, signature: string): Promise<boolean> {
    const profile = userProfiles.get(telegramId);
    if (!profile?.wallet) {
      return false;
    }

    try {
      return await solanaService.verifyWalletOwnership(profile.wallet.publicKey, signature, message);
    } catch (error) {
      console.error('Error verifying wallet ownership:', error);
      return false;
    }
  }

  /**
   * Get network status
   */
  static async getNetworkStatus(): Promise<{ connected: boolean; slot: number; blockTime: number }> {
    try {
      return await solanaService.getNetworkStatus();
    } catch (error) {
      console.error('Error getting network status:', error);
      return { connected: false, slot: 0, blockTime: 0 };
    }
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
