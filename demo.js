const { WalletService } = require('./dist/services/wallet');

console.log('🚀 Raid2Earn Bot Demo\n');

// Test wallet generation
console.log('📝 Testing wallet generation...');
const profile1 = WalletService.createUserProfile('123456', 'testuser1');
console.log('✅ User profile created:');
console.log(`   Telegram ID: ${profile1.telegramId}`);
console.log(`   Wallet: ${profile1.wallet?.publicKey}`);
console.log(`   Balance: ${profile1.wallet?.balance} SOL`);
console.log(`   Rank: ${profile1.rank}\n`);

// Test X username setting
console.log('🐦 Testing X username connection...');
const success = WalletService.setXUsername('123456', 'testuserx');
console.log(`✅ X username set: ${success}`);

const updatedProfile = WalletService.getUserProfile('123456');
console.log(`   X Username: @${updatedProfile?.xUsername}\n`);

// Test earnings
console.log('💰 Testing earnings...');
WalletService.addEarnings('123456', 0.05);
const profileWithEarnings = WalletService.getUserProfile('123456');
console.log(`✅ Earnings added:`);
console.log(`   New Balance: ${profileWithEarnings?.wallet?.balance} SOL`);
console.log(`   Total Earned: ${profileWithEarnings?.totalEarned} SOL`);
console.log(`   New Rank: ${profileWithEarnings?.rank}\n`);

// Test multiple users
console.log('👥 Testing multiple users...');
const profile2 = WalletService.createUserProfile('789012', 'testuser2');
WalletService.setXUsername('789012', 'testuserx2');
WalletService.addEarnings('789012', 0.15);

const allProfiles = WalletService.getAllProfiles();
console.log(`✅ Total users: ${allProfiles.length}`);
allProfiles.forEach((profile, index) => {
  console.log(`   User ${index + 1}:`);
  console.log(`     Telegram: @${profile.telegramUsername}`);
  console.log(`     X: @${profile.xUsername}`);
  console.log(`     Balance: ${profile.wallet?.balance} SOL`);
  console.log(`     Rank: ${profile.rank}`);
});

console.log('\n🎉 Demo completed successfully!');
console.log('\n📚 To start the bot:');
console.log('1. Set TELEGRAM_BOT_TOKEN in .env file');
console.log('2. Run: npm start');
