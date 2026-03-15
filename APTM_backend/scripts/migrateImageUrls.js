// APTM_backend/scripts/migrateImageUrls.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Get MongoDB URI from environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aptm';

const migrateImageUrls = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('📁 Using MongoDB URI:', MONGODB_URI.replace(/:[^:]*@/, ':***@')); // Hide password
    
    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ Connected to MongoDB\n');

    // Import models
    const User = (await import('../models/User.js')).default;
    const UserProfile = (await import('../models/UserProfile.js')).default;

    console.log('📊 Starting migration...\n');

    // 1. Fix User avatars
    console.log('🖼️ Fixing User avatars...');
    const users = await User.find({});
    let userFixedCount = 0;

    for (const user of users) {
      if (user.avatar && (user.avatar.includes('localhost') || user.avatar.includes('http://localhost'))) {
        const oldUrl = user.avatar;
        const filename = user.avatar.split('/').pop();
        
        console.log(`   Found: ${oldUrl}`);
        console.log(`   → Fixing to: ${filename}`);
        
        user.avatar = filename;
        await user.save();
        userFixedCount++;
      }
    }
    console.log(`   ✅ Fixed ${userFixedCount} user avatars\n`);

    // 2. Fix UserProfile banners
    console.log('🖼️ Fixing UserProfile banners...');
    const profiles = await UserProfile.find({});
    let profileFixedCount = 0;

    for (const profile of profiles) {
      let changed = false;
      
      if (profile.bannerImage && (profile.bannerImage.includes('localhost') || profile.bannerImage.includes('http://localhost'))) {
        const oldUrl = profile.bannerImage;
        const filename = profile.bannerImage.split('/').pop();
        
        console.log(`   Found banner: ${oldUrl}`);
        console.log(`   → Fixing to: ${filename}`);
        
        profile.bannerImage = filename;
        changed = true;
      }
      
      if (changed) {
        await profile.save();
        profileFixedCount++;
      }
    }
    console.log(`   ✅ Fixed ${profileFixedCount} profiles\n`);

    console.log('🎉 Migration complete!\n');
    
    // Summary
    console.log('📊 SUMMARY:');
    console.log(`   - Users fixed: ${userFixedCount}`);
    console.log(`   - Profiles fixed: ${profileFixedCount}`);
    console.log(`   - Total items fixed: ${userFixedCount + profileFixedCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

migrateImageUrls();