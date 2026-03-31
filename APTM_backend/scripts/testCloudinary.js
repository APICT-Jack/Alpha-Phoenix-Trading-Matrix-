// scripts/testCloudinary.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary from '../services/cloudinaryService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🔧 Testing Cloudinary Connection...');
console.log(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
console.log(`API Key: ${process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'Missing'}`);

// Test 1: Ping Cloudinary
try {
  const result = await cloudinary.api.ping();
  console.log('✅ Cloudinary ping successful!');
} catch (error) {
  console.error('❌ Cloudinary ping failed:', error.message);
}

// Test 2: Upload a simple text file to test
import fs from 'fs';
const testFilePath = path.join(__dirname, '..', 'test-upload.txt');
fs.writeFileSync(testFilePath, 'Test upload for Cloudinary migration');

try {
  const uploadResult = await cloudinary.uploader.upload(testFilePath, {
    folder: 'trading-app/test',
    resource_type: 'auto'
  });
  console.log('✅ Test upload successful!');
  console.log(`   URL: ${uploadResult.secure_url}`);
  console.log(`   Public ID: ${uploadResult.public_id}`);
} catch (error) {
  console.error('❌ Test upload failed:', error.message);
  console.error('Full error:', error);
} finally {
  // Clean up test file
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
}