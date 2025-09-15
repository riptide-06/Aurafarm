# AuraFarm Backend Setup Guide

## Quick Setup for Testing

### 1. Install MongoDB (if not already installed)

**On macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**On Windows:**
Download and install from: https://www.mongodb.com/try/download/community

**On Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### 2. Configure Environment Variables

Edit the `.env` file in the backend directory:

```env
# Update these with your actual Shopify credentials
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_ACCESS_TOKEN=your_shopify_access_token
```

### 3. Start the Backend

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

### 4. Test the Backend

```bash
node test-backend.js
```

This will run basic tests to ensure everything is working.

## Testing with Real Users

### 1. Update Your Frontend

In your React app, update the API calls to point to your backend:

```javascript
// Example API call from your frontend
const response = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    shopifyCustomerId: customerId,
    email: customerEmail,
    firstName: customerFirstName,
    lastName: customerLastName
  })
});
```

### 2. Test User Registration

When a user opens your Mini app:

1. The app should call `/api/auth/register` with their Shopify customer data
2. The backend will create a user account and return a JWT token
3. Store the token and use it for all subsequent API calls

### 3. Test Group Creation

1. User creates a group via `/api/groups` endpoint
2. Backend returns a group code (6-character code)
3. Share this code with your friend

### 4. Test Group Joining

1. Your friend uses the group code to join via `/api/groups/join/{code}`
2. Both users are now in the same group
3. Real-time updates will work via WebSocket

### 5. Test Aura Farming

1. Users farm aura points via `/api/aura/farming`
2. Points are saved to their account
3. Group stats are updated in real-time

## API Endpoints for Testing

### Authentication
- `POST /api/auth/register` - Register/login user
- `GET /api/auth/me` - Get user profile

### Groups
- `POST /api/groups` - Create group
- `POST /api/groups/join/{code}` - Join group
- `GET /api/groups/my-groups` - Get user's groups

### Aura System
- `POST /api/aura/farming` - Add farming points
- `POST /api/aura/gift` - Send aura gift
- `GET /api/aura/history` - Get transaction history

## Real-time Features

The backend supports WebSocket connections for real-time updates:

- Group member joins/leaves
- Aura gifts sent/received
- Group activity updates

Connect to: `ws://localhost:3001`

## Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify all environment variables are set
- Check if port 3001 is available

### Database connection issues
- Ensure MongoDB is running
- Check MONGODB_URI in .env file
- Try connecting to MongoDB directly

### API calls failing
- Check CORS settings in server.js
- Verify JWT token is being sent
- Check network tab in browser dev tools

## Ready for Testing!

Once everything is set up:

1. ✅ Backend running on port 3001
2. ✅ MongoDB connected
3. ✅ Environment variables configured
4. ✅ Frontend updated to use backend APIs

You and your friend can now:
- Create accounts with your Shopify customer data
- Create and join groups together
- Farm aura points in real-time
- Send aura gifts to each other
- See live updates of group activities

Happy testing! 🎉
