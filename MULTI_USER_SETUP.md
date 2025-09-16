# AuraFarm Multi-User Setup

This document explains how to set up AuraFarm with multi-user and persistent groups support.

## Overview

The updated AuraFarm now supports:
- **Multi-user groups**: Multiple users can join the same farm from different devices
- **Persistent groups**: Groups are stored in a database and persist across sessions
- **Real-time synchronization**: Changes are synchronized across all connected users
- **User authentication**: Secure user management with JWT tokens
- **Backend API**: RESTful API with Socket.IO for real-time features

## Architecture

```
Frontend (React) ←→ Backend API (Express + Socket.IO) ←→ MongoDB
     ↓                        ↓                           ↓
- User Interface         - Authentication            - User Data
- Group Management       - Group Management          - Group Data  
- Real-time Updates      - Real-time Events         - Analytics
```

## Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your MongoDB connection and JWT secret

# Start the backend server
npm run dev
```

### 2. Frontend Setup

```bash
# Navigate to root directory
cd ..

# Install dependencies (if not already done)
npm install

# Start the frontend
npm run dev
```

### 3. Test the Setup

```bash
# Run the API test script
cd backend
node test-api.js
```

## Features

### Multi-User Groups
- Users can create groups with unique 6-character codes
- Multiple users can join the same group from different devices
- Group membership is persistent and synchronized across devices
- Real-time updates when members join/leave

### User Authentication
- Secure JWT-based authentication
- User profiles with aura points and achievements
- Session management with refresh tokens

### Real-time Synchronization
- Socket.IO integration for real-time updates
- Live member count updates
- Real-time points and activity tracking
- Instant notifications for group events

### Backend API
- RESTful API endpoints for all operations
- Comprehensive error handling
- Rate limiting and security measures
- Analytics and event tracking

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register/Login user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh JWT token

### Groups
- `POST /api/groups` - Create a new group
- `GET /api/groups/my-groups` - Get user's groups
- `POST /api/groups/join/:code` - Join group by code
- `GET /api/groups/:groupId` - Get group details
- `POST /api/groups/:groupId/points` - Add points to group

## Real-time Events

The system emits real-time events for:
- `member-joined` - When a user joins a group
- `member-left` - When a user leaves a group
- `points-added` - When points are added to a group
- `group-updated` - When group settings change

## Configuration

### Environment Variables

**Backend (.env)**
```env
MONGODB_URI=mongodb://localhost:27017/aurafarm
JWT_SECRET=your-secret-key
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Frontend (config.ts)**
```typescript
export const config = {
  apiUrl: 'http://localhost:3001/api',
  socketUrl: 'http://localhost:3001',
  // ... other settings
};
```

## Database Schema

### Users
- Shopify customer integration
- Aura points and leveling
- Group memberships
- Preferences and achievements

### Groups
- Unique codes and settings
- Member management with roles
- Statistics and challenges
- Real-time activity tracking

## Development

### Adding New Features

1. **Backend**: Add new routes in `src/routes/`
2. **Frontend**: Update API service in `src/services/api.ts`
3. **Real-time**: Add Socket.IO events in `src/server.js`

### Testing

```bash
# Backend tests
cd backend
npm test

# API integration tests
node test-api.js
```

## Deployment

### Backend
1. Set up MongoDB (local or Atlas)
2. Configure environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend
1. Update API URLs in `config.ts`
2. Build and deploy to your hosting platform

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check if backend is running on port 3001
   - Verify MongoDB connection
   - Check CORS settings

2. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Clear browser storage if needed

3. **Real-time Issues**
   - Check Socket.IO connection
   - Verify WebSocket support
   - Check network connectivity

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your backend environment.

## Security Considerations

- Use strong JWT secrets in production
- Implement proper rate limiting
- Validate all input data
- Use HTTPS in production
- Regularly update dependencies

## Support

For issues or questions:
1. Check the error logs
2. Verify environment configuration
3. Test with the provided test script
4. Review the API documentation

## Next Steps

- Add more group management features
- Implement group challenges
- Add user profiles and achievements
- Enhance real-time features
- Add analytics dashboard
