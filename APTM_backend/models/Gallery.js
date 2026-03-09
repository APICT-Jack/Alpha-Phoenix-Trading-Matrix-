// models/Gallery.js
import mongoose from 'mongoose';

const galleryItemSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const galleryFolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  items: [galleryItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const gallerySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  folders: [galleryFolderSchema]
}, {
  timestamps: true
});

// Index for better performance
gallerySchema.index({ userId: 1 });

export default mongoose.model('Gallery', gallerySchema);