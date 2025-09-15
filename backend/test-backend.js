// Simple test script to verify backend is working
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testBackend() {
  console.log('🧪 Testing AuraFarm Backend...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Test user registration (mock data)
    console.log('2. Testing user registration...');
    const mockUserData = {
      shopifyCustomerId: 'test_customer_123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User'
    };

    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, mockUserData);
      console.log('✅ User registration successful');
      console.log('   User ID:', registerResponse.data.data.user.id);
      console.log('   Token received:', !!registerResponse.data.data.token);
      console.log('');

      const token = registerResponse.data.data.token;

      // Test 3: Test authenticated endpoint
      console.log('3. Testing authenticated endpoint...');
      const profileResponse = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Profile fetch successful');
      console.log('   User:', profileResponse.data.data.user.displayName);
      console.log('   Aura Points:', profileResponse.data.data.user.auraPoints);
      console.log('');

      // Test 4: Test group creation
      console.log('4. Testing group creation...');
      const groupData = {
        name: 'Test Group',
        description: 'A test group for testing',
        settings: {
          isPublic: true,
          allowInvites: true,
          maxMembers: 10
        }
      };

      const groupResponse = await axios.post(`${API_BASE}/groups`, groupData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Group creation successful');
      console.log('   Group ID:', groupResponse.data.data.group.id);
      console.log('   Group Code:', groupResponse.data.data.group.code);
      console.log('');

      // Test 5: Test aura farming
      console.log('5. Testing aura farming...');
      const farmingData = {
        points: 25,
        duration: 120,
        productId: 'test_product_123',
        farmingSessionId: 'session_123'
      };

      const farmingResponse = await axios.post(`${API_BASE}/aura/farming`, farmingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Aura farming successful');
      console.log('   Points earned:', farmingResponse.data.data.pointsEarned);
      console.log('   New balance:', farmingResponse.data.data.newBalance);
      console.log('   New level:', farmingResponse.data.data.newLevel);
      console.log('');

      console.log('🎉 All tests passed! Backend is ready for testing.');
      console.log('');
      console.log('📋 Next steps:');
      console.log('1. Update your .env file with real Shopify credentials');
      console.log('2. Start your React frontend');
      console.log('3. Test with real Shopify customer accounts');
      console.log('4. Create groups and invite your friend!');

    } catch (error) {
      if (error.response) {
        console.log('❌ Test failed:', error.response.data.message);
        console.log('   Status:', error.response.status);
      } else {
        console.log('❌ Test failed:', error.message);
      }
    }

  } catch (error) {
    console.log('❌ Backend not running or not accessible');
    console.log('   Make sure to start the backend with: npm run dev');
    console.log('   Error:', error.message);
  }
}

// Run the test
testBackend();
