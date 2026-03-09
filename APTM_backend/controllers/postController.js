// controllers/postController.js - COMPLETE FIXED VERSION WITH ALL FUNCTIONS
import Post from '../models/Post.js';
import Poll from '../models/Poll.js';
import UserProfile from '../models/UserProfile.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// MEDIA UPLOAD UTILITY
// ============================================
// In postController.js - Enhanced media upload function
const uploadMediaFiles = async (files) => {
  const uploadedMedia = [];
  const uploadDir = path.join(__dirname, '..', 'uploads', 'posts');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Created upload directory:', uploadDir);
  }

  for (const file of files) {
    try {
      console.log(`📎 Processing file: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
      
      const fileExtension = path.extname(file.originalname) || '.jpg';
      const fileName = `post-${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);
      
      // Write file
      fs.writeFileSync(filePath, file.buffer);
      console.log(`✅ File saved: ${fileName}`);

      // Determine media type
      let mediaType = 'document';
      if (file.mimetype.startsWith('image/')) mediaType = 'image';
      else if (file.mimetype.startsWith('video/')) mediaType = 'video';

      const mediaObject = {
        url: `/uploads/posts/${fileName}`,
        type: mediaType,
        size: file.size,
        mimeType: file.mimetype
      };

      // Add thumbnail for videos (placeholder)
      if (mediaType === 'video') {
        mediaObject.thumbnail = `/uploads/posts/thumbnails/${fileName}.jpg`;
      }

      uploadedMedia.push(mediaObject);
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      throw error;
    }
  }

  return uploadedMedia;
};

