const { PoolService } = require('./dist/services/pool');
const { WalletService } = require('./dist/services/wallet');

console.log('🚀 Raid2Earn Pool Sharing Demo\n');

// Create some demo users
console.log('👥 Creating demo users...');
const user1 = WalletService.createUserProfile('123456', 'demo_user1');
const user2 = WalletService.createUserProfile('789012', 'demo_user2');
const user3 = WalletService.createUserProfile('345678', 'demo_user3');
console.log('✅ Demo users created\n');

// Create demo pools
console.log('🏗️ Creating demo pools...');
const pool1 = PoolService.createPool({
  name: 'Crypto Project Launch',
  description: 'Help launch our new DeFi protocol',
  reward: 0.005,
  duration: 24,
  actions: ['Like', 'Repost', 'Comment', 'Follow'],
  budget: 1.0,
  creator: '123456',
  creatorUsername: 'demo_user1',
  isPublic: true,
  tags: ['crypto', 'defi', 'launch']
});

const pool2 = PoolService.createPool({
  name: 'NFT Collection Drop',
  description: 'Promote our exclusive NFT collection',
  reward: 0.003,
  duration: 48,
  actions: ['Like', 'Repost', 'Follow'],
  budget: 0.5,
  creator: '789012',
  creatorUsername: 'demo_user2',
  isPublic: true,
  tags: ['nft', 'art', 'collection']
});

const pool3 = PoolService.createPool({
  name: 'Gaming Tournament',
  description: 'Join our P2E gaming tournament',
  reward: 0.008,
  duration: 72,
  actions: ['Like', 'Repost', 'Comment', 'Follow', 'Join'],
  budget: 2.0,
  creator: '345678',
  creatorUsername: 'demo_user3',
  isPublic: true,
  tags: ['gaming', 'p2e', 'tournament']
});

console.log('✅ Demo pools created\n');

// Simulate users joining pools
console.log('🎯 Simulating pool participation...');
PoolService.joinPool(pool1.id, '789012');
PoolService.joinPool(pool1.id, '345678');
PoolService.joinPool(pool2.id, '123456');
PoolService.joinPool(pool3.id, '123456');
PoolService.joinPool(pool3.id, '789012');
console.log('✅ Users joined pools\n');

// Share pools to groups
console.log('📢 Sharing pools to groups...');
PoolService.sharePoolToGroup(pool1.id, 'crypto_group', 'Crypto Enthusiasts');
PoolService.sharePoolToGroup(pool2.id, 'nft_group', 'NFT Collectors');
PoolService.sharePoolToGroup(pool3.id, 'gaming_group', 'Gaming Community');
console.log('✅ Pools shared to groups\n');

// Display pool sharing messages
console.log('📱 Pool Share Messages:\n');
console.log('='.repeat(50));
console.log(PoolService.getPoolShareMessage(pool1));
console.log('\n' + '='.repeat(50));
console.log(PoolService.getPoolShareMessage(pool2));
console.log('\n' + '='.repeat(50));
console.log(PoolService.getPoolShareMessage(pool3));

// Show trending pools
console.log('\n🔥 Trending Pools:');
const trending = PoolService.getTrendingPools(3);
trending.forEach((pool, index) => {
  const stats = PoolService.getPoolStats(pool.id);
  console.log(`${index + 1}. ${pool.name} - ${stats?.participants || 0} participants`);
});

// Show group-specific pools
console.log('\n📱 Pools by Group:');
const cryptoPools = PoolService.getPoolsByGroup('crypto_group');
const nftPools = PoolService.getPoolsByGroup('nft_group');
const gamingPools = PoolService.getPoolsByGroup('gaming_group');

console.log(`Crypto Group: ${cryptoPools.length} pools`);
console.log(`NFT Group: ${nftPools.length} pools`);
console.log(`Gaming Group: ${gamingPools.length} pools`);

console.log('\n🎉 Pool Sharing Demo completed!');
console.log('\n📚 Key Features Demonstrated:');
console.log('✅ Public pool creation');
console.log('✅ Group sharing functionality');
console.log('✅ Pool discovery and trending');
console.log('✅ User participation tracking');
console.log('✅ Pool analytics and stats');
