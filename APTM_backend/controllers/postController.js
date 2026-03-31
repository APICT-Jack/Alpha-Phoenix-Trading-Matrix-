// controllers/postController.js - COMPLETE CLOUDINARY VERSION
import { Readable } from 'stream';
import Post from '../models/Post.js';
import Poll from '../models/Poll.js';
import UserProfile from '../models/UserProfile.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary, { deleteFromCloudinary, getPublicIdFromUrl, getResourceType } from '../services/cloudinaryService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// MEDIA UPLOAD UTILITY - CLOUDINARY VERSION
// ============================================
// controllers/postController.js - Updated uploadMediaFiles function
const uploadMediaFiles = async (files) => {
  const uploadedMedia = [];
  
  for (const file of files) {
    try {
      console.log(`📎 Processing file: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
      
      // Determine media type
      let mediaType = 'document';
      if (file.mimetype.startsWith('image/')) mediaType = 'image';
      else if (file.mimetype.startsWith('video/')) mediaType = 'video';

      // Create a buffer from either buffer or path
      let buffer;
      if (file.buffer) {
        // Memory storage (from multer memoryStorage)
        buffer = file.buffer;
      } else if (file.path) {
        // Disk storage (fallback)
        buffer = await fs.promises.readFile(file.path);
      } else {
        throw new Error('No file data available');
      }

      // Upload to Cloudinary using promise-based upload_stream
      const result = await new Promise((resolve, reject) => {
        const uploadOptions = {
          folder: 'trading-app/posts',
          resource_type: 'auto',
        };
        
        // Add transformations for images
        if (mediaType === 'image') {
          uploadOptions.transformation = [
            { quality: 'auto' },
            { fetch_format: 'auto' },
            { width: 1200, crop: 'limit' }
          ];
        } else if (mediaType === 'video') {
          uploadOptions.transformation = [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ];
        }
        
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        
        // Convert buffer to stream and pipe to Cloudinary
        // FIXED: Use imported Readable instead of require
        const bufferStream = Readable.from(buffer);
        bufferStream.pipe(uploadStream);
      });

      const mediaObject = {
        url: result.secure_url,
        type: mediaType,
        size: file.size,
        mimeType: file.mimetype,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format
      };

      // Add thumbnail for videos
      if (mediaType === 'video') {
        mediaObject.thumbnail = result.secure_url.replace('/upload/', '/upload/video_thumbnail/');
      }

      uploadedMedia.push(mediaObject);
      console.log(`✅ File uploaded to Cloudinary: ${result.public_id}`);
      
    } catch (error) {
      console.error('❌ Error uploading file to Cloudinary:', error);
      throw error;
    }
  }

  return uploadedMedia;
};
// ============================================
// DELETE MEDIA FILES FROM CLOUDINARY
// ============================================
const deleteMediaFiles = async (mediaArray) => {
  for (const media of mediaArray) {
    if (media.publicId && media.type !== 'chart') {
      try {
        const resourceType = media.type === 'video' ? 'video' : 
                            media.mimeType === 'application/pdf' ? 'raw' : 'image';
        await deleteFromCloudinary(media.publicId, { resource_type: resourceType });
        console.log(`🗑️ Deleted from Cloudinary: ${media.publicId}`);
      } catch (error) {
        console.error(`Error deleting ${media.publicId}:`, error);
      }
    }
  }
};

// ============================================
// CREATE POST (WITH CHART SUPPORT) - CLOUDINARY VERSION
// ============================================
export const createPost = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('📝 Create post request body:', req.body);
    console.log('📎 Files received:', req.files?.length || 0);

    const { 
      content, 
      visibility, 
      location, 
      mentions, 
      scheduledFor,
      repostOf,
      poll,
      chart
    } = req.body;

    // Handle media files if present
    let media = [];
    if (req.files && req.files.length > 0) {
      try {
        media = await uploadMediaFiles(req.files);
        console.log(`📎 Uploaded ${media.length} media files to Cloudinary`);
      } catch (uploadError) {
        console.error('❌ Media upload failed:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Media upload failed: ' + uploadError.message
        });
      }
    }

    // Handle chart if present
    if (chart && chart !== 'undefined' && chart !== 'null') {
      try {
        const chartData = typeof chart === 'string' ? JSON.parse(chart) : chart;
        console.log('📊 Adding chart to post:', chartData);
        
        if (!chartData.symbol) {
          return res.status(400).json({
            success: false,
            message: 'Chart must have a symbol'
          });
        }

        const chartMedia = {
          url: '/api/charts/widget',
          type: 'chart',
          mimeType: 'application/json',
          size: 0,
          chartData: {
            symbol: chartData.symbol || 'BTCUSDT',
            interval: chartData.interval || '30',
            theme: chartData.theme || 'dark',
            indicators: chartData.indicators || [],
            hideToolbar: chartData.hideToolbar || false,
            hideSideToolbar: chartData.hideSideToolbar || false
          }
        };
        
        media.push(chartMedia);
        console.log('✅ Chart added to media array');
      } catch (error) {
        console.error('❌ Failed to parse chart data:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid chart data format: ' + error.message
        });
      }
    }

    // Validate content or media
    const hasContent = content && content !== 'undefined' && content !== 'null' && content.trim() !== '';
    const hasMedia = media.length > 0;
    const isRepost = !!repostOf && repostOf !== 'null' && repostOf !== 'undefined';
    const hasChart = media.some(m => m.type === 'chart');
    
    let pollData = null;
    let pollId = null;
    
    if (poll && poll !== 'undefined' && poll !== 'null') {
      try {
        pollData = typeof poll === 'string' ? JSON.parse(poll) : poll;
        
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

    if (!hasContent && !hasMedia && !isRepost && !hasPoll && !hasChart) {
      return res.status(400).json({
        success: false,
        message: 'Post must have content, media, a poll, a chart, or be a repost'
      });
    }

    // Process hashtags
    const hashtagRegex = /#(\w+)/g;
    const hashtags = hasContent ? (content.match(hashtagRegex) || []).map(tag => tag.slice(1).toLowerCase()) : [];

    // Process mentions
    const mentionRegex = /@(\w+)/g;
    const mentionUsernames = hasContent ? (content.match(mentionRegex) || []).map(tag => tag.slice(1)) : [];
    
    let mentionIds = [];
    
    if (mentions) {
      if (Array.isArray(mentions)) {
        mentionIds = mentions.filter(id => id && id !== 'undefined' && id !== 'null' && id.trim() !== '');
      } else if (typeof mentions === 'string') {
        mentionIds = mentions.split(',')
          .map(id => id.trim())
          .filter(id => id && id !== 'undefined' && id !== 'null' && id !== '');
      }
    }
    
    if (mentionUsernames.length > 0) {
      const mentionedUsers = await User.find({ username: { $in: mentionUsernames } }).select('_id');
      const userIdsFromContent = mentionedUsers.map(u => u._id.toString());
      mentionIds = [...new Set([...mentionIds, ...userIdsFromContent])];
    }

    mentionIds = mentionIds.filter(id => 
      id && id !== 'undefined' && id !== 'null' && id.match(/^[0-9a-fA-F]{24}$/)
    );

    // Parse location
    let locationData = null;
    if (location && location !== 'null' && location !== 'undefined') {
      try {
        locationData = typeof location === 'string' ? JSON.parse(location) : location;
      } catch (e) {
        console.log('Location parse error:', e);
      }
    }

    let scheduledDate = null;
    if (scheduledFor && scheduledFor !== 'null' && scheduledFor !== 'undefined') {
      scheduledDate = scheduledFor;
    }

    let repostOfId = null;
    if (repostOf && repostOf !== 'null' && repostOf !== 'undefined') {
      repostOfId = repostOf;
    }

    // Create poll if it exists
    if (hasPoll) {
      try {
        const endsAt = new Date(Date.now() + (pollData.endsIn || 86400000));
        const pollOptions = pollData.options.map(optionText => ({
          text: optionText.trim(),
          votes: [],
          voteCount: 0
        }));

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

    const post = new Post(postData);
    await post.save();
    console.log('✅ Post saved with ID:', post._id);

    if (pollId) {
      await Poll.findByIdAndUpdate(pollId, { postId: post._id });
    }

    await UserProfile.findOneAndUpdate(
      { userId },
      { $inc: { 'stats.postsCount': 1 } }
    );

    await post.populate([
      { path: 'userId', select: 'name username avatar isVerified' },
      { path: 'mentions', select: 'name username avatar' },
      { 
        path: 'repostOf', 
        populate: { path: 'userId', select: 'name username avatar isVerified' } 
      }
    ]);

    let pollDataForResponse = null;
    if (pollId) {
      pollDataForResponse = await Poll.findById(pollId)
        .populate('createdBy', 'name username avatar')
        .lean();
    }

    const postResponse = post.toObject();
    if (pollDataForResponse) {
      postResponse.poll = pollDataForResponse;
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('post-created', { post: postResponse });
      
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
export const voteOnPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionIndices } = req.body;
    const userId = req.user._id;

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

    if (poll.hasExpired()) {
      return res.status(400).json({
        success: false,
        message: 'This poll has expired'
      });
    }

    const hasVoted = poll.options.some(option => 
      option.votes.some(vote => vote.toString() === userId.toString())
    );

    if (hasVoted) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this poll'
      });
    }

    if (!poll.multipleChoice && optionIndices.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'This poll only allows one choice'
      });
    }

    for (const index of optionIndices) {
      if (index < 0 || index >= poll.options.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid option selected'
        });
      }
    }

    optionIndices.forEach(index => {
      if (!poll.options[index].votes.includes(userId)) {
        poll.options[index].votes.push(userId);
        poll.options[index].voteCount = poll.options[index].votes.length;
      }
    });

    const allVoters = new Set();
    poll.options.forEach(option => {
      option.votes.forEach(voterId => allVoters.add(voterId.toString()));
    });
    poll.totalVotes = allVoters.size;

    await poll.save();

    const updatedPoll = await Poll.findById(pollId).populate('createdBy', 'name username avatar');

    const pollResponse = updatedPoll.toObject();
    pollResponse.userVotes = optionIndices;

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
// GET USER POSTS (WITH CHART SUPPORT)
// ============================================
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, type = 'all' } = req.query;
    const currentUserId = req.user?._id;

    let query = { userId };
    
    if (type === 'posts') {
      query.repostOf = null;
    } else if (type === 'reposts') {
      query.repostOf = { $ne: null };
    } else if (type === 'media') {
      query.media = { $ne: [] };
    } else if (type === 'charts') {
      query['media.type'] = 'chart';
    }

    const posts = await Post.find(query)
      .populate('userId', 'name username avatar isVerified')
      .populate('mentions', 'name username avatar')
      .populate({
        path: 'repostOf',
        populate: { path: 'userId', select: 'name username avatar isVerified' }
      })
      .populate('comments.userId', 'name username avatar isVerified')
      .populate('comments.replies.userId', 'name username avatar isVerified')
      .populate('pollId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const transformedPosts = posts.map(post => {
      const postObj = post.toObject();
      
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
        delete postObj.pollId;
      }
      
      if (currentUserId) {
        postObj.isLiked = post.likes?.some(id => id?.toString() === currentUserId.toString());
        postObj.isReposted = post.reposts?.some(r => r.userId?.toString() === currentUserId.toString());
        postObj.isSaved = false;
        
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

    const userProfile = await UserProfile.findOne({ userId });
    const followingIds = userProfile?.following || [];

    const posts = await Post.getFeedForUser(userId, followingIds, parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    posts.forEach(post => {
      post._doc.isLiked = post.likes?.some(id => id?.toString() === userId.toString());
      post._doc.isReposted = post.reposts?.some(r => r.userId?.toString() === userId.toString());
      
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
      .populate('comments.replies.userId', 'name username avatar isVerified')
      .populate('pollId');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

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
export const commentOnPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = {
      userId,
      content: content.trim(),
      likes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    await post.populate('comments.userId', 'name username avatar isVerified');
    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment
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
export const replyToComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content, parentReplyId } = req.body;
    const userId = req.user._id;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }

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

    let parentReply = null;
    let parentReplyUsername = null;
    
    if (parentReplyId) {
      parentReply = comment.replies.id(parentReplyId);
      if (parentReply) {
        const parentUser = await User.findById(parentReply.userId).select('username');
        parentReplyUsername = parentUser?.username;
      }
    }

    const reply = {
      userId,
      content: content.trim(),
      likes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      parentReplyId: parentReplyId || null,
      parentReplyUsername: parentReplyUsername || null
    };

    comment.replies.push(reply);
    await post.save();

    await post.populate('comments.replies.userId', 'name username avatar isVerified');
    const newReply = comment.replies[comment.replies.length - 1];

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      reply: newReply
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

    const originalPost = await Post.findById(postId).populate('userId', 'name username');

    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'Original post not found'
      });
    }

    const repost = new Post({
      userId,
      content: content?.trim() || '',
      visibility: visibility || 'public',
      repostOf: postId
    });

    await repost.save();

    originalPost.reposts.push({
      userId,
      content: content?.trim() || '',
      originalPostId: postId,
      createdAt: new Date()
    });
    await originalPost.save();

    await repost.populate([
      { path: 'userId', select: 'name username avatar isVerified' },
      { 
        path: 'repostOf', 
        populate: { path: 'userId', select: 'name username avatar isVerified' }
      }
    ]);

    const io = req.app.get('io');
    if (io) {
      io.to(`post-${postId}`).emit('post-reposted', {
        postId,
        userId,
        repostId: repost._id
      });
    }

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
// DELETE POST - CLOUDINARY VERSION
// ============================================
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findOne({ _id: postId, userId });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you do not have permission to delete it'
      });
    }

    // Delete associated media files from Cloudinary
    if (post.media && post.media.length > 0) {
      await deleteMediaFiles(post.media);
    }

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

    await UserProfile.findOneAndUpdate(
      { userId },
      { $inc: { 'stats.postsCount': -1 } }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`post-${postId}`).emit('post-deleted', { postId, userId });
    }

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

    const post = await Post.findOne({ _id: postId, userId });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you do not have permission to update it'
      });
    }

    post.editHistory.push({
      content: post.content,
      media: post.media,
      editedAt: new Date()
    });

    if (content !== undefined) post.content = content.trim();
    if (visibility) post.visibility = visibility;
    if (location) post.location = typeof location === 'string' ? JSON.parse(location) : location;
    if (mentions) post.mentions = Array.isArray(mentions) ? mentions : [];
    
    post.isEdited = true;

    if (content) {
      const hashtagRegex = /#(\w+)/g;
      post.hashtags = (content.match(hashtagRegex) || []).map(tag => tag.slice(1).toLowerCase());
    }

    await post.save();
    await post.populate([
      { path: 'userId', select: 'name username avatar isVerified' },
      { path: 'mentions', select: 'name username avatar' }
    ]);

    const io = req.app.get('io');
    if (io) {
      io.to(`post-${postId}`).emit('post-updated', { post });
    }

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
// UPLOAD POST MEDIA - CLOUDINARY VERSION
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
// GET TRENDING CHARTS
// ============================================
export const getTrendingCharts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const trendingSymbols = await Post.getTrendingChartSymbols(parseInt(limit));

    res.status(200).json({
      success: true,
      trending: trendingSymbols
    });
  } catch (error) {
    console.error('❌ Error getting trending charts:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting trending charts: ' + error.message
    });
  }
};

// ============================================
// GET CHARTS BY SYMBOL
// ============================================
export const getChartsBySymbol = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const posts = await Post.getChartPosts(symbol, parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const total = await Post.countDocuments({
      'media.type': 'chart',
      'media.chartData.symbol': symbol,
      isPublished: true
    });

    res.status(200).json({
      success: true,
      posts,
      symbol,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasMore: (parseInt(page) * parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('❌ Error getting charts by symbol:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting charts: ' + error.message
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