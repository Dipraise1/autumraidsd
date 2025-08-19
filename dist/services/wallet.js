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
