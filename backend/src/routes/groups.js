const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const { authenticateToken, requireGroupMembership, requireGroupAdmin } = require('../middleware/auth');
const { validateGroupCreation, validateGroupUpdate, validateMongoId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Create a new group
router.post('/', authenticateToken, validateGroupCreation, async (req, res) => {
  try {
    const { name, description, settings } = req.body;
    const ownerId = req.user._id;

    // Check if user can create more groups (limit to 5 groups per user)
    const userGroups = await Group.countDocuments({
      owner: ownerId,
      isActive: true
    });

    if (userGroups >= 5) {
      return res.status(400).json({
        success: false,
        message: 'You can only create up to 5 groups'
      });
    }

    const group = new Group({
      name,
      description,
      owner: ownerId,
      settings: settings || {}
    });

    await group.save();

    // Add owner as first member
    await group.addMember(ownerId, 'owner');

    // Update user's groups
    await req.user.joinGroup(group._id, 'owner');

    // Track group creation event
    await Analytics.trackEvent(
      req.user._id,
      req.headers['x-session-id'] || 'unknown',
      'group_create',
      { 
        groupId: group._id,
        groupName: group.name,
        metadata: { settings }
      },
      req.headers['user-agent'],
      req.ip
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('group-created', {
      groupId: group._id,
      name: group.name,
      owner: req.user.displayNameOrFull
    });

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: {
        group: {
          id: group._id,
          name: group.name,
          description: group.description,
          code: group.code,
          owner: {
            id: req.user._id,
            name: req.user.displayNameOrFull,
            avatar: req.user.avatar
          },
          memberCount: group.memberCount,
          settings: group.settings,
          createdAt: group.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group'
    });
  }
});

// Get user's groups
router.get('/my-groups', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const groups = await Group.find({
      'members.userId': req.user._id,
      'members.isActive': true,
      isActive: true
    })
    .populate('owner', 'displayNameOrFull avatar')
    .populate('members.userId', 'displayNameOrFull avatar level')
    .sort({ 'stats.lastActivity': -1 })
    .skip(skip)
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        groups,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: groups.length
        }
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

// Get public groups
router.get('/public', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const groups = await Group.getPublicGroups(parseInt(limit));

    res.json({
      success: true,
      data: {
        groups,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: groups.length
        }
      }
    });

  } catch (error) {
    console.error('Get public groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get public groups'
    });
  }
});

// Join group by code
router.post('/join/:code', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const userId = req.user._id;

    const group = await Group.findByCode(code);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or invalid code'
      });
    }

    // Check if user is already a member
    const existingMember = group.members.find(
      member => member.userId.toString() === userId.toString()
    );

    if (existingMember) {
      if (existingMember.isActive) {
        return res.status(400).json({
          success: false,
          message: 'You are already a member of this group'
        });
      } else {
        // Reactivate membership
        existingMember.isActive = true;
        existingMember.joinedAt = new Date();
        await group.save();
      }
    } else {
      // Check if group is full
      if (group.memberCount >= group.settings.maxMembers) {
        return res.status(400).json({
          success: false,
          message: 'Group is full'
        });
      }

      // Add user to group
      await group.addMember(userId, 'member');
    }

    // Update user's groups
    await req.user.joinGroup(group._id, 'member');

    // Track group join event
    await Analytics.trackEvent(
      req.user._id,
      req.headers['x-session-id'] || 'unknown',
      'group_join',
      { 
        groupId: group._id,
        groupName: group.name,
        groupCode: group.code
      },
      req.headers['user-agent'],
      req.ip
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`group-${group._id}`).emit('member-joined', {
      userId: req.user._id,
      userName: req.user.displayNameOrFull,
      userAvatar: req.user.avatar
    });

    res.json({
      success: true,
      message: 'Successfully joined group',
      data: {
        group: {
          id: group._id,
          name: group.name,
          description: group.description,
          code: group.code,
          memberCount: group.memberCount
        }
      }
    });

  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join group'
    });
  }
});

// Leave group
router.post('/:groupId/leave', authenticateToken, ...validateMongoId('groupId'), async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a member
    const member = group.members.find(
      member => member.userId.toString() === userId.toString() && member.isActive
    );

    if (!member) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Check if user is the owner
    if (member.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Group owner cannot leave. Transfer ownership or delete the group.'
      });
    }

    // Remove user from group
    await group.removeMember(userId);
    await req.user.leaveGroup(groupId);

    // Track group leave event
    await Analytics.trackEvent(
      req.user._id,
      req.headers['x-session-id'] || 'unknown',
      'group_leave',
      { 
        groupId: group._id,
        groupName: group.name
      },
      req.headers['user-agent'],
      req.ip
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`group-${groupId}`).emit('member-left', {
      userId: req.user._id,
      userName: req.user.displayNameOrFull
    });

    res.json({
      success: true,
      message: 'Successfully left group'
    });

  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave group'
    });
  }
});

// Get group details
router.get('/:groupId', authenticateToken, ...validateMongoId('groupId'), requireGroupMembership, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('owner', 'displayNameOrFull avatar level')
      .populate('members.userId', 'displayNameOrFull avatar level totalAuraEarned');

    res.json({
      success: true,
      data: {
        group: {
          id: group._id,
          name: group.name,
          description: group.description,
          code: group.code,
          owner: group.owner,
          members: group.members.filter(member => member.isActive),
          settings: group.settings,
          stats: group.stats,
          challenges: group.activeChallenges,
          createdAt: group.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group details'
    });
  }
});