// ============================================
// CREATE POST
// ============================================
// In postController.js - Updated createPost with better FormData handling
// In postController.js - Update the createPost function
// controllers/postController.js - Update the createPost function
// controllers/postController.js - Fixed createPost function
export const createPost = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Log what we received
    console.log('📝 Create post request body:', req.body);
    console.log('📎 Files received:', req.files?.length || 0);

    // Extract fields from body
    const { 
      content, 
      visibility, 
      location, 
      mentions, 
      scheduledFor,
      repostOf,
      poll
    } = req.body;

    // Handle media files if present
    let media = [];
    if (req.files && req.files.length > 0) {
      try {
        media = await uploadMediaFiles(req.files);
        console.log(`📎 Uploaded ${media.length} media files`);
      } catch (uploadError) {
        console.error('❌ Media upload failed:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Media upload failed: ' + uploadError.message
        });
      }
    }

    // Validate content or media
    const hasContent = content && content !== 'undefined' && content !== 'null' && content.trim() !== '';
    const hasMedia = media.length > 0;
    const isRepost = !!repostOf && repostOf !== 'null' && repostOf !== 'undefined';
    
    // Check for poll
    let pollData = null;
    let pollId = null;
    
    if (poll && poll !== 'undefined' && poll !== 'null') {
      try {
        pollData = typeof poll === 'string' ? JSON.parse(poll) : poll;
        console.log('📊 Parsed poll data:', pollData);
        
        // Validate poll data
        if (!pollData.question || !pollData.options || pollData.options.length < 2) {
          return res.status(400).json({
            success: false,
            message: 'Poll must have a question and at least 2 options'
          });
        }
      } catch (e) {
        console.error('❌ Failed to parse poll data:', e);
        return res.status(400).json({
          success: false,
          message: 'Invalid poll data format'
        });
      }
    }

    const hasPoll = !!pollData;

    console.log('📊 Validation:', { hasContent, hasMedia, isRepost, hasPoll });

    if (!hasContent && !hasMedia && !isRepost && !hasPoll) {
      return res.status(400).json({
        success: false,
        message: 'Post must have content, media, a poll, or be a repost'
      });
    }

    // Process hashtags from content
    const hashtagRegex = /#(\w+)/g;
    const hashtags = hasContent ? (content.match(hashtagRegex) || []).map(tag => tag.slice(1).toLowerCase()) : [];

    // Process mentions from content (@username)
    const mentionRegex = /@(\w+)/g;
    const mentionUsernames = hasContent ? (content.match(mentionRegex) || []).map(tag => tag.slice(1)) : [];
    
    // Handle mentions from form data
    let mentionIds = [];
    
    if (mentions) {
      console.log('Processing mentions from form data:', mentions);
      
      if (Array.isArray(mentions)) {
        mentionIds = mentions.filter(id => 
          id && id !== 'undefined' && id !== 'null' && id.trim() !== ''
        );
      } else if (typeof mentions === 'string') {
        mentionIds = mentions.split(',')
          .map(id => id.trim())
          .filter(id => id && id !== 'undefined' && id !== 'null' && id !== '');
      }
      
      console.log('Filtered mention IDs from form data:', mentionIds);
    }
    
    // Add mentions from @username in content
    if (mentionUsernames.length > 0) {
      console.log('Looking up usernames from content:', mentionUsernames);
      const mentionedUsers = await User.find({ username: { $in: mentionUsernames } }).select('_id');
      const userIdsFromContent = mentionedUsers.map(u => u._id.toString());
      console.log('Found user IDs from content:', userIdsFromContent);
      
      // Combine and remove duplicates
      mentionIds = [...new Set([...mentionIds, ...userIdsFromContent])];
    }

    // Final filter to ensure no invalid values
    mentionIds = mentionIds.filter(id => 
      id && id !== 'undefined' && id !== 'null' && id.match(/^[0-9a-fA-F]{24}$/)
    );

    console.log('Final mention IDs:', mentionIds);

    // Parse location if it's a string
    let locationData = null;
    if (location && location !== 'null' && location !== 'undefined') {
      try {
        locationData = typeof location === 'string' ? JSON.parse(location) : location;
      } catch (e) {
        console.log('Location parse error:', e);
      }
    }

    // Parse scheduledFor
    let scheduledDate = null;
    if (scheduledFor && scheduledFor !== 'null' && scheduledFor !== 'undefined') {
      scheduledDate = scheduledFor;
    }

    // Parse repostOf
    let repostOfId = null;
    if (repostOf && repostOf !== 'null' && repostOf !== 'undefined') {
      repostOfId = repostOf;
    }

    // Create poll if it exists
    if (hasPoll) {
      try {
        // Calculate end date
        const endsAt = new Date(Date.now() + (pollData.endsIn || 86400000));
        
        // Create poll options
        const pollOptions = pollData.options.map(optionText => ({
          text: optionText.trim(),
          votes: [],
          voteCount: 0
        }));

        console.log('📊 Creating poll with:', {
          question: pollData.question.trim(),
          options: pollOptions,
          multipleChoice: pollData.multipleChoice || false,
          endsAt: endsAt
        });

        // Create poll document
        const newPoll = await Poll.create({
          question: pollData.question.trim(),
          options: pollOptions,
          createdBy: userId,
          multipleChoice: pollData.multipleChoice || false,
          endsAt: endsAt,
          isActive: true,
          totalVotes: 0
        });

        pollId = newPoll._id;
        console.log('✅ Poll created with ID:', pollId);
      } catch (pollError) {
        console.error('❌ Failed to create poll:', pollError);
        return res.status(400).json({
          success: false,
          message: 'Failed to create poll: ' + pollError.message
        });
      }
    }

    // Create post object
    const postData = {
      userId,
      content: hasContent ? content.trim() : '',
      media,
      visibility: visibility || 'public',
      hashtags,
      mentions: mentionIds,
      location: locationData,
      isScheduled: !!scheduledDate,
      scheduledFor: scheduledDate,
      repostOf: repostOfId,
      pollId: pollId
    };

    console.log('📦 Creating post with data:', {
      userId: postData.userId,
      contentLength: postData.content?.length,
      mediaCount: postData.media.length,
      mentionsCount: postData.mentions.length,
      hashtagsCount: postData.hashtags.length,
      hasPoll: !!pollId,
      pollId: pollId
    });

    const post = new Post(postData);
    await post.save();
    console.log('✅ Post saved with ID:', post._id);

    // Update poll with postId reference
    if (pollId) {
      await Poll.findByIdAndUpdate(pollId, { postId: post._id });
    }

    // Update user's post count
    await UserProfile.findOneAndUpdate(
      { userId },
      { $inc: { 'stats.postsCount': 1 } }
    );

    // ========== FIXED POPULATION SECTION ==========
    // First populate basic fields
    await post.populate([
      { path: 'userId', select: 'name username avatar isVerified' },
      { path: 'mentions', select: 'name username avatar' },
      { 
        path: 'repostOf', 
        populate: { path: 'userId', select: 'name username avatar isVerified' } 
      }
    ]);

    // If there's a poll, fetch it separately and attach to the response
    let pollDataForResponse = null;
    if (pollId) {
      pollDataForResponse = await Poll.findById(pollId)
        .populate('createdBy', 'name username avatar')
        .lean(); // Use lean() for plain JavaScript object
      
      console.log('📊 Fetched poll data for response:', pollDataForResponse);
    }

    // Convert post to plain object and attach poll
    const postResponse = post.toObject();
    if (pollDataForResponse) {
      postResponse.poll = pollDataForResponse;
    }

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('post-created', { post: postResponse });
      
      // Notify mentioned users
      if (mentionIds.length > 0) {
        mentionIds.forEach(mentionedUserId => {
          io.to(`user-${mentionedUserId}`).emit('user-mentioned', {
            postId: post._id,
            mentionedBy: userId,
            content: content?.substring(0, 100)
          });
        });
      }
    }

    console.log('✅ Post created successfully with poll:', !!pollDataForResponse);

    res.status(201).json({
      success: true,
      message: scheduledDate ? 'Post scheduled successfully' : 'Post created successfully',
      post: postResponse
    });
  } catch (error) {
    console.error('❌ Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post: ' + error.message
    });
  }
};
// ============================================
// VOTE ON POLL
// ============================================
// ============================================
// VOTE ON POLL
// ============================================
export const voteOnPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionIndices } = req.body;
    const userId = req.user._id;

    console.log('🗳️ Voting on poll:', pollId);
    console.log('🗳️ Option indices:', optionIndices);
    console.log('🗳️ User ID:', userId);

    if (!optionIndices || !Array.isArray(optionIndices) || optionIndices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one option'
      });
    }

    const poll = await Poll.findById(pollId);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Check if poll has expired
    if (poll.hasExpired()) {
      return res.status(400).json({
        success: false,
        message: 'This poll has expired'
      });
    }

    // Check if user has already voted
    const hasVoted = poll.options.some(option => 
      option.votes.some(vote => vote.toString() === userId.toString())
    );

    if (hasVoted) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this poll'
      });
    }

    // Check if multiple choice is allowed
    if (!poll.multipleChoice && optionIndices.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'This poll only allows one choice'
      });
    }

    // Validate option indices
    for (const index of optionIndices) {
      if (index < 0 || index >= poll.options.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid option selected'
        });
      }
    }

    // Add votes
    optionIndices.forEach(index => {
      if (!poll.options[index].votes.includes(userId)) {
        poll.options[index].votes.push(userId);
        poll.options[index].voteCount = poll.options[index].votes.length;
      }
    });

    // Update total votes (unique users)
    const allVoters = new Set();
    poll.options.forEach(option => {
      option.votes.forEach(voterId => allVoters.add(voterId.toString()));
    });
    poll.totalVotes = allVoters.size;

    await poll.save();

    // Get updated poll with populated data
    const updatedPoll = await Poll.findById(pollId).populate('createdBy', 'name username avatar');

    // Add user votes to response
    const pollResponse = updatedPoll.toObject();
    pollResponse.userVotes = optionIndices;

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`poll-${pollId}`).emit('poll-updated', {
        pollId,
        options: updatedPoll.options.map(opt => ({
          text: opt.text,
          voteCount: opt.voteCount,
          votes: opt.votes
        })),
        totalVotes: updatedPoll.totalVotes
      });
    }

    console.log('✅ Vote recorded successfully');

    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      poll: pollResponse
    });
  } catch (error) {
    console.error('❌ Error voting on poll:', error);
    res.status(500).json({
      success: false,
      message: 'Error voting on poll: ' + error.message
    });
  }
};
// ============================================
// GET POLL RESULTS
// ============================================
export const getPollResults = async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user?._id;

    const poll = await Poll.findById(pollId);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Check if user has voted
    let userVotes = [];
    if (userId) {
      poll.options.forEach((option, index) => {
        if (option.votes.some(id => id.toString() === userId.toString())) {
          userVotes.push(index);
        }
      });
    }

    res.status(200).json({
      success: true,
      poll: {
        id: poll._id,
        question: poll.question,
        options: poll.options.map(opt => ({
          text: opt.text,
          voteCount: opt.voteCount,
          percentage: poll.totalVotes > 0 ? (opt.voteCount / poll.totalVotes) * 100 : 0
        })),
        totalVotes: poll.totalVotes,
        multipleChoice: poll.multipleChoice,
        hasExpired: poll.hasExpired(),
        endsAt: poll.endsAt,
        userVotes
      }
    });
  } catch (error) {
    console.error('❌ Error getting poll results:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting poll results: ' + error.message
    });
  }
};
// ============================================
// GET USER POSTS
// ============================================
// In getUserPosts function - add poll population
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, type = 'all' } = req.query;
    const currentUserId = req.user?._id;

    console.log('📖 Fetching posts for user:', userId);

    // Build query
    let query = { userId };
    
    // Filter by post type
    if (type === 'posts') {
      query.repostOf = null;
    } else if (type === 'reposts') {
      query.repostOf = { $ne: null };
    } else if (type === 'media') {
      query.media = { $ne: [] };
    }

    console.log('🔍 Query:', JSON.stringify(query));

    const posts = await Post.find(query)
      .populate('userId', 'name username avatar isVerified')
      .populate('mentions', 'name username avatar')
      .populate({
        path: 'repostOf',
        populate: { path: 'userId', select: 'name username avatar isVerified' }
      })
      .populate('comments.userId', 'name username avatar isVerified')
      .populate('comments.replies.userId', 'name username avatar isVerified')
      .populate('pollId') // Add this to populate poll data
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    console.log(`✅ Found ${posts.length} posts`);

    // Transform posts to include poll data in a consistent format
    const transformedPosts = posts.map(post => {
      const postObj = post.toObject();
      
      // If there's a poll, format it properly
      if (postObj.pollId) {
        postObj.poll = {
          _id: postObj.pollId._id,
          question: postObj.pollId.question,
          options: postObj.pollId.options.map(opt => ({
            text: opt.text,
            voteCount: opt.voteCount,
            votes: opt.votes
          })),
          totalVotes: postObj.pollId.totalVotes,
          multipleChoice: postObj.pollId.multipleChoice,
          endsAt: postObj.pollId.endsAt,
          hasExpired: new Date() > new Date(postObj.pollId.endsAt),
          createdBy: postObj.pollId.createdBy
        };
        delete postObj.pollId; // Remove the raw pollId
      }
      
      // Add interaction status for current user
      if (currentUserId) {
        postObj.isLiked = post.likes?.some(id => id?.toString() === currentUserId.toString());
        postObj.isReposted = post.reposts?.some(r => r.userId?.toString() === currentUserId.toString());
        postObj.isSaved = false;
        
        // Add comment interaction status
        if (postObj.comments) {
          postObj.comments.forEach(comment => {
            comment.isLiked = comment.likes?.some(id => id?.toString() === currentUserId.toString());
            if (comment.replies) {
              comment.replies.forEach(reply => {
                reply.isLiked = reply.likes?.some(id => id?.toString() === currentUserId.toString());
              });
            }
          });
        }
      }
      
      return postObj;
    });

    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      posts: transformedPosts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasMore: (parseInt(page) * parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('❌ Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts: ' + error.message
    });
  }
};

