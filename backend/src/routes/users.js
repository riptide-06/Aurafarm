const express = require('express');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const { authenticateToken } = require('../middleware/auth');
const { validateUserUpdate, validatePagination, validateTimeframe } = require('../middleware/validation');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('groups.groupId', 'name code memberCount stats')
      .select('-__v');

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, validateUserUpdate, async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'displayName', 'preferences'];
    const updates = {};

    // Only allow specific fields to be updated
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-__v');

    // Track profile update event
    await Analytics.trackEvent(
      req.user._id,
      req.headers['x-session-id'] || 'unknown',
      'page_view',
      { page: 'profile_update', metadata: { updatedFields: Object.keys(updates) } },
      req.headers['user-agent'],
      req.ip
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, validateTimeframe, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const userId = req.user._id;

    // Get farming analytics
    const farmingStats = await Analytics.getFarmingAnalytics(userId, timeframe);
    
    // Get product analytics
    const productStats = await Analytics.getProductAnalytics(userId, timeframe);
    
    // Get general analytics
    const generalStats = await Analytics.getUserAnalytics(userId, timeframe);

    // Get user's current stats
    const user = await User.findById(userId).select('farmingStats auraPoints level experience achievements');

    res.json({
      success: true,
      data: {
        timeframe,
        userStats: {
          auraPoints: user.auraPoints,
          level: user.level,
          experience: user.experience,
          farmingStats: user.farmingStats,
          achievements: user.achievements
        },
        analytics: {
          farming: farmingStats,
          products: productStats,
          general: generalStats
        }
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    });
  }
});

// Get user achievements
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('achievements');
    
    res.json({
      success: true,
      data: {
        achievements: user.achievements
      }
    });

  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievements'
    });
  }
});

// Get user groups
router.get('/groups', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'groups.groupId',
        select: 'name description code memberCount stats settings',
        populate: {
          path: 'owner',
          select: 'displayNameOrFull avatar'
        }
      })
      .select('groups');

    const activeGroups = user.groups.filter(group => group.isActive);

    res.json({
      success: true,
      data: {
        groups: activeGroups
      }
    });

  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user groups'
    });
  }
});

// Get leaderboard
router.get('/leaderboard', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const leaderboard = await User.getLeaderboard(parseInt(limit));
    
    // Get user's position if authenticated
    let userPosition = null;
    if (req.user) {
      const userRank = await User.countDocuments({
        totalAuraEarned: { $gt: req.user.totalAuraEarned },
        isActive: true
      });
      userPosition = userRank + 1;
    }

    res.json({
      success: true,
      data: {
        leaderboard,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: leaderboard.length
        },
        userPosition
      }
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard'
    });
  }
});

// Search users
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const users = await User.find({
      $and: [
        { isActive: true },
        { _id: { $ne: req.user._id } }, // Exclude current user
        {
          $or: [
            { displayName: { $regex: q, $options: 'i' } },
            { firstName: { $regex: q, $options: 'i' } },
            { lastName: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('displayNameOrFull avatar level totalAuraEarned')
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        users
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
});

// Get user by ID (public profile)
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({
      _id: userId,
      isActive: true,
      'preferences.publicProfile': true
    }).select('displayNameOrFull avatar level totalAuraEarned achievements farmingStats');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or profile is private'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

module.exports = router;
