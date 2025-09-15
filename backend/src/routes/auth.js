const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const { generateToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');
const { validateUserRegistration } = require('../middleware/validation');

const router = express.Router();

// Register/Login with Shopify customer data
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { shopifyCustomerId, email, firstName, lastName, displayName } = req.body;

    // Check if user already exists
    let user = await User.findByShopifyId(shopifyCustomerId);
    
    if (user) {
      // User exists, generate new token
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      
      // Update last active
      user.lastActive = new Date();
      await user.save();

      // Track login event
      await Analytics.trackEvent(
        user._id,
        req.headers['x-session-id'] || 'unknown',
        'page_view',
        { page: 'login' },
        req.headers['user-agent'],
        req.ip
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            avatar: user.avatar,
            auraPoints: user.auraPoints,
            level: user.level,
            experience: user.experience,
            preferences: user.preferences
          },
          token,
          refreshToken
        }
      });
    }

    // Create new user
    user = new User({
      shopifyCustomerId,
      email,
      firstName,
      lastName,
      displayName: displayName || `${firstName} ${lastName}`,
      auraPoints: 100, // Starting bonus
      level: 1,
      experience: 0
    });

    await user.save();

    // Add welcome achievement
    await user.addAchievement({
      id: 'welcome',
      name: 'Welcome to AuraFarm!',
      description: 'You\'ve joined the AuraFarm community',
      points: 50
    });

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Track registration event
    await Analytics.trackEvent(
      user._id,
      req.headers['x-session-id'] || 'unknown',
      'page_view',
      { page: 'registration' },
      req.headers['user-agent'],
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          avatar: user.avatar,
          auraPoints: user.auraPoints,
          level: user.level,
          experience: user.experience,
          preferences: user.preferences
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('groups.groupId', 'name code memberCount')
      .select('-__v');

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          avatar: user.avatar,
          auraPoints: user.auraPoints,
          totalAuraEarned: user.totalAuraEarned,
          level: user.level,
          experience: user.experience,
          farmingStats: user.farmingStats,
          preferences: user.preferences,
          achievements: user.achievements,
          groups: user.groups,
          lastActive: user.lastActive
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Track logout event
    await Analytics.trackEvent(
      req.user._id,
      req.headers['x-session-id'] || 'unknown',
      'page_view',
      { page: 'logout' },
      req.headers['user-agent'],
      req.ip
    );

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      userId: req.user._id,
      email: req.user.email
    }
  });
});

module.exports = router;