// ============================================
// GET FEED
// ============================================
export const getFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    console.log('📖 Fetching feed for user:', userId);

    // Get user's following list
    const userProfile = await UserProfile.findOne({ userId });
    const followingIds = userProfile?.following || [];

    // Get posts from followed users and public posts
    const posts = await Post.getFeedForUser(userId, followingIds, parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    // Add interaction status
    posts.forEach(post => {
      post._doc.isLiked = post.likes?.some(id => id?.toString() === userId.toString());
      post._doc.isReposted = post.reposts?.some(r => r.userId?.toString() === userId.toString());
      
      // Add comment interaction status
      if (post.comments) {
        post.comments.forEach(comment => {
          comment._doc.isLiked = comment.likes?.some(id => id?.toString() === userId.toString());
          if (comment.replies) {
            comment.replies.forEach(reply => {
              reply._doc.isLiked = reply.likes?.some(id => id?.toString() === userId.toString());
            });
          }
        });
      }
    });

    const total = await Post.countDocuments({
      $or: [
        { userId: { $in: [userId, ...followingIds] } },
        { visibility: 'public' }
      ]
    });

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasMore: (parseInt(page) * parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('❌ Error fetching feed:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feed: ' + error.message
    });
  }
};

// ============================================
// GET POST BY ID
// ============================================
export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?._id;

    const post = await Post.findById(postId)
      .populate('userId', 'name username avatar isVerified')
      .populate('mentions', 'name username avatar')
      .populate({
        path: 'repostOf',
        populate: { path: 'userId', select: 'name username avatar isVerified' }
      })
      .populate('comments.userId', 'name username avatar isVerified')
      .populate('comments.replies.userId', 'name username avatar isVerified');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Add interaction status
    if (userId) {
      post._doc.isLiked = post.likes?.some(id => id?.toString() === userId.toString());
      post._doc.isReposted = post.reposts?.some(r => r.userId?.toString() === userId.toString());
    }

    res.status(200).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching post: ' + error.message
    });
  }
};

