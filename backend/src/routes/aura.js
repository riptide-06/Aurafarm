const express = require('express');
const User = require('../models/User');
const Group = require('../models/Group');
const AuraTransaction = require('../models/AuraTransaction');
const Analytics = require('../models/Analytics');
const { authenticateToken, requireGroupMembership } = require('../middleware/auth');
const { validateAuraGift, validateAuraFarming, validateMongoId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Add aura points from farming
router.post('/farming', authenticateToken, validateAuraFarming, async (req, res) => {
  try {
    const { points, duration, productId, farmingSessionId } = req.body;
    const userId = req.user._id;

    // Add points to user
    await req.user.addAuraPoints(points, 'farming');

    // Create transaction record
    const transaction = await AuraTransaction.createFarmingBonus(
      userId,
      points,
      farmingSessionId,
      productId
    );

    // Update farming stats
    req.user.farmingStats.totalFarms += 1;
    req.user.farmingStats.successfulFarms += 1;
    req.user.farmingStats.totalTimeSpent += duration || 0;
    req.user.farmingStats.lastFarmDate = new Date();
    
    if (productId) {
      req.user.farmingStats.favoriteProduct = productId;
    }
    
    await req.user.save();

    // Track farming completion event
    await Analytics.trackEvent(
      userId,
      req.headers['x-session-id'] || 'unknown',
      'farming_complete',
      {
        points,
        duration,
        productId,
        farmingSessionId,
        metadata: { transactionId: transaction._id }
      },
      req.headers['user-agent'],
      req.ip
    );

    // Check for level up
    const newLevel = Math.floor(req.user.totalAuraEarned / 100) + 1;
    let levelUpAchievement = null;
    
    if (newLevel > req.user.level) {
      levelUpAchievement = {
        id: `level_${newLevel}`,
        name: `Level ${newLevel} Reached!`,
        description: `You've reached level ${newLevel}`,
        points: newLevel * 10
      };
      
      await req.user.addAchievement(levelUpAchievement);
      
      // Track level up event
      await Analytics.trackEvent(
        userId,
        req.headers['x-session-id'] || 'unknown',
        'level_up',
        {
          level: newLevel,
          points: newLevel * 10,
          metadata: { achievementId: levelUpAchievement.id }
        },
        req.headers['user-agent'],
        req.ip
      );
    }

    res.json({
      success: true,
      message: 'Aura points added successfully',
      data: {
        pointsEarned: points,
        newBalance: req.user.auraPoints,
        newLevel: req.user.level,
        experience: req.user.experience,
        levelUpAchievement,
        transaction: {
          id: transaction._id,
          type: transaction.type,
          points: transaction.points,
          timestamp: transaction.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Farming aura error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add aura points'
    });
  }
});

// Send aura points as gift
router.post('/gift', authenticateToken, validateAuraGift, async (req, res) => {
  try {
    const { toUserId, points, message, groupId } = req.body;
    const fromUserId = req.user._id;

    // Check if user has enough points
    if (req.user.auraPoints < points) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient aura points'
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(toUserId);
    if (!recipient || !recipient.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Check if recipient allows gifts (if not in same group)
    if (!groupId && !recipient.preferences.allowInvites) {
      return res.status(403).json({
        success: false,
        message: 'Recipient does not accept gifts from non-group members'
      });
    }

    // If groupId is provided, verify both users are in the group
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }

      const fromUserInGroup = group.members.some(
        member => member.userId.toString() === fromUserId.toString() && member.isActive
      );
      const toUserInGroup = group.members.some(
        member => member.userId.toString() === toUserId.toString() && member.isActive
      );

      if (!fromUserInGroup || !toUserInGroup) {
        return res.status(403).json({
          success: false,
          message: 'Both users must be members of the group'
        });
      }
    }

    // Deduct points from sender
    await req.user.spendAuraPoints(points, 'gift');

    // Add points to recipient
    await recipient.addAuraPoints(points, 'gift');

    // Create transaction record
    const transaction = await AuraTransaction.createGift(
      fromUserId,
      toUserId,
      points,
      message,
      groupId
    );

    // Track gift events
    await Promise.all([
      Analytics.trackEvent(
        fromUserId,
        req.headers['x-session-id'] || 'unknown',
        'aura_gift_sent',
        {
          toUserId,
          points,
          groupId,
          message,
          metadata: { transactionId: transaction._id }
        },
        req.headers['user-agent'],
        req.ip
      ),
      Analytics.trackEvent(
        toUserId,
        req.headers['x-session-id'] || 'unknown',
        'aura_gift_received',
        {
          fromUserId,
          points,
          groupId,
          message,
          metadata: { transactionId: transaction._id }
        },
        req.headers['user-agent'],
        req.ip
      )
    ]);

    // If group gift, update group stats
    if (groupId) {
      const group = await Group.findById(groupId);
      await group.addPoints(fromUserId, points);
    }

    // Emit real-time events
    const io = req.app.get('io');
    io.to(`user-${toUserId}`).emit('aura-gift-received', {
      fromUser: {
        id: req.user._id,
        name: req.user.displayNameOrFull,
        avatar: req.user.avatar
      },
      points,
      message,
      groupId
    });

    if (groupId) {
      io.to(`group-${groupId}`).emit('group-gift-sent', {
        fromUser: {
          id: req.user._id,
          name: req.user.displayNameOrFull,
          avatar: req.user.avatar
        },
        toUser: {
          id: recipient._id,
          name: recipient.displayNameOrFull,
          avatar: recipient.avatar
        },
        points,
        message
      });
    }

    res.json({
      success: true,
      message: 'Aura points sent successfully',
      data: {
        transaction: {
          id: transaction._id,
          type: transaction.type,
          points: transaction.points,
          recipient: {
            id: recipient._id,
            name: recipient.displayNameOrFull
          },
          message: transaction.metadata.message,
          timestamp: transaction.createdAt
        },
        newBalance: req.user.auraPoints
      }
    });

  } catch (error) {
    console.error('Send aura gift error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send aura points'
    });
  }
});

// Get user's aura transaction history
router.get('/history', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const transactions = await AuraTransaction.getUserHistory(
      req.user._id,
      parseInt(limit),
      offset
    );

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: transactions.length
        }
      }
    });

  } catch (error) {
    console.error('Get aura history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get aura history'
    });
  }
});

// Get group aura history
router.get('/group/:groupId/history', authenticateToken, ...validateMongoId('groupId'), requireGroupMembership, validatePagination, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const transactions = await AuraTransaction.getGroupHistory(
      groupId,
      parseInt(limit),
      offset
    );

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: transactions.length
        }
      }
    });

  } catch (error) {
    console.error('Get group aura history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group aura history'
    });
  }
});

// Get aura statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const userId = req.user._id;

    const stats = await AuraTransaction.getStats(userId, timeframe);

    // Get current user stats
    const user = await User.findById(userId).select('auraPoints totalAuraEarned level experience');

    res.json({
      success: true,
      data: {
        timeframe,
        currentStats: {
          auraPoints: user.auraPoints,
          totalAuraEarned: user.totalAuraEarned,
          level: user.level,
          experience: user.experience
        },
        transactionStats: stats
      }
    });

  } catch (error) {
    console.error('Get aura stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get aura statistics'
    });
  }
});

// Get leaderboard for aura points
router.get('/leaderboard', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const leaderboard = await User.find({ isActive: true })
      .sort({ totalAuraEarned: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('displayNameOrFull avatar totalAuraEarned level achievements')
      .lean();

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
    console.error('Get aura leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get aura leaderboard'
    });
  }
});

module.exports = router;
