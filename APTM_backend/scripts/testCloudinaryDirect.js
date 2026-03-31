// scripts/testCloudinaryDirect.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
const envPath = path.join(__dirname, '..', '.env');
console.log(`📁 Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

// Get credentials
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('\n🔧 Cloudinary Credentials:');
console.log(`   Cloud Name: ${cloudName || '❌ Missing'}`);
console.log(`   API Key: ${apiKey ? `✅ Present (${apiKey.slice(0, 4)}...${apiKey.slice(-4)})` : '❌ Missing'}`);
console.log(`   API Secret: ${apiSecret ? '✅ Present' : '❌ Missing'}`);

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

console.log('\n📡 Testing Cloudinary connection...');

// Test 1: Ping
try {
  const pingResult = await cloudinary.api.ping();
  console.log('✅ Cloudinary ping successful!');
  console.log(`   Response: ${JSON.stringify(pingResult)}`);
} catch (error) {
  console.error('❌ Cloudinary ping failed:');
  console.error(`   Message: ${error.message}`);
  console.error(`   HTTP Code: ${error.http_code || 'N/A'}`);
}

// Test 2: Create a test file and upload
const testFilePath = path.join(__dirname, '..', 'test-upload.txt');
fs.writeFileSync(testFilePath, `Test upload at ${new Date().toISOString()}`);

console.log('\n📤 Testing upload...');
try {
  const uploadResult = await cloudinary.uploader.upload(testFilePath, {
    folder: 'trading-app/test',
    resource_type: 'auto'
  });
  console.log('✅ Test upload successful!');
  console.log(`   URL: ${uploadResult.secure_url}`);
  console.log(`   Public ID: ${uploadResult.public_id}`);
} catch (error) {
  console.error('❌ Test upload failed:');
  console.error(`   Message: ${error.message}`);
  console.error(`   HTTP Code: ${error.http_code || 'N/A'}`);
  if (error.http_code === 401) {
    console.error('\n💡 This usually means your Cloudinary API key or secret is incorrect.');
    console.error('   Please check your Cloudinary dashboard: https://cloudinary.com/console');
  }
} finally {
  // Clean up test file
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
    console.log('🧹 Test file cleaned up');
  }
}

console.log('\n✨ Test complete!');