// ============================================
// LIKE POST
// ============================================
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    console.log('❤️ Processing like for post:', postId);

    const post = await Post.findById(postId).populate('userId', 'name username');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const likeIndex = post.likes.findIndex(id => id?.toString() === userId.toString());
    const wasLiked = likeIndex > -1;

    if (wasLiked) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    const isLiked = !wasLiked;
    const likesCount = post.likes.length;

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`post-${postId}`).emit('like-updated', {
        postId,
        userId,
        liked: isLiked,
        likes: post.likes,
        count: likesCount
      });
    }

    // Create notification if liked (and not own post)
    if (isLiked && post.userId._id.toString() !== userId.toString()) {
      if (io) {
        io.to(`user-${post.userId._id}`).emit('notification', {
          type: 'like',
          senderId: userId,
          senderName: req.user.name,
          postId: post._id,
          content: `${req.user.name} liked your post`,
          createdAt: new Date()
        });
      }
    }

    console.log(`✅ Post ${wasLiked ? 'unliked' : 'liked'} successfully`);

    res.status(200).json({
      success: true,
      message: wasLiked ? 'Post unliked' : 'Post liked',
      likes: likesCount,
      isLiked,
      likesList: post.likes
    });
  } catch (error) {
    console.error('❌ Error liking post:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking post: ' + error.message
    });
  }
};

