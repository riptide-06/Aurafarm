const mongoose = require('mongoose');

const auraTransactionSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 1
  },
  type: {
    type: String,
    enum: ['gift', 'reward', 'challenge', 'group_contribution', 'farming_bonus'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  challengeId: {
    type: String,
    default: null
  },
  metadata: {
    farmingSessionId: { type: String, default: null },
    productId: { type: String, default: null },
    achievementId: { type: String, default: null },
    message: { type: String, default: null }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
auraTransactionSchema.index({ fromUser: 1, createdAt: -1 });
auraTransactionSchema.index({ toUser: 1, createdAt: -1 });
auraTransactionSchema.index({ groupId: 1, createdAt: -1 });
auraTransactionSchema.index({ type: 1, status: 1 });
auraTransactionSchema.index({ createdAt: -1 });

// Virtual for transaction display name
auraTransactionSchema.virtual('displayType').get(function() {
  const typeMap = {
    'gift': 'Gift',
    'reward': 'Reward',
    'challenge': 'Challenge Bonus',
    'group_contribution': 'Group Contribution',
    'farming_bonus': 'Farming Bonus'
  };
  return typeMap[this.type] || this.type;
});

// Static method to create gift transaction
auraTransactionSchema.statics.createGift = function(fromUserId, toUserId, points, message = null, groupId = null) {
  return this.create({
    fromUser: fromUserId,
    toUser: toUserId,
    points,
    type: 'gift',
    reason: 'User gift',
    groupId,
    metadata: { message }
  });
};

// Static method to create farming bonus transaction
auraTransactionSchema.statics.createFarmingBonus = function(userId, points, farmingSessionId, productId = null) {
  return this.create({
    fromUser: userId, // Self-transaction
    toUser: userId,
    points,
    type: 'farming_bonus',
    reason: 'Aura farming session',
    metadata: { farmingSessionId, productId }
  });
};

// Static method to create group contribution transaction
auraTransactionSchema.statics.createGroupContribution = function(userId, groupId, points, challengeId = null) {
  return this.create({
    fromUser: userId,
    toUser: userId, // Self-transaction for group contribution
    points,
    type: 'group_contribution',
    reason: 'Group contribution',
    groupId,
    challengeId
  });
};

// Static method to get user transaction history
auraTransactionSchema.statics.getUserHistory = function(userId, limit = 50, offset = 0) {
  return this.find({
    $or: [{ fromUser: userId }, { toUser: userId }]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(offset)
  .populate('fromUser', 'displayNameOrFull avatar')
  .populate('toUser', 'displayNameOrFull avatar')
  .populate('groupId', 'name code')
  .lean();
};

// Static method to get group transaction history
auraTransactionSchema.statics.getGroupHistory = function(groupId, limit = 50, offset = 0) {
  return this.find({ groupId })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(offset)
  .populate('fromUser', 'displayNameOrFull avatar')
  .populate('toUser', 'displayNameOrFull avatar')
  .lean();
};

// Static method to get transaction statistics
auraTransactionSchema.statics.getStats = function(userId, timeframe = '30d') {
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
        $or: [{ fromUser: new mongoose.Types.ObjectId(userId) }, { toUser: new mongoose.Types.ObjectId(userId) }],
        createdAt: { $gte: startDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$type',
        totalPoints: { $sum: '$points' },
        count: { $sum: 1 },
        avgPoints: { $avg: '$points' }
      }
    }
  ]);
};

module.exports = mongoose.model('AuraTransaction', auraTransactionSchema);
