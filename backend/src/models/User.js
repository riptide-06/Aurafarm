const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  shopifyCustomerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  auraPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAuraEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  farmingStats: {
    totalFarms: { type: Number, default: 0 },
    successfulFarms: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 }, // in minutes
    favoriteProduct: { type: String, default: null },
    lastFarmDate: { type: Date, default: null }
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    publicProfile: { type: Boolean, default: true },
    allowInvites: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' }
  },
  achievements: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now },
    points: { type: Number, default: 0 }
  }],
  groups: [{
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  }],
  lastActive: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name (fallback to full name)
userSchema.virtual('displayNameOrFull').get(function() {
  return this.displayName || this.fullName;
});

// Index for efficient queries
userSchema.index({ shopifyCustomerId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'groups.groupId': 1 });
userSchema.index({ lastActive: -1 });

// Pre-save middleware to update lastActive
userSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastActive = new Date();
  }
  next();
});

// Method to add aura points
userSchema.methods.addAuraPoints = function(points, reason = 'farming') {
  this.auraPoints += points;
  this.totalAuraEarned += points;
  
  // Simple leveling system (100 points per level)
  const newLevel = Math.floor(this.totalAuraEarned / 100) + 1;
  if (newLevel > this.level) {
    this.level = newLevel;
    this.experience = this.totalAuraEarned % 100;
  } else {
    this.experience = this.totalAuraEarned % 100;
  }
  
  return this.save();
};

// Method to spend aura points
userSchema.methods.spendAuraPoints = function(points, reason = 'purchase') {
  if (this.auraPoints < points) {
    throw new Error('Insufficient aura points');
  }
  this.auraPoints -= points;
  return this.save();
};

// Method to add achievement
userSchema.methods.addAchievement = function(achievement) {
  const existingAchievement = this.achievements.find(
    a => a.id === achievement.id
  );
  
  if (!existingAchievement) {
    this.achievements.push(achievement);
    if (achievement.points > 0) {
      this.addAuraPoints(achievement.points, 'achievement');
    }
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to join a group
userSchema.methods.joinGroup = function(groupId, role = 'member') {
  const existingGroup = this.groups.find(
    g => g.groupId.toString() === groupId.toString()
  );
  
  if (!existingGroup) {
    this.groups.push({
      groupId,
      role,
      joinedAt: new Date(),
      isActive: true
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to leave a group
userSchema.methods.leaveGroup = function(groupId) {
  this.groups = this.groups.filter(
    g => g.groupId.toString() !== groupId.toString()
  );
  return this.save();
};

// Static method to find by Shopify customer ID
userSchema.statics.findByShopifyId = function(shopifyCustomerId) {
  return this.findOne({ shopifyCustomerId, isActive: true });
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ totalAuraEarned: -1 })
    .limit(limit)
    .select('displayNameOrFull avatar totalAuraEarned level achievements')
    .lean();
};

module.exports = mongoose.model('User', userSchema);