// ============================================
// COMMENT ON POST
// ============================================
// ============================================
// COMMENT ON POST - WITH DEBUG LOGS
// ============================================
// ============================================
// COMMENT ON POST - WITH EXTENSIVE DEBUG LOGS
// ============================================
export const commentOnPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    console.log('='.repeat(50));
    console.log('💬 COMMENT ON POST - DEBUG');
    console.log('='.repeat(50));
    console.log('Post ID:', postId);
    console.log('User ID:', userId);
    console.log('Content received:', content);
    console.log('Content type:', typeof content);
    console.log('Content length:', content?.length);
    console.log('Content trimmed:', content?.trim());

    if (!content || content.trim() === '') {
      console.log('❌ Validation failed: content is empty');
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      console.log('❌ Post not found:', postId);
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    console.log('✅ Post found:', post._id);
    console.log('Current comments count:', post.comments?.length || 0);

    // Create comment object
    const comment = {
      userId,
      content: content.trim(),
      likes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('📝 Comment object being created:', {
      userId: comment.userId,
      content: comment.content,
      contentLength: comment.content.length,
      createdAt: comment.createdAt
    });

    // Add to post
    post.comments.push(comment);
    await post.save();

    console.log('✅ Post saved');
    console.log('New comments count:', post.comments.length);

    // Get the newly created comment
    const newComment = post.comments[post.comments.length - 1];
    
    console.log('📦 Saved comment data:', {
      id: newComment._id,
      userId: newComment.userId,
      content: newComment.content,
      contentLength: newComment.content?.length
    });

    // Populate user data
    await post.populate('comments.userId', 'name username avatar isVerified');
    const populatedComment = post.comments[post.comments.length - 1];
    
    console.log('👤 Populated comment:', {
      id: populatedComment._id,
      content: populatedComment.content,
      user: populatedComment.userId?.name
    });

    console.log('='.repeat(50));

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: populatedComment
    });
  } catch (error) {
    console.error('❌ ERROR in commentOnPost:', error);
    res.status(500).json({
      success: false,
      message: 'Error commenting on post: ' + error.message
    });
  }
};
// ============================================
// REPLY TO COMMENT
// ============================================
// In your postController.js, ensure the reply object includes content
// ============================================
// REPLY TO COMMENT - COMPLETE FIXED VERSION
// ============================================
// ============================================
// REPLY TO COMMENT - WITH EXTENSIVE DEBUG LOGS
// ============================================
// ============================================
// REPLY TO COMMENT - WITH EXTENSIVE DEBUG LOGS
// ============================================
export const replyToComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content, parentReplyId } = req.body;
    const userId = req.user._id;

    console.log('='.repeat(50));
    console.log('💬 REPLY TO COMMENT - DEBUG');
    console.log('='.repeat(50));
    console.log('Post ID:', postId);
    console.log('Comment ID:', commentId);
    console.log('User ID:', userId);
    console.log('Content received:', content);
    console.log('Content type:', typeof content);
    console.log('Content length:', content?.length);
    console.log('Content trimmed:', content?.trim());
    console.log('Parent Reply ID:', parentReplyId);

    if (!content || content.trim() === '') {
      console.log('❌ Validation failed: content is empty');
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      console.log('❌ Post not found:', postId);
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    console.log('✅ Post found:', post._id);
    console.log('Post comments count:', post.comments?.length || 0);

    // Find the comment
    const comment = post.comments.id(commentId);
    if (!comment) {
      console.log('❌ Comment not found:', commentId);
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    console.log('✅ Comment found:', comment._id);
    console.log('Comment content:', comment.content);
    console.log('Comment replies count:', comment.replies?.length || 0);

    // Find parent reply if this is a nested reply
    let parentReply = null;
    let parentReplyUsername = null;
    
    if (parentReplyId) {
      console.log('Looking for parent reply:', parentReplyId);
      parentReply = comment.replies.id(parentReplyId);
      if (parentReply) {
        console.log('✅ Parent reply found:', parentReply._id);
        const parentUser = await User.findById(parentReply.userId).select('username');
        parentReplyUsername = parentUser?.username;
        console.log('Parent username:', parentReplyUsername);
      } else {
        console.log('❌ Parent reply not found:', parentReplyId);
      }
    }

    // Create reply object
    const reply = {
      userId,
      content: content.trim(),
      likes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      parentReplyId: parentReplyId || null,
      parentReplyUsername: parentReplyUsername || null
    };

    console.log('📝 Reply object being created:', {
      userId: reply.userId,
      content: reply.content,
      contentLength: reply.content.length,
      parentReplyId: reply.parentReplyId,
      parentReplyUsername: reply.parentReplyUsername,
      createdAt: reply.createdAt
    });

    // Add reply to comment
    comment.replies.push(reply);
    await post.save();

    console.log('✅ Post saved');
    console.log('Comment replies count now:', comment.replies.length);

    // Get the newly created reply
    const newReply = comment.replies[comment.replies.length - 1];
    
    console.log('📦 Saved reply data:', {
      id: newReply._id,
      userId: newReply.userId,
      content: newReply.content,
      contentLength: newReply.content?.length,
      parentReplyId: newReply.parentReplyId,
      parentReplyUsername: newReply.parentReplyUsername
    });

    // Populate user data
    await post.populate('comments.replies.userId', 'name username avatar isVerified');
    const populatedReply = comment.replies[comment.replies.length - 1];
    
    console.log('👤 Populated reply:', {
      id: populatedReply._id,
      content: populatedReply.content,
      user: populatedReply.userId?.name,
      username: populatedReply.userId?.username
    });

    console.log('='.repeat(50));

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      reply: populatedReply
    });
  } catch (error) {
    console.error('❌ ERROR in replyToComment:', error);
    res.status(500).json({
      success: false,
      message: 'Error replying to comment: ' + error.message
    });
  }
};
// ============================================
// LIKE COMMENT
// ============================================
export const likeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    console.log('❤️ Processing like for comment:', commentId);

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const likeIndex = comment.likes.findIndex(id => id?.toString() === userId.toString());
    const wasLiked = likeIndex > -1;

    if (wasLiked) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(userId);
    }

    await post.save();

    const isLiked = !wasLiked;
    const likesCount = comment.likes.length;

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`post-${postId}`).emit('comment-like-updated', {
        postId,
        commentId,
        userId,
        liked: isLiked,
        likes: comment.likes,
        count: likesCount
      });
    }

    res.status(200).json({
      success: true,
      message: wasLiked ? 'Comment unliked' : 'Comment liked',
      likes: likesCount,
      isLiked
    });
  } catch (error) {
    console.error('❌ Error liking comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking comment: ' + error.message
    });
  }
};

