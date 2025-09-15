const express = require('express');
const Analytics = require('../models/Analytics');
const User = require('../models/User');
const Group = require('../models/Group');
const { authenticateToken, requireGroupMembership } = require('../middleware/auth');
const { validateTimeframe, validatePagination, validateMongoId } = require('../middleware/validation');

const router = express.Router();

// Track an event
router.post('/track', authenticateToken, async (req, res) => {
  try {
    const { eventType, eventData } = req.body;
    const userId = req.user._id;
    const sessionId = req.headers['x-session-id'] || 'unknown';

    // Validate event type
    const validEventTypes = [
      'page_view',
      'farming_start',
      'farming_complete',
      'farming_abandon',
      'group_join',
      'group_leave',
      'group_create',
      'aura_gift_sent',
      'aura_gift_received',
      'challenge_start',
      'challenge_complete',
      'product_view',
      'product_add_to_cart',
      'recommendation_click',
      'achievement_earned',
      'level_up'
    ];

    if (!validEventTypes.includes(eventType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event type'
      });
    }

    // Track the event
    await Analytics.trackEvent(
      userId,
      sessionId,
      eventType,
      eventData || {},
      req.headers['user-agent'],
      req.ip
    );

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event'
    });
  }
});

// Get user analytics dashboard
router.get('/dashboard', authenticateToken, validateTimeframe, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const userId = req.user._id;

    // Get various analytics in parallel
    const [
      farmingStats,
      productStats,
      generalStats,
      userInfo
    ] = await Promise.all([
      Analytics.getFarmingAnalytics(userId, timeframe),
      Analytics.getProductAnalytics(userId, timeframe),
      Analytics.getUserAnalytics(userId, timeframe),
      User.findById(userId).select('farmingStats auraPoints level experience achievements')
    ]);

    // Calculate farming efficiency
    const farmingData = farmingStats.find(stat => stat._id === 'farming_complete');
    const farmingAbandonData = farmingStats.find(stat => stat._id === 'farming_abandon');
    const totalFarms = (farmingData?.count || 0) + (farmingAbandonData?.count || 0);
    const successRate = totalFarms > 0 ? ((farmingData?.count || 0) / totalFarms) * 100 : 0;

    // Get top products
    const topProducts = productStats.slice(0, 5);

    // Get recent achievements
    const recentAchievements = userInfo.achievements
      .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        timeframe,
        overview: {
          totalAuraPoints: userInfo.auraPoints,
          level: userInfo.level,
          experience: userInfo.experience,
          totalFarms: userInfo.farmingStats.totalFarms,
          successfulFarms: userInfo.farmingStats.successfulFarms,
          farmingSuccessRate: Math.round(successRate * 100) / 100,
          totalTimeSpent: userInfo.farmingStats.totalTimeSpent,
          achievements: userInfo.achievements.length
        },
        farming: {
          stats: farmingStats,
          successRate: Math.round(successRate * 100) / 100,
          averageSessionDuration: farmingData?.avgDuration || 0,
          totalPointsEarned: farmingData?.totalPoints || 0
        },
        products: {
          stats: productStats,
          topProducts
        },
        general: {
          stats: generalStats,
          totalEvents: generalStats.reduce((sum, stat) => sum + stat.count, 0)
        },
        achievements: {
          recent: recentAchievements,
          total: userInfo.achievements.length
        }
      }
    });

  } catch (error) {
    console.error('Get analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics dashboard'
    });
  }
});

// Get farming analytics
router.get('/farming', authenticateToken, validateTimeframe, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const userId = req.user._id;

    const farmingStats = await Analytics.getFarmingAnalytics(userId, timeframe);

    res.json({
      success: true,
      data: {
        timeframe,
        stats: farmingStats
      }
    });

  } catch (error) {
    console.error('Get farming analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get farming analytics'
    });
  }
});

