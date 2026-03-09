import Follow from '../models/Follow.js';
import UserProfile from '../models/UserProfile.js';
import mongoose from 'mongoose';

// ✅ Follow a user
export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    if (followerId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: userId
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create follow relationship
      const follow = new Follow({
        follower: followerId,
        following: userId
      });
      await follow.save({ session });

      // Update follower count
      await UserProfile.findOneAndUpdate(
        { userId: userId },
        { $inc: { 'stats.followersCount': 1 } },
        { session, upsert: true }
      );

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: 'Successfully followed user',
        follow
      });
    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({
      success: false,
      message: 'Error following user: ' + error.message
    });
  }
};

// ✅ Unfollow a user
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Remove follow relationship
      const result = await Follow.findOneAndDelete({
        follower: followerId,
        following: userId
      }, { session });

      if (!result) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Not following this user'
        });
      }

      // Update follower count
      await UserProfile.findOneAndUpdate(
        { userId: userId },
        { $inc: { 'stats.followersCount': -1 } },
        { session }
      );

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: 'Successfully unfollowed user'
      });
    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({
      success: false,
      message: 'Error unfollowing user: ' + error.message
    });
  }
};

// ✅ Check follow status
export const checkFollowStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    const isFollowing = await Follow.findOne({
      follower: followerId,
      following: userId
    });

    res.status(200).json({
      success: true,
      isFollowing: !!isFollowing
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking follow status: ' + error.message
    });
  }
};

// ✅ Get user's followers
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const followers = await Follow.find({ following: userId })
      .populate('follower', 'name username email avatar')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      followers: followers.map(f => f.follower),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching followers: ' + error.message
    });
  }
};

// ✅ Get users followed by user
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const following = await Follow.find({ follower: userId })
      .populate('following', 'name username email avatar')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      following: following.map(f => f.following),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching following: ' + error.message
    });
  }
};