// ============================================
// LIKE REPLY
// ============================================
export const likeReply = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.params;
    const userId = req.user._id;

    console.log('❤️ Processing like for reply:', replyId);

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    const likeIndex = reply.likes.findIndex(id => id?.toString() === userId.toString());
    const wasLiked = likeIndex > -1;

    if (wasLiked) {
      reply.likes.splice(likeIndex, 1);
    } else {
      reply.likes.push(userId);
    }

    await post.save();

    const isLiked = !wasLiked;
    const likesCount = reply.likes.length;

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`post-${postId}`).emit('reply-like-updated', {
        postId,
        commentId,
        replyId,
        userId,
        liked: isLiked,
        likes: reply.likes,
        count: likesCount
      });
    }

    res.status(200).json({
      success: true,
      message: wasLiked ? 'Reply unliked' : 'Reply liked',
      likes: likesCount,
      isLiked
    });
  } catch (error) {
    console.error('❌ Error liking reply:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking reply: ' + error.message
    });
  }
};

// ============================================
// REPOST POST
// ============================================
export const repostPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, visibility } = req.body;
    const userId = req.user._id;

    console.log('🔄 Reposting post:', postId);

    const originalPost = await Post.findById(postId).populate('userId', 'name username');

    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'Original post not found'
      });
    }

    // Create repost
    const repost = new Post({
      userId,
      content: content?.trim() || '',
      visibility: visibility || 'public',
      repostOf: postId
    });

    await repost.save();

    // Add to reposts array of original post
    originalPost.reposts.push({
      userId,
      content: content?.trim() || '',
      originalPostId: postId,
      createdAt: new Date()
    });
    await originalPost.save();

    // Populate repost data
    await repost.populate([
      { path: 'userId', select: 'name username avatar isVerified' },
      { 
        path: 'repostOf', 
        populate: { path: 'userId', select: 'name username avatar isVerified' }
      }
    ]);

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`post-${postId}`).emit('post-reposted', {
        postId,
        userId,
        repostId: repost._id
      });
    }

    // Create notification
    if (originalPost.userId._id.toString() !== userId.toString()) {
      if (io) {
        io.to(`user-${originalPost.userId._id}`).emit('notification', {
          type: 'repost',
          senderId: userId,
          senderName: req.user.name,
          postId: originalPost._id,
          repostId: repost._id,
          content: content?.trim() || `${req.user.name} reposted your post`,
          createdAt: new Date()
        });
      }
    }

    console.log('✅ Repost created successfully');

    res.status(201).json({
      success: true,
      message: 'Post reposted successfully',
      repost
    });
  } catch (error) {
    console.error('❌ Error reposting:', error);
    res.status(500).json({
      success: false,
      message: 'Error reposting: ' + error.message
    });
  }
};

