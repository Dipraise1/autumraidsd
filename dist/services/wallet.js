"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const web3_js_1 = require("@solana/web3.js");
const crypto = __importStar(require("crypto"));
const solana_1 = require("./solana");
// Simple encryption key (in production, use proper environment variable)
const ENCRYPTION_KEY = crypto.scryptSync('raid2earn-secret', 'salt', 32);
// In-memory storage (replace with database in production)
const userProfiles = new Map();
class WalletService {
    static generateWallet() {
        const keypair = web3_js_1.Keypair.generate();
        return {
            publicKey: keypair.publicKey.toString(),
            privateKey: Buffer.from(keypair.secretKey).toString('base64')
        };
    }
    static encryptPrivateKey(privateKey) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(privateKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }
    static decryptPrivateKey(encryptedPrivateKey) {
        const parts = encryptedPrivateKey.split(':');
        if (parts.length === 2) {
            // New format with IV
            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];
            const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        else {
            // Fallback for simple format (for demo purposes)
            return encryptedPrivateKey; // Just return as-is for demo
        }
    }
    static createUserProfile(telegramId, telegramUsername) {
        const wallet = this.generateWallet();
        const encryptedPrivateKey = this.encryptPrivateKey(wallet.privateKey);
        const userWallet = {
            publicKey: wallet.publicKey,
            encryptedPrivateKey,
            balance: 0,
            createdAt: new Date()
        };
        const profile = {
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
    static getUserProfile(telegramId) {
        return userProfiles.get(telegramId);
    }
    static updateUserProfile(telegramId, updates) {
        const profile = userProfiles.get(telegramId);
        if (profile) {
            const updatedProfile = { ...profile, ...updates };
            userProfiles.set(telegramId, updatedProfile);
            return updatedProfile;
        }
        return undefined;
    }
    static setXUsername(telegramId, xUsername) {
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
    static async getRealWalletBalance(telegramId) {
        const profile = userProfiles.get(telegramId);
        if (!profile?.wallet) {
            return 0;
        }
        try {
            const balance = await solana_1.solanaService.getWalletBalance(profile.wallet.publicKey);
            // Update local balance
            profile.wallet.balance = balance;
            userProfiles.set(telegramId, profile);
            return balance;
        }
        catch (error) {
            console.error('Error getting real wallet balance:', error);
            return profile.wallet.balance; // Return cached balance
        }
    }
    /**
     * Send SOL to another wallet
     */
    static async sendSol(fromTelegramId, toPublicKey, amount) {
        const profile = userProfiles.get(fromTelegramId);
        if (!profile?.wallet) {
            return { success: false, error: 'Wallet not found' };
        }
        if (profile.wallet.balance < amount) {
            return { success: false, error: 'Insufficient balance' };
        }
        try {
            const privateKey = this.decryptPrivateKey(profile.wallet.encryptedPrivateKey);
            const result = await solana_1.solanaService.sendSol(privateKey, toPublicKey, amount);
            if (result.success) {
                // Update local balance
                profile.wallet.balance -= amount;
                userProfiles.set(fromTelegramId, profile);
            }
            return result;
        }
        catch (error) {
            console.error('Error sending SOL:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Get recent transactions from blockchain
     */
    static async getRecentTransactions(telegramId, limit = 10) {
        const profile = userProfiles.get(telegramId);
        if (!profile?.wallet) {
            return [];
        }
        try {
            return await solana_1.solanaService.getRecentTransactions(profile.wallet.publicKey, limit);
        }
        catch (error) {
            console.error('Error getting recent transactions:', error);
            return [];
        }
    }
    /**
     * Verify wallet ownership
     */
    static async verifyWalletOwnership(telegramId, message, signature) {
        const profile = userProfiles.get(telegramId);
        if (!profile?.wallet) {
            return false;
        }
        try {
            return await solana_1.solanaService.verifyWalletOwnership(profile.wallet.publicKey, signature, message);
        }
        catch (error) {
            console.error('Error verifying wallet ownership:', error);
            return false;
        }
    }
    /**
     * Get network status
     */
    static async getNetworkStatus() {
        try {
            return await solana_1.solanaService.getNetworkStatus();
        }
        catch (error) {
            console.error('Error getting network status:', error);
            return { connected: false, slot: 0, blockTime: 0 };
        }
    }
    static getAllProfiles() {
        return Array.from(userProfiles.values());
    }
    static async getWalletBalance(publicKey) {
        try {
            // In production, use your RPC endpoint
            const connection = new web3_js_1.Connection('https://api.devnet.solana.com');
            const balance = await connection.getBalance(new web3_js_1.PublicKey(publicKey));
            return balance / 1e9; // Convert lamports to SOL
        }
        catch (error) {
            console.error('Error getting wallet balance:', error);
            return 0;
        }
    }
    static addEarnings(telegramId, amount) {
        const profile = userProfiles.get(telegramId);
        if (profile && profile.wallet) {
            profile.wallet.balance += amount;
            profile.totalEarned += amount;
            // Update rank based on total earned
            if (profile.totalEarned >= 1) {
                profile.rank = 'Gold Raider';
            }
            else if (profile.totalEarned >= 0.5) {
                profile.rank = 'Silver Raider';
            }
            else if (profile.totalEarned >= 0.1) {
                profile.rank = 'Bronze Raider';
            }
            userProfiles.set(telegramId, profile);
            return true;
        }
        return false;
    }
}
exports.WalletService = WalletService;
