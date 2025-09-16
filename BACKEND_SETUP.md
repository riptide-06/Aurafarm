# AuraFarm Backend Setup Guide

This guide will help you set up the backend for multi-user and persistent groups in AuraFarm.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/aurafarm
MONGODB_TEST_URI=mongodb://localhost:27017/aurafarm_test

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Installation Steps

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Create a database named `aurafarm`
   - Update the `MONGODB_URI` in your `.env` file

3. **Start the Backend Server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register/Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Groups
- `POST /api/groups` - Create a new group
- `GET /api/groups/my-groups` - Get user's groups
- `GET /api/groups/public` - Get public groups
- `GET /api/groups/code/:code` - Get group by code
- `POST /api/groups/join/:code` - Join group by code
- `POST /api/groups/:groupId/leave` - Leave group
- `GET /api/groups/:groupId` - Get group details
- `PUT /api/groups/:groupId` - Update group settings
- `DELETE /api/groups/:groupId` - Delete group
- `GET /api/groups/:groupId/members` - Get group members
- `POST /api/groups/:groupId/points` - Add points to group

## Real-time Features

The backend uses Socket.IO for real-time communication:

- **Group Events**: `group-created`, `group-updated`, `group-deleted`
- **Member Events**: `member-joined`, `member-left`, `member-removed`
- **Activity Events**: `points-added`, `member-role-updated`

## Database Models

### User Model
- Shopify customer integration
- Aura points and leveling system
- Group memberships
- Preferences and achievements

### Group Model
- Unique 6-character codes
- Member management with roles
- Group settings and statistics
- Challenge system

### Analytics Model
- Event tracking
- User behavior analytics
- Performance metrics

## Testing

Run the test suite:
```bash
npm test
```

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a production MongoDB instance
3. Set up proper JWT secrets
4. Configure rate limiting for your needs
5. Set up monitoring and logging

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the connection string in `.env`
   - Verify network access if using Atlas

2. **JWT Token Issues**
   - Ensure `JWT_SECRET` is set
   - Check token expiration settings

3. **CORS Issues**
   - Verify `FRONTEND_URL` matches your frontend
   - Check CORS configuration in `server.js`

### Logs

The server logs important events and errors. Check the console output for debugging information.

## Security Considerations

- Use strong JWT secrets in production
- Implement proper rate limiting
- Validate all input data
- Use HTTPS in production
- Regularly update dependencies

## Support

For issues or questions, check the error logs and ensure all environment variables are properly set.
