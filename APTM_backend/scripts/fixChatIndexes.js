// scripts/fixChatIndexes.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple possible .env locations
const possiblePaths = [
  path.join(__dirname, '..', '.env'),                    // backend/.env
  path.join(__dirname, '..', '..', '.env'),              // project root/.env
  path.join(process.cwd(), '.env'),                       // current working directory
  path.join(process.cwd(), '..', '.env'),                 // parent of cwd
];

console.log('🔍 Looking for .env file in:');
let loaded = false;
for (const envPath of possiblePaths) {
  console.log(`   Checking: ${envPath}`);
  if (fs.existsSync(envPath)) {
    console.log(`   ✅ Found .env at: ${envPath}`);
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log('   ✅ Successfully loaded .env');
      loaded = true;
      
      // Log all MongoDB related env vars
      console.log('\n📊 Environment variables found:');
      console.log(`   MONGO_URI: ${process.env.MONGO_URI ? '✅ Set' : '❌ Not set'}`);
      console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Not set'}`);
      console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not set'}`);
      
      break;
    }
  }
}

if (!loaded) {
  console.error('❌ Could not find or load .env file');
  console.log('\nPlease create a .env file in the backend directory with:');
  console.log('MONGO_URI=your_mongodb_connection_string');
  console.log('JWT_SECRET=your_secret_here');
  process.exit(1);
}

// Use either MONGO_URI or MONGODB_URI
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const fixChatIndexes = async () => {
  try {
    // Check if MONGODB_URI is defined
    if (!MONGODB_URI) {
      console.error('❌ No MongoDB URI found in environment variables');
      console.log('Please set either MONGO_URI or MONGODB_URI in your .env file');
      process.exit(1);
    }

    console.log('\n🔌 Connecting to MongoDB...');
    console.log('📀 Using database:', MONGODB_URI.replace(/:([^:@]+)@/, ':****@')); // Hide password
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    console.log(`📁 Database name: ${db.databaseName}`);

    // Check if collection exists
    const collections = await db.listCollections({ name: 'conversations' }).toArray();
    if (collections.length === 0) {
      console.log('ℹ️  conversations collection does not exist yet, creating it...');
      await db.createCollection('conversations');
    }

    const collection = db.collection('conversations');

    // 1. List all indexes before
    console.log('\n📊 Current indexes:');
    const beforeIndexes = await collection.indexes();
    if (beforeIndexes.length === 0) {
      console.log('   No indexes found');
    } else {
      beforeIndexes.forEach(idx => {
        console.log(`   - ${idx.name}:`, JSON.stringify(idx.key));
        if (idx.unique) {
          console.log(`     ⚠️  This is a UNIQUE index`);
        }
      });
    }

    // 2. Drop ALL indexes except _id
    console.log('\n🗑️  Dropping all indexes...');
    for (const idx of beforeIndexes) {
      if (idx.name !== '_id_') {
        try {
          await collection.dropIndex(idx.name);
          console.log(`   ✅ Dropped index: ${idx.name}`);
        } catch (error) {
          console.log(`   ❌ Failed to drop ${idx.name}:`, error.message);
        }
      }
    }

    // 3. Delete all conversations to start fresh
    console.log('\n🗑️  Deleting all conversations...');
    const deleteResult = await collection.deleteMany({});
    console.log(`   ✅ Deleted ${deleteResult.deletedCount} conversations`);

    // 4. Create new indexes (non-unique)
    console.log('\n📝 Creating new indexes...');
    
    await collection.createIndex(
      { participants: 1 },
      { 
        name: 'participants_idx',
        background: true 
      }
    );
    console.log('   ✅ Created participants_idx');

    await collection.createIndex(
      { updatedAt: -1 },
      { 
        name: 'updatedAt_idx',
        background: true 
      }
    );
    console.log('   ✅ Created updatedAt_idx');

    await collection.createIndex(
      { lastMessageTime: -1 },
      { 
        name: 'lastMessageTime_idx',
        background: true 
      }
    );
    console.log('   ✅ Created lastMessageTime_idx');

    await collection.createIndex(
      { isActive: 1, updatedAt: -1 },
      { 
        name: 'isActive_updatedAt_idx',
        background: true 
      }
    );
    console.log('   ✅ Created isActive_updatedAt_idx');

    // 5. List all indexes after
    console.log('\n📊 Final indexes:');
    const afterIndexes = await collection.indexes();
    afterIndexes.forEach(idx => {
      console.log(`   - ${idx.name}:`, JSON.stringify(idx.key));
    });

    console.log('\n🎉 Chat indexes fixed successfully!');
    console.log('\n🚀 You can now restart your server with: npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    process.exit(1);
  }
};

fixChatIndexes();