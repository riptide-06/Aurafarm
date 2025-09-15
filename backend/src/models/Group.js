const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    length: 6
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    contributedPoints: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now }
  }],
  settings: {
    isPublic: { type: Boolean, default: false },
    allowInvites: { type: Boolean, default: true },
    maxMembers: { type: Number, default: 20, min: 2, max: 50 },
    requireApproval: { type: Boolean, default: false }
  },
  stats: {
    totalPointsEarned: { type: Number, default: 0 },
    totalFarms: { type: Number, default: 0 },
    averagePointsPerMember: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now }
  },
  challenges: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    targetPoints: { type: Number, required: true },
    currentPoints: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    rewards: [{
      type: { type: String, enum: ['aura', 'badge', 'item'], required: true },
      value: { type: Number, required: true },
      description: { type: String, required: true }
    }],
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.filter(member => member.isActive).length;
});

// Virtual for active challenges
groupSchema.virtual('activeChallenges').get(function() {
  return this.challenges.filter(challenge => 
    challenge.isActive && 
    new Date() >= challenge.startDate && 
    new Date() <= challenge.endDate
  );
});

// Indexes for efficient queries
groupSchema.index({ code: 1 });
groupSchema.index({ owner: 1 });
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ isActive: 1, 'settings.isPublic': 1 });
groupSchema.index({ 'stats.lastActivity': -1 });

// Pre-save middleware to generate unique code
groupSchema.pre('save', async function(next) {
  if (this.isNew && !this.code) {
    this.code = await this.generateUniqueCode();
  }
  next();
});

// Method to generate unique group code
groupSchema.methods.generateUniqueCode = async function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    const existingGroup = await this.constructor.findOne({ code });
    if (!existingGroup) {
      isUnique = true;
    }
  }
  
  return code;
};

// Method to add member
groupSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(
    member => member.userId.toString() === userId.toString()
  );
  
  if (!existingMember && this.members.length < this.settings.maxMembers) {
    this.members.push({
      userId,
      role,
      joinedAt: new Date(),
      isActive: true,
      contributedPoints: 0,
      lastActivity: new Date()
    });
    
    this.stats.lastActivity = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to remove member
groupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(
    member => member.userId.toString() !== userId.toString()
  );
  
  this.stats.lastActivity = new Date();
  return this.save();
};

// Method to update member role
groupSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(
    member => member.userId.toString() === userId.toString()
  );
  
  if (member) {
    member.role = newRole;
    this.stats.lastActivity = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to add points to group
groupSchema.methods.addPoints = function(userId, points) {
  const member = this.members.find(
    member => member.userId.toString() === userId.toString()
  );
  
  if (member) {
    member.contributedPoints += points;
    member.lastActivity = new Date();
    this.stats.totalPointsEarned += points;
    this.stats.averagePointsPerMember = this.stats.totalPointsEarned / this.memberCount;
    this.stats.lastActivity = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to create challenge
groupSchema.methods.createChallenge = function(challengeData) {
  const challenge = {
    id: new mongoose.Types.ObjectId().toString(),
    ...challengeData,
    currentPoints: 0,
    isActive: true,
    participants: []
  };
  
  this.challenges.push(challenge);
  this.stats.lastActivity = new Date();
  return this.save();
};

// Method to update challenge progress
groupSchema.methods.updateChallengeProgress = function(challengeId, userId, points) {
  const challenge = this.challenges.find(c => c.id === challengeId);
  
  if (challenge && challenge.isActive) {
    challenge.currentPoints += points;
    
    if (!challenge.participants.includes(userId)) {
      challenge.participants.push(userId);
    }
    
    this.stats.lastActivity = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Static method to find by code
groupSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase(), isActive: true });
};

// Static method to get public groups
groupSchema.statics.getPublicGroups = function(limit = 20) {
  return this.find({ 
    isActive: true, 
    'settings.isPublic': true 
  })
  .sort({ 'stats.lastActivity': -1 })
  .limit(limit)
  .populate('owner', 'displayNameOrFull avatar level')
  .select('name description code memberCount stats')
  .lean();
};

module.exports = mongoose.model('Group', groupSchema);
