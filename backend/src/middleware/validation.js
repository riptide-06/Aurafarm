const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('shopifyCustomerId')
    .notEmpty()
    .withMessage('Shopify customer ID is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Display name must be less than 50 characters'),
  handleValidationErrors
];

const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Display name must be less than 50 characters'),
  body('preferences.notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications preference must be a boolean'),
  body('preferences.publicProfile')
    .optional()
    .isBoolean()
    .withMessage('Public profile preference must be a boolean'),
  body('preferences.allowInvites')
    .optional()
    .isBoolean()
    .withMessage('Allow invites preference must be a boolean'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be light, dark, or auto'),
  handleValidationErrors
];

// Group validation rules
const validateGroupCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Group name must be between 1 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  body('settings.isPublic')
    .optional()
    .isBoolean()
    .withMessage('Public setting must be a boolean'),
  body('settings.allowInvites')
    .optional()
    .isBoolean()
    .withMessage('Allow invites setting must be a boolean'),
  body('settings.maxMembers')
    .optional()
    .isInt({ min: 2, max: 50 })
    .withMessage('Max members must be between 2 and 50'),
  body('settings.requireApproval')
    .optional()
    .isBoolean()
    .withMessage('Require approval setting must be a boolean'),
  handleValidationErrors
];

const validateGroupUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Group name must be between 1 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  body('settings.isPublic')
    .optional()
    .isBoolean()
    .withMessage('Public setting must be a boolean'),
  body('settings.allowInvites')
    .optional()
    .isBoolean()
    .withMessage('Allow invites setting must be a boolean'),
  body('settings.maxMembers')
    .optional()
    .isInt({ min: 2, max: 50 })
    .withMessage('Max members must be between 2 and 50'),
  body('settings.requireApproval')
    .optional()
    .isBoolean()
    .withMessage('Require approval setting must be a boolean'),
  handleValidationErrors
];

// Aura transaction validation rules
const validateAuraGift = [
  body('toUserId')
    .isMongoId()
    .withMessage('Valid recipient user ID is required'),
  body('points')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Points must be between 1 and 1000'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Message must be less than 200 characters'),
  body('groupId')
    .optional()
    .isMongoId()
    .withMessage('Valid group ID is required'),
  handleValidationErrors
];

const validateAuraFarming = [
  body('points')
    .isInt({ min: 1, max: 100 })
    .withMessage('Points must be between 1 and 100'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  body('productId')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Product ID must not be empty'),
  body('farmingSessionId')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Farming session ID must not be empty'),
  handleValidationErrors
];

// Challenge validation rules
const validateChallengeCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Challenge name must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('targetPoints')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Target points must be between 1 and 10000'),
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('endDate')
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('rewards')
    .optional()
    .isArray()
    .withMessage('Rewards must be an array'),
  body('rewards.*.type')
    .optional()
    .isIn(['aura', 'badge', 'item'])
    .withMessage('Reward type must be aura, badge, or item'),
  body('rewards.*.value')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Reward value must be a positive integer'),
  body('rewards.*.description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reward description must be less than 200 characters'),
  handleValidationErrors
];

// Parameter validation
const validateMongoId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Valid ${paramName} is required`),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

const validateTimeframe = [
  query('timeframe')
    .optional()
    .isIn(['7d', '30d', '90d'])
    .withMessage('Timeframe must be 7d, 30d, or 90d'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserUpdate,
  validateGroupCreation,
  validateGroupUpdate,
  validateAuraGift,
  validateAuraFarming,
  validateChallengeCreation,
  validateMongoId,
  validatePagination,
  validateTimeframe
};
