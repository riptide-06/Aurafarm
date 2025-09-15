const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and attach to request
    const user = await User.findById(decoded.userId).select('-__v');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Middleware to verify Shopify customer token
const authenticateShopifyCustomer = async (req, res, next) => {
  try {
    const shopifyCustomerId = req.headers['x-shopify-customer-id'];
    
    if (!shopifyCustomerId) {
      return res.status(401).json({
        success: false,
        message: 'Shopify customer ID required'
      });
    }

    // Find or create user based on Shopify customer ID
    let user = await User.findByShopifyId(shopifyCustomerId);
    
    if (!user) {
      // This would typically be handled by the auth route
      // For now, return error if user doesn't exist
      return res.status(404).json({
        success: false,
        message: 'User not found. Please complete registration first.'
      });
    }

    req.user = user;
    req.shopifyCustomerId = shopifyCustomerId;
    next();
  } catch (error) {
    console.error('Shopify auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-__v');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Middleware to check if user is group member
const requireGroupMembership = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const Group = require('../models/Group');
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const isMember = group.members.some(
      member => member.userId.toString() === userId.toString() && member.isActive
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of this group.'
      });
    }

    req.group = group;
    next();
  } catch (error) {
    console.error('Group membership middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

// Middleware to check if user is group admin or owner
const requireGroupAdmin = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const Group = require('../models/Group');
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const member = group.members.find(
      member => member.userId.toString() === userId.toString() && member.isActive
    );

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    req.group = group;
    req.memberRole = member.role;
    next();
  } catch (error) {
    console.error('Group admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

module.exports = {
  authenticateToken,
  authenticateShopifyCustomer,
  optionalAuth,
  requireGroupMembership,
  requireGroupAdmin,
  generateToken,
  generateRefreshToken
};
