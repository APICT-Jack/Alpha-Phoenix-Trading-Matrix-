// models/Poll.js
import mongoose from 'mongoose';

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  votes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  voteCount: {
    type: Number,
    default: 0
  }
});

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  options: [pollOptionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  multipleChoice: {
    type: Boolean,
    default: false
  },
  endsAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check if poll has expired
pollSchema.methods.hasExpired = function() {
  return new Date() > this.endsAt;
};

// Method to vote on poll
pollSchema.methods.vote = function(userId, optionIndices) {
  if (this.hasExpired()) {
    throw new Error('Poll has expired');
  }

  // If not multiple choice, ensure only one option
  if (!this.multipleChoice && optionIndices.length > 1) {
    throw new Error('This poll only allows one choice');
  }

  // Remove user's previous votes
  this.options.forEach(option => {
    option.votes = option.votes.filter(id => id.toString() !== userId.toString());
  });

  // Add new votes
  optionIndices.forEach(index => {
    if (index >= 0 && index < this.options.length) {
      if (!this.options[index].votes.includes(userId)) {
        this.options[index].votes.push(userId);
      }
    }
  });

  // Update vote counts
  this.options.forEach(option => {
    option.voteCount = option.votes.length;
  });

  // Update total votes (unique users)
  const allVoters = new Set();
  this.options.forEach(option => {
    option.votes.forEach(voterId => allVoters.add(voterId.toString()));
  });
  this.totalVotes = allVoters.size;

  return this.save();
};

export default mongoose.model('Poll', pollSchema);