// scripts/cleanupChat.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Conversation } from '../models/Chat.js';

dotenv.config();

const cleanupChat = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop the problematic index
    await mongoose.connection.db.collection('conversations').dropIndex('participants_1');
    console.log('Dropped participants_1 index');

    // Create a new compound index that works better
    await mongoose.connection.db.collection('conversations').createIndex(
      { participants: 1 },
      { unique: true, name: 'participants_unique' }
    );
    console.log('Created new participants_unique index');

    // Find and fix any duplicate conversations
    const conversations = await Conversation.find({});
    console.log(`Found ${conversations.length} conversations`);

    // Group by participants and keep only the most recent
    const seen = new Map();
    const toDelete = [];

    for (const conv of conversations) {
      const key = conv.participants.sort().join('_');
      if (seen.has(key)) {
        toDelete.push(conv._id);
        console.log(`Marking duplicate for deletion: ${conv._id}`);
      } else {
        seen.set(key, conv._id);
      }
    }

    if (toDelete.length > 0) {
      await Conversation.deleteMany({ _id: { $in: toDelete } });
      console.log(`Deleted ${toDelete.length} duplicate conversations`);
    }

    console.log('Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

cleanupChat();