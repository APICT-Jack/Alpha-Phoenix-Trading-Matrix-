// scripts/migrateToCloudinary.js - STANDALONE VERSION
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Configure Cloudinary directly
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('='.repeat(50));
console.log('🔧 Cloudinary Configuration:');
console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME || '❌ Missing'}`);
console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log('='.repeat(50));

// Import models (after dotenv is loaded)
import User from '../models/User.js';
import UserProfile from '../models/UserProfile.js';
import Gallery from '../models/Gallery.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('❌ No MongoDB URI found');
      process.exit(1);
    }
    console.log(`\n📡 Connecting to MongoDB...`);
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Upload file to Cloudinary with proper error handling
const uploadToCloudinary = async (filePath, folder, options = {}) => {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return { success: false, error: 'File not found' };
  }
  
  // Check file size
  const stats = fs.statSync(filePath);
  console.log(`   📁 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  try {
    const uploadOptions = {
      folder: `trading-app/${folder}`,
      ...options
    };
    
    console.log(`   📤 Uploading to Cloudinary...`);
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    console.log(`   ✅ Uploaded successfully!`);
    return { success: true, url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    console.error(`   ❌ Upload failed: ${error.message}`);
    if (error.http_code) {
      console.error(`   HTTP Code: ${error.http_code}`);
    }
    return { success: false, error: error.message };
  }
};

// Migrate avatars
const migrateAvatars = async () => {
  console.log('\n📸 Migrating avatars...');
  
  const users = await User.find({
    avatar: { $exists: true, $ne: null },
    $or: [
      { avatar: { $regex: '^/uploads/avatars/', $options: 'i' } },
      { avatar: { $regex: '^uploads/avatars/', $options: 'i' } },
      { avatar: { $not: /^https?:\/\// } }
    ]
  });
  
  console.log(`Found ${users.length} users with local avatars`);
  
  let migrated = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const user of users) {
    console.log(`\n👤 User: ${user.email || user.username}`);
    
    let avatarPath = user.avatar;
    if (!avatarPath) {
      console.log(`   ⚠️ No avatar path`);
      skipped++;
      continue;
    }
    
    // Clean up the path
    let cleanPath = avatarPath;
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
    cleanPath = cleanPath.split('?')[0];
    
    const localPath = path.join(process.cwd(), cleanPath);
    console.log(`   📁 Looking for: ${localPath}`);
    
    const result = await uploadToCloudinary(localPath, 'avatars', {
      transformation: [{ width: 200, height: 200, crop: 'fill', quality: 'auto' }]
    });
    
    if (result.success) {
      user.avatar = result.url;
      await user.save();
      console.log(`   ✅ Updated avatar in database`);
      migrated++;
    } else if (result.error === 'File not found') {
      console.log(`   ⚠️ File not found, skipping`);
      skipped++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n✅ Avatars: ${migrated} migrated, ${skipped} skipped, ${failed} failed`);
  return { migrated, skipped, failed };
};

// Migrate banners
const migrateBanners = async () => {
  console.log('\n🎨 Migrating banners...');
  
  const profiles = await UserProfile.find({
    bannerImage: { $exists: true, $ne: null },
    $or: [
      { bannerImage: { $regex: '^/uploads/banners/', $options: 'i' } },
      { bannerImage: { $regex: '^uploads/banners/', $options: 'i' } },
      { bannerImage: { $regex: '^banner-', $options: 'i' } },
      { bannerImage: { $not: /^https?:\/\// } }
    ]
  });
  
  console.log(`Found ${profiles.length} profiles with local banners`);
  
  let migrated = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const profile of profiles) {
    console.log(`\n📋 Profile: ${profile.userId}`);
    
    let bannerPath = profile.bannerImage;
    if (!bannerPath) {
      console.log(`   ⚠️ No banner path`);
      skipped++;
      continue;
    }
    
    let cleanPath = bannerPath;
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
    cleanPath = cleanPath.split('?')[0];
    
    const localPath = path.join(process.cwd(), cleanPath);
    console.log(`   📁 Looking for: ${localPath}`);
    
    const result = await uploadToCloudinary(localPath, 'banners', {
      transformation: [{ width: 1500, height: 500, crop: 'fill', quality: 'auto' }]
    });
    
    if (result.success) {
      profile.bannerImage = result.url;
      await profile.save();
      console.log(`   ✅ Updated banner in database`);
      migrated++;
    } else if (result.error === 'File not found') {
      console.log(`   ⚠️ File not found, skipping`);
      skipped++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n✅ Banners: ${migrated} migrated, ${skipped} skipped, ${failed} failed`);
  return { migrated, skipped, failed };
};

// Migrate gallery items
const migrateGalleryItems = async () => {
  console.log('\n🖼️ Migrating gallery items...');
  
  const galleries = await Gallery.find({});
  let totalMigrated = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalItems = 0;
  
  for (const gallery of galleries) {
    console.log(`\n📁 Gallery for user: ${gallery.userId}`);
    let galleryMigrated = 0;
    let galleryFailed = 0;
    let gallerySkipped = 0;
    
    for (const folder of gallery.folders) {
      for (const item of folder.items) {
        totalItems++;
        
        if (item.url && !item.url.startsWith('http')) {
          let cleanPath = item.url;
          if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
          cleanPath = cleanPath.split('?')[0];
          
          const localPath = path.join(process.cwd(), cleanPath);
          
          let uploadFolder = 'gallery';
          let uploadOptions = {};
          
          if (item.mimetype?.startsWith('image/')) {
            uploadOptions = { transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }] };
          } else if (item.mimetype?.startsWith('video/')) {
            uploadOptions = { resource_type: 'video', transformation: [{ quality: 'auto' }] };
          } else {
            uploadOptions = { resource_type: 'raw' };
          }
          
          const result = await uploadToCloudinary(localPath, uploadFolder, uploadOptions);
          
          if (result.success) {
            item.url = result.url;
            galleryMigrated++;
            totalMigrated++;
            console.log(`   ✅ Migrated: ${item.originalName || item.filename}`);
          } else if (result.error === 'File not found') {
            console.log(`   ⚠️ File not found: ${localPath}`);
            gallerySkipped++;
            totalSkipped++;
          } else {
            galleryFailed++;
            totalFailed++;
          }
        }
      }
    }
    
    if (galleryMigrated > 0) {
      await gallery.save();
      console.log(`   ✅ Saved ${galleryMigrated} migrated items`);
    }
    console.log(`   📊 This gallery: ${galleryMigrated} migrated, ${gallerySkipped} skipped, ${galleryFailed} failed`);
  }
  
  console.log(`\n✅ Gallery: ${totalMigrated} migrated, ${totalSkipped} skipped, ${totalFailed} failed out of ${totalItems} total items`);
  return { migrated: totalMigrated, skipped: totalSkipped, failed: totalFailed };
};

// Main migration function
const runMigration = async () => {
  console.log('='.repeat(50));
  console.log('🚀 Starting migration to Cloudinary...');
  console.log('='.repeat(50));
  
  await connectDB();
  
  try {
    const avatars = await migrateAvatars();
    const banners = await migrateBanners();
    const gallery = await migrateGalleryItems();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Avatars: ${avatars.migrated} migrated, ${avatars.skipped} skipped, ${avatars.failed} failed`);
    console.log(`✅ Banners: ${banners.migrated} migrated, ${banners.skipped} skipped, ${banners.failed} failed`);
    console.log(`✅ Gallery: ${gallery.migrated} migrated, ${gallery.skipped} skipped, ${gallery.failed} failed`);
    console.log('\n✨ Migration completed!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 Disconnected from MongoDB');
  }
};

runMigration();