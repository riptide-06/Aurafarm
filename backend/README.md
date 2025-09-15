# AuraFarm Backend API

A comprehensive backend API for the AuraFarm Mini app, built with Node.js, Express, and MongoDB. This backend provides persistent user data, social features, and Shopify integration for the React-based Mini app.

## Features

### 🔐 Authentication & User Management
- Shopify customer authentication integration
- JWT-based session management
- User profile management with preferences
- Achievement system with leveling

### 👥 Social Features
- Group creation and management
- Real-time group activities via WebSocket
- User invitation and joining system
- Group challenges and leaderboards

### ✨ Aura System
- Aura point farming and transactions
- Gift system for sharing points
- Transaction history and analytics
- Level-based progression system

### 📊 Analytics & Recommendations
- Comprehensive user behavior tracking
- Product recommendation engine
- Farming analytics and insights
- Personalized dashboard

### 🛍️ Shopify Integration
- Customer data synchronization
- Product catalog integration
- Order history analysis
- Personalized product recommendations

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Real-time**: Socket.IO
- **API Integration**: Shopify Admin API
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb://localhost:27017/aurafarm

   # Shopify Configuration
   SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
   SHOPIFY_API_KEY=your_shopify_api_key
   SHOPIFY_API_SECRET=your_shopify_api_secret
   SHOPIFY_ACCESS_TOKEN=your_shopify_access_token

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d

   # CORS Configuration
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start the server**:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register/Login with Shopify customer data
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify token validity

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/achievements` - Get user achievements
- `GET /api/users/groups` - Get user's groups
- `GET /api/users/leaderboard` - Get global leaderboard
- `GET /api/users/search` - Search users
- `GET /api/users/:userId` - Get public user profile

### Groups
- `POST /api/groups` - Create new group
- `GET /api/groups/my-groups` - Get user's groups
- `GET /api/groups/public` - Get public groups
- `POST /api/groups/join/:code` - Join group by code
- `POST /api/groups/:groupId/leave` - Leave group
- `GET /api/groups/:groupId` - Get group details
- `PUT /api/groups/:groupId` - Update group settings
- `DELETE /api/groups/:groupId` - Delete group
- `GET /api/groups/:groupId/members` - Get group members

### Aura System
- `POST /api/aura/farming` - Add aura points from farming
- `POST /api/aura/gift` - Send aura points as gift
- `GET /api/aura/history` - Get user's aura transaction history
- `GET /api/aura/group/:groupId/history` - Get group aura history
- `GET /api/aura/stats` - Get aura statistics
- `GET /api/aura/leaderboard` - Get aura leaderboard

### Analytics
- `POST /api/analytics/track` - Track user event
- `GET /api/analytics/dashboard` - Get analytics dashboard
- `GET /api/analytics/farming` - Get farming analytics
- `GET /api/analytics/products` - Get product analytics
- `GET /api/analytics/group/:groupId` - Get group analytics
- `GET /api/analytics/timeline` - Get user activity timeline
- `GET /api/analytics/recommendations` - Get personalized recommendations

## Database Models

### User
- Shopify customer integration
- Aura points and leveling system
- Farming statistics and achievements
- Group memberships and preferences

### Group
- Group management and settings
- Member roles and permissions
- Group challenges and statistics
- Real-time activity tracking

### AuraTransaction
- Point transactions and gifts
- Group contributions
- Farming bonuses
- Transaction history and analytics

### Analytics
- User behavior tracking
- Event logging and analysis
- Performance metrics
- Recommendation data

## Real-time Features

The backend uses Socket.IO for real-time communication:

- **Group Activities**: Member joins/leaves, group updates
- **Aura Gifts**: Real-time gift notifications
- **Group Challenges**: Live challenge progress updates
- **User Presence**: Online status and activity

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API request rate limiting
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Comprehensive request validation
- **Helmet Security**: HTTP security headers
- **Environment Variables**: Secure configuration management

## Development

### Project Structure
```
backend/
├── src/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # External service integrations
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── tests/               # Test files
├── package.json
└── README.md
```

### Testing
```bash
npm test
```

### Database Migration
```bash
npm run migrate
```

## Deployment

1. **Environment Variables**: Set all required environment variables
2. **Database**: Ensure MongoDB is accessible
3. **Shopify**: Configure Shopify API credentials
4. **CORS**: Update frontend URL for production
5. **SSL**: Use HTTPS in production
6. **Monitoring**: Set up logging and monitoring

## Integration with Frontend

The backend is designed to work seamlessly with the React frontend:

1. **Authentication**: JWT tokens for session management
2. **Real-time**: Socket.IO client integration
3. **API Calls**: RESTful API endpoints
4. **Error Handling**: Consistent error response format
5. **Data Sync**: Real-time data synchronization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