// Update group settings
router.put('/:groupId', authenticateToken, ...validateMongoId('groupId'), requireGroupAdmin, validateGroupUpdate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const updates = req.body;

    const group = await Group.findByIdAndUpdate(
      groupId,
      updates,
      { new: true, runValidators: true }
    ).populate('owner', 'displayNameOrFull avatar');

    // Track group update event
    await Analytics.trackEvent(
      req.user._id,
      req.headers['x-session-id'] || 'unknown',
      'page_view',
      { 
        page: 'group_update',
        groupId: group._id,
        metadata: { updatedFields: Object.keys(updates) }
      },
      req.headers['user-agent'],
      req.ip
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`group-${groupId}`).emit('group-updated', {
      groupId: group._id,
      updates: Object.keys(updates)
    });

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: { group }
    });

  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update group'
    });
  }
});

// Delete group
router.delete('/:groupId', authenticateToken, ...validateMongoId('groupId'), async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is the owner
    if (group.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the group owner can delete the group'
      });
    }

    // Soft delete the group
    group.isActive = false;
    await group.save();

    // Remove group from all members
    await User.updateMany(
      { 'groups.groupId': groupId },
      { $pull: { groups: { groupId } } }
    );

    // Track group deletion event
    await Analytics.trackEvent(
      req.user._id,
      req.headers['x-session-id'] || 'unknown',
      'page_view',
      { 
        page: 'group_delete',
        groupId: group._id,
        groupName: group.name
      },
      req.headers['user-agent'],
      req.ip
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`group-${groupId}`).emit('group-deleted', {
      groupId: group._id,
      groupName: group.name
    });

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });

  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete group'
    });
  }
});

// Get group members
router.get('/:groupId/members', authenticateToken, ...validateMongoId('groupId'), requireGroupMembership, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members.userId', 'displayNameOrFull avatar level totalAuraEarned')
      .select('members');

    const activeMembers = group.members.filter(member => member.isActive);

    res.json({
      success: true,
      data: {
        members: activeMembers
      }
    });

  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group members'
    });
  }
});

// Get group by code (for joining)
router.get('/code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const group = await Group.findByCode(code);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Return basic group info (no sensitive data)
    res.json({
      success: true,
      data: {
        group: {
          id: group._id,
          name: group.name,
          description: group.description,
          code: group.code,
          memberCount: group.memberCount,
          maxMembers: group.settings.maxMembers,
          isPublic: group.settings.isPublic,
          createdAt: group.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get group by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group'
    });
  }
});

// Update member role (admin only)
router.put('/:groupId/members/:userId/role', authenticateToken, ...validateMongoId('groupId'), requireGroupAdmin, async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin or member.'
      });
    }

    const group = await Group.findById(groupId);
    const member = group.members.find(
      member => member.userId.toString() === userId.toString() && member.isActive
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Cannot change owner role
    if (member.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change owner role'
      });
    }

    await group.updateMemberRole(userId, role);

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`group-${groupId}`).emit('member-role-updated', {
      userId,
      newRole: role,
      updatedBy: req.user._id
    });

    res.json({
      success: true,
      message: 'Member role updated successfully'
    });

  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member role'
    });
  }
});

// Remove member from group (admin only)
router.delete('/:groupId/members/:userId', authenticateToken, ...validateMongoId('groupId'), requireGroupAdmin, async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const adminId = req.user._id;

    const group = await Group.findById(groupId);
    const member = group.members.find(
      member => member.userId.toString() === userId.toString() && member.isActive
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Cannot remove owner
    if (member.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group owner'
      });
    }

    // Cannot remove yourself
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        message: 'Use the leave endpoint to remove yourself'
      });
    }

    await group.removeMember(userId);
    
    // Remove group from user's groups
    const user = await User.findById(userId);
    if (user) {
      await user.leaveGroup(groupId);
    }

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`group-${groupId}`).emit('member-removed', {
      userId,
      removedBy: adminId
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member'
    });
  }
});

// Add points to group (for aura farming)
router.post('/:groupId/points', authenticateToken, ...validateMongoId('groupId'), requireGroupMembership, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { points, reason = 'farming' } = req.body;
    const userId = req.user._id;

    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid points amount required'
      });
    }

    const group = await Group.findById(groupId);
    await group.addPoints(userId, points);

    // Track points addition
    await Analytics.trackEvent(
      userId,
      req.headers['x-session-id'] || 'unknown',
      'group_points_added',
      { 
        groupId: group._id,
        points,
        reason
      },
      req.headers['user-agent'],
      req.ip
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`group-${groupId}`).emit('points-added', {
      userId,
      points,
      reason,
      totalPoints: group.stats.totalPointsEarned
    });

    res.json({
      success: true,
      message: 'Points added successfully',
      data: {
        pointsAdded: points,
        totalPoints: group.stats.totalPointsEarned
      }
    });

  } catch (error) {
    console.error('Add points error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add points'
    });
  }
});

module.exports = router;