// ============================================
// DELETE POST
// ============================================
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    console.log('🗑️ Deleting post:', postId);

    const post = await Post.findOne({ _id: postId, userId });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you do not have permission to delete it'
      });
    }

    // Delete associated media files
    if (post.media && post.media.length > 0) {
      post.media.forEach(media => {
        if (media.url) {
          const filePath = path.join(__dirname, '..', media.url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted media: ${media.url}`);
          }
        }
      });
    }

    // If this is a repost, remove from original post's reposts array
    if (post.repostOf) {
      const originalPost = await Post.findById(post.repostOf);
      if (originalPost) {
        originalPost.reposts = originalPost.reposts.filter(
          r => r.userId?.toString() !== userId.toString()
        );
        await originalPost.save();
      }
    }

    await Post.findByIdAndDelete(postId);

    // Update user's post count
    await UserProfile.findOneAndUpdate(
      { userId },
      { $inc: { 'stats.postsCount': -1 } }
    );

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`post-${postId}`).emit('post-deleted', { postId, userId });
    }

    console.log('✅ Post deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post: ' + error.message
    });
  }
};

// ============================================
// UPDATE POST
// ============================================
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, visibility, location, mentions } = req.body;
    const userId = req.user._id;

    console.log('📝 Updating post:', postId);

    const post = await Post.findOne({ _id: postId, userId });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you do not have permission to update it'
      });
    }

    // Save edit history
    post.editHistory.push({
      content: post.content,
      media: post.media,
      editedAt: new Date()
    });

    // Update post
    if (content !== undefined) post.content = content.trim();
    if (visibility) post.visibility = visibility;
    if (location) post.location = typeof location === 'string' ? JSON.parse(location) : location;
    if (mentions) post.mentions = Array.isArray(mentions) ? mentions : [];
    
    post.isEdited = true;

    // Extract hashtags
    if (content) {
      const hashtagRegex = /#(\w+)/g;
      post.hashtags = (content.match(hashtagRegex) || []).map(tag => tag.slice(1).toLowerCase());
    }

    await post.save();

    await post.populate([
      { path: 'userId', select: 'name username avatar isVerified' },
      { path: 'mentions', select: 'name username avatar' }
    ]);

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`post-${postId}`).emit('post-updated', { post });
    }

    console.log('✅ Post updated successfully');

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('❌ Error updating post:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating post: ' + error.message
    });
  }
};

// ============================================
// TOGGLE PIN POST
// ============================================
export const togglePinPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    console.log('📌 Toggling pin for post:', postId);

    // First, unpin any other pinned posts if pinning this one
    if (req.body.pin) {
      await Post.updateMany(
        { userId, isPinned: true },
        { isPinned: false, pinnedAt: null }
      );
    }

    const post = await Post.findOneAndUpdate(
      { _id: postId, userId },
      { 
        isPinned: req.body.pin,
        pinnedAt: req.body.pin ? new Date() : null
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you do not have permission to pin it'
      });
    }

    res.status(200).json({
      success: true,
      message: post.isPinned ? 'Post pinned' : 'Post unpinned',
      isPinned: post.isPinned
    });
  } catch (error) {
    console.error('❌ Error toggling pin:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling pin: ' + error.message
    });
  }
};

// ============================================
// GET TRENDING HASHTAGS
// ============================================
export const getTrendingHashtags = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const hashtags = await Post.getTrendingHashtags(parseInt(limit));

    res.status(200).json({
      success: true,
      hashtags
    });
  } catch (error) {
    console.error('❌ Error getting trending hashtags:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting trending hashtags: ' + error.message
    });
  }
};

// ============================================
// SEARCH BY HASHTAG
// ============================================
export const searchByHashtag = async (req, res) => {
  try {
    const { hashtag } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user?._id;

    const query = { 
      hashtags: hashtag.toLowerCase(),
      isPublished: true 
    };

    const posts = await Post.find(query)
      .populate('userId', 'name username avatar isVerified')
      .populate({
        path: 'repostOf',
        populate: { path: 'userId', select: 'name username avatar isVerified' }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Add interaction status
    if (userId) {
      posts.forEach(post => {
        post._doc.isLiked = post.likes?.some(id => id?.toString() === userId.toString());
        post._doc.isReposted = post.reposts?.some(r => r.userId?.toString() === userId.toString());
      });
    }

    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      posts,
      hashtag,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasMore: (parseInt(page) * parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('❌ Error searching by hashtag:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching by hashtag: ' + error.message
    });
  }
};

// ============================================
// GET SCHEDULED POSTS
// ============================================
export const getScheduledPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find({ 
      userId, 
      isScheduled: true,
      scheduledFor: { $gt: new Date() }
    })
      .sort({ scheduledFor: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Post.countDocuments({ 
      userId, 
      isScheduled: true,
      scheduledFor: { $gt: new Date() }
    });

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('❌ Error getting scheduled posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting scheduled posts: ' + error.message
    });
  }
};

// ============================================
// UPLOAD POST MEDIA
// ============================================
export const uploadPostMedia = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedMedia = await uploadMediaFiles(req.files);

    res.status(200).json({
      success: true,
      message: `${uploadedMedia.length} files uploaded successfully`,
      media: uploadedMedia
    });
  } catch (error) {
    console.error('❌ Error uploading media:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading media: ' + error.message
    });
  }
};

// ============================================
// REPORT POST
// ============================================
export const reportPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason, details } = req.body;
    const userId = req.user._id;

    console.log('🚨 Post reported:', { postId, userId, reason, details });

    // Here you would save the report to a reports collection
    // For now, just acknowledge the report

    res.status(200).json({
      success: true,
      message: 'Post reported successfully'
    });
  } catch (error) {
    console.error('❌ Error reporting post:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting post: ' + error.message
    });
  }
};