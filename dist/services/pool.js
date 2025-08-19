"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolService = void 0;
// In-memory storage for pools (replace with database in production)
const pools = new Map();
let poolCounter = 0;
class PoolService {
    static createPool(poolData) {
        const id = `pool_${++poolCounter}`;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + poolData.duration * 60 * 60 * 1000); // Convert hours to milliseconds
        const pool = {
            ...poolData,
            id,
            createdAt: now,
            expiresAt,
            status: 'active',
            participants: [],
            currentBudget: poolData.budget,
            tags: poolData.tags || []
        };
        pools.set(id, pool);
        return pool;
    }
    static getPool(id) {
        return pools.get(id);
    }
    static getAllPools() {
        return Array.from(pools.values()).filter(pool => pool.status === 'active');
    }
    static getPublicPools() {
        return this.getAllPools().filter(pool => pool.isPublic);
    }
    static getPoolsByCreator(creatorId) {
        return this.getAllPools().filter(pool => pool.creator === creatorId);
    }
    static getPoolsByGroup(groupId) {
        return this.getAllPools().filter(pool => pool.groupId === groupId);
    }
    static joinPool(poolId, userId) {
        const pool = pools.get(poolId);
        if (!pool) {
            return { success: false, message: 'Pool not found' };
        }
        if (pool.status !== 'active') {
            return { success: false, message: 'Pool is not active' };
        }
        if (pool.participants.includes(userId)) {
            return { success: false, message: 'You are already participating in this pool' };
        }
        if (pool.maxParticipants && pool.participants.length >= pool.maxParticipants) {
            return { success: false, message: 'Pool is full' };
        }
        if (pool.currentBudget < pool.reward) {
            return { success: false, message: 'Pool budget is insufficient' };
        }
        pool.participants.push(userId);
        return { success: true, message: 'Successfully joined pool' };
    }
    static leavePool(poolId, userId) {
        const pool = pools.get(poolId);
        if (!pool) {
            return { success: false, message: 'Pool not found' };
        }
        const index = pool.participants.indexOf(userId);
        if (index === -1) {
            return { success: false, message: 'You are not participating in this pool' };
        }
        pool.participants.splice(index, 1);
        return { success: true, message: 'Successfully left pool' };
    }
    static updatePoolStatus(poolId, status) {
        const pool = pools.get(poolId);
        if (pool) {
            pool.status = status;
            return true;
        }
        return false;
    }
    static getPoolStats(poolId) {
        const pool = pools.get(poolId);
        if (!pool)
            return null;
        return {
            participants: pool.participants.length,
            budgetUsed: pool.budget - pool.currentBudget,
            budgetRemaining: pool.currentBudget
        };
    }
    static searchPools(query) {
        const searchTerm = query.toLowerCase();
        return this.getAllPools().filter(pool => pool.name.toLowerCase().includes(searchTerm) ||
            pool.description?.toLowerCase().includes(searchTerm) ||
            pool.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
    }
    static getTrendingPools(limit = 5) {
        return this.getAllPools()
            .sort((a, b) => b.participants.length - a.participants.length)
            .slice(0, limit);
    }
    static addPoolTags(poolId, tags) {
        const pool = pools.get(poolId);
        if (pool) {
            pool.tags = [...new Set([...pool.tags, ...tags])];
            return true;
        }
        return false;
    }
    static sharePoolToGroup(poolId, groupId, groupName) {
        const pool = pools.get(poolId);
        if (pool) {
            pool.groupId = groupId;
            pool.groupName = groupName;
            pool.isPublic = true;
            return true;
        }
        return false;
    }
    static getPoolShareMessage(pool) {
        const stats = this.getPoolStats(pool.id);
        const timeLeft = Math.max(0, pool.expiresAt.getTime() - Date.now());
        const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
        return `🚀 *New Raid Pool Available!*

🏷️ *${pool.name}*
${pool.description ? `📝 ${pool.description}\n` : ''}
💰 *Reward:* ${pool.reward} SOL per action
⏰ *Duration:* ${hoursLeft} hours remaining
📱 *Actions:* ${pool.actions.join(', ')}
👥 *Participants:* ${stats?.participants || 0}/${pool.maxParticipants || '∞'}
💸 *Budget:* ${pool.currentBudget.toFixed(3)}/${pool.budget.toFixed(3)} SOL

🏷️ *Tags:* ${pool.tags.length > 0 ? pool.tags.map(tag => `#${tag}`).join(' ') : 'None'}

*Join this raid and start earning SOL!* 🎯`;
    }
    static getPoolInviteLink(poolId) {
        return `https://t.me/your_bot_username?start=pool_${poolId}`;
    }
}
exports.PoolService = PoolService;
