const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    enum: [
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
    ],
    required: true
  },
  eventData: {
    page: { type: String, default: null },
    duration: { type: Number, default: null }, // in seconds
    points: { type: Number, default: null },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    productId: { type: String, default: null },
    productTitle: { type: String, default: null },
    productPrice: { type: Number, default: null },
    category: { type: String, default: null },
    recommendationType: { type: String, default: null },
    achievementId: { type: String, default: null },
    level: { type: Number, default: null },
    farmingSessionId: { type: String, default: null },
    challengeId: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  userAgent: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
analyticsSchema.index({ userId: 1, timestamp: -1 });
analyticsSchema.index({ sessionId: 1 });
analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ 'eventData.groupId': 1, timestamp: -1 });
analyticsSchema.index({ 'eventData.productId': 1, timestamp: -1 });
analyticsSchema.index({ timestamp: -1 });

// Static method to track event
analyticsSchema.statics.trackEvent = function(userId, sessionId, eventType, eventData = {}, userAgent = null, ipAddress = null) {
  return this.create({
    userId,
    sessionId,
    eventType,
    eventData,
    userAgent,
    ipAddress,
    timestamp: new Date()
  });
};

// Static method to get user analytics
analyticsSchema.statics.getUserAnalytics = function(userId, timeframe = '30d', eventTypes = []) {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  const matchQuery = {
    userId: new mongoose.Types.ObjectId(userId),
    timestamp: { $gte: startDate }
  };
  
  if (eventTypes.length > 0) {
    matchQuery.eventType = { $in: eventTypes };
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        totalDuration: { $sum: '$eventData.duration' },
        totalPoints: { $sum: '$eventData.points' },
        avgDuration: { $avg: '$eventData.duration' },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get farming analytics
analyticsSchema.statics.getFarmingAnalytics = function(userId, timeframe = '30d') {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        eventType: { $in: ['farming_start', 'farming_complete', 'farming_abandon'] },
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        totalDuration: { $sum: '$eventData.duration' },
        totalPoints: { $sum: '$eventData.points' },
        avgDuration: { $avg: '$eventData.duration' }
      }
    }
  ]);
};

// Static method to get product analytics
analyticsSchema.statics.getProductAnalytics = function(userId, timeframe = '30d') {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        eventType: { $in: ['product_view', 'product_add_to_cart', 'farming_complete'] },
        'eventData.productId': { $exists: true },
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          productId: '$eventData.productId',
          productTitle: '$eventData.productTitle',
          category: '$eventData.category'
        },
        views: {
          $sum: { $cond: [{ $eq: ['$eventType', 'product_view'] }, 1, 0] }
        },
        addToCarts: {
          $sum: { $cond: [{ $eq: ['$eventType', 'product_add_to_cart'] }, 1, 0] }
        },
        farmingSessions: {
          $sum: { $cond: [{ $eq: ['$eventType', 'farming_complete'] }, 1, 0] }
        },
        totalPoints: { $sum: '$eventData.points' },
        avgPrice: { $avg: '$eventData.productPrice' }
      }
    },
    {
      $sort: { totalPoints: -1 }
    }
  ]);
};

// Static method to get group analytics
analyticsSchema.statics.getGroupAnalytics = function(groupId, timeframe = '30d') {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  return this.aggregate([
    {
      $match: {
        'eventData.groupId': new mongoose.Types.ObjectId(groupId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        totalPoints: { $sum: '$eventData.points' }
      }
    },
    {
      $project: {
        _id: 1,
        count: 1,
        uniqueUserCount: { $size: '$uniqueUsers' },
        totalPoints: 1
      }
    }
  ]);
};

module.exports = mongoose.model('Analytics', analyticsSchema);
