import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import * as bs58 from 'bs58';
import * as crypto from 'crypto';

export interface SolanaConfig {
  rpcUrl: string;
  commitment: 'processed' | 'confirmed' | 'finalized';
  network: 'mainnet-beta' | 'testnet' | 'devnet';
}

export interface WalletInfo {
  publicKey: string;
  balance: number;
  solBalance: number;
  recentTransactions: TransactionInfo[];
}

export interface TransactionInfo {
  signature: string;
  amount: number;
  type: 'send' | 'receive' | 'reward';
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
}

export class SolanaService {
  private connection: Connection;
  private config: SolanaConfig;

  constructor(config: SolanaConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, {
      commitment: config.commitment,
      confirmTransactionInitialTimeout: 60000,
    });
  }

  /**
   * Generate a new Solana keypair
   */
  async generateWallet(): Promise<{ keypair: Keypair; publicKey: string; privateKey: string }> {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toString();
    const privateKey = bs58.encode(keypair.secretKey);
    
    return { keypair, publicKey, privateKey };
  }

  /**
   * Get wallet balance from blockchain
   */
  async getWalletBalance(publicKey: string): Promise<number> {
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await this.connection.getBalance(pubKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return 0;
    }
  }

  /**
   * Send SOL to another wallet
   */
  async sendSol(
    fromPrivateKey: string,
    toPublicKey: string,
    amount: number
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      const fromKeypair = Keypair.fromSecretKey(bs58.decode(fromPrivateKey));
      const toPubKey = new PublicKey(toPublicKey);
      const lamports = amount * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey: toPubKey,
          lamports,
        })
      );

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [fromKeypair]
      );

      return { success: true, signature };
    } catch (error: any) {
      console.error('Error sending SOL:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recent transactions for a wallet
   */
  async getRecentTransactions(publicKey: string, limit: number = 10): Promise<TransactionInfo[]> {
    try {
      const pubKey = new PublicKey(publicKey);
      const signatures = await this.connection.getSignaturesForAddress(pubKey, { limit });
      
      const transactions: TransactionInfo[] = [];
      
      for (const sig of signatures) {
        try {
          const tx = await this.connection.getTransaction(sig.signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          });
          
          if (tx && tx.meta) {
            const amount = tx.meta.postBalances[0] - tx.meta.preBalances[0];
            transactions.push({
              signature: sig.signature,
              amount: Math.abs(amount) / LAMPORTS_PER_SOL,
              type: amount > 0 ? 'receive' : 'send',
              timestamp: new Date(sig.blockTime! * 1000),
              status: 'confirmed',
            });
          }
        } catch (err) {
          // Skip failed transaction fetches
          continue;
        }
      }
      
      return transactions;
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      return [];
    }
  }

  /**
   * Verify wallet ownership
   */
  async verifyWalletOwnership(publicKey: string, signature: string, message: string): Promise<boolean> {
    try {
      const pubKey = new PublicKey(publicKey);
      const messageBytes = new TextEncoder().encode(message);
      
      // For now, return true (implement proper signature verification later)
      // TODO: Implement proper Ed25519 signature verification
      return true;
    } catch (error: any) {
      console.error('Error verifying wallet ownership:', error);
      return false;
    }
  }

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<{ connected: boolean; slot: number; blockTime: number }> {
    try {
      const slot = await this.connection.getSlot();
      const blockTime = await this.connection.getBlockTime(slot);
      
      return {
        connected: true,
        slot,
        blockTime: blockTime || 0,
      };
    } catch (error) {
      return {
        connected: false,
        slot: 0,
        blockTime: 0,
      };
    }
  }

  /**
   * Estimate transaction fees
   */
  async estimateTransactionFee(): Promise<number> {
    try {
      const { feeCalculator } = await this.connection.getRecentBlockhash();
      return feeCalculator.lamportsPerSignature / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error estimating transaction fee:', error);
      return 0.000005; // Default fallback fee
    }
  }
}

// Default configuration
export const defaultSolanaConfig: SolanaConfig = {
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  commitment: 'confirmed',
  network: 'devnet', // Start with devnet for testing
};

// Export singleton instance
export const solanaService = new SolanaService(defaultSolanaConfig);