// Get product analytics
router.get('/products', authenticateToken, validateTimeframe, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const userId = req.user._id;

    const productStats = await Analytics.getProductAnalytics(userId, timeframe);

    res.json({
      success: true,
      data: {
        timeframe,
        stats: productStats
      }
    });

  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product analytics'
    });
  }
});

// Get group analytics
router.get('/group/:groupId', authenticateToken, ...validateMongoId('groupId'), requireGroupMembership, validateTimeframe, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { timeframe = '30d' } = req.query;

    const groupStats = await Analytics.getGroupAnalytics(groupId, timeframe);

    // Get group info
    const group = await Group.findById(groupId)
      .populate('members.userId', 'displayNameOrFull avatar level totalAuraEarned')
      .select('name description stats members');

    const activeMembers = group.members.filter(member => member.isActive);

    res.json({
      success: true,
      data: {
        timeframe,
        group: {
          id: group._id,
          name: group.name,
          description: group.description,
          memberCount: activeMembers.length,
          stats: group.stats
        },
        analytics: {
          stats: groupStats,
          totalEvents: groupStats.reduce((sum, stat) => sum + stat.count, 0),
          uniqueUsers: Math.max(...groupStats.map(stat => stat.uniqueUserCount), 0)
        },
        members: activeMembers
      }
    });

  } catch (error) {
    console.error('Get group analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group analytics'
    });
  }
});

// Get user activity timeline
router.get('/timeline', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    const timeline = await Analytics.find({
      userId: userId
    })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('eventType eventData timestamp')
    .lean();

    res.json({
      success: true,
      data: {
        timeline,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: timeline.length
        }
      }
    });

  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity timeline'
    });
  }
});

// Get recommendations based on analytics
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 10 } = req.query;

    // Get user's product analytics
    const productStats = await Analytics.getProductAnalytics(userId, '30d');
    
    // Get user's farming patterns
    const farmingStats = await Analytics.getFarmingAnalytics(userId, '30d');
    
    // Get user's current level and achievements
    const user = await User.findById(userId).select('level achievements farmingStats');

    // Generate recommendations based on data
    const recommendations = [];

    // Product recommendations based on farming history
    if (productStats.length > 0) {
      const topProduct = productStats[0];
      recommendations.push({
        type: 'product',
        title: 'Continue Farming',
        description: `You've been successful with ${topProduct._id.productTitle}. Try farming it again!`,
        action: 'farm_product',
        data: { productId: topProduct._id.productId },
        priority: 'high'
      });
    }

    // Level-based recommendations
    if (user.level < 5) {
      recommendations.push({
        type: 'achievement',
        title: 'Level Up Challenge',
        description: `You're level ${user.level}. Complete 5 more farming sessions to reach the next level!`,
        action: 'farm_more',
        data: { targetSessions: 5 },
        priority: 'medium'
      });
    }

    // Farming efficiency recommendations
    const farmingData = farmingStats.find(stat => stat._id === 'farming_complete');
    const abandonData = farmingStats.find(stat => stat._id === 'farming_abandon');
    
    if (abandonData && abandonData.count > 0) {
      recommendations.push({
        type: 'tip',
        title: 'Improve Farming Success',
        description: 'You\'ve abandoned some farming sessions. Try shorter sessions for better success rates!',
        action: 'optimize_farming',
        data: { targetDuration: 300 }, // 5 minutes
        priority: 'medium'
      });
    }

    // Achievement recommendations
    const recentAchievements = user.achievements.slice(-3);
    if (recentAchievements.length < 3) {
      recommendations.push({
        type: 'achievement',
        title: 'New Achievements Available',
        description: 'Complete more farming sessions to unlock new achievements!',
        action: 'explore_achievements',
        data: {},
        priority: 'low'
      });
    }

    res.json({
      success: true,
      data: {
        recommendations: recommendations.slice(0, parseInt(limit)),
        total: recommendations.length
      }
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
});

module.exports = router;
