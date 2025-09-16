const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Test configuration
const testUser = {
  shopifyCustomerId: `test_${Date.now()}`,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  displayName: 'Test User'
};

let authToken = null;
let userId = null;
let groupId = null;

async function testAPI() {
  console.log('🧪 Starting AuraFarm Backend API Tests\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: User Registration
    console.log('2. Testing user registration...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
    authToken = registerResponse.data.data.token;
    userId = registerResponse.data.data.user.id;
    console.log('✅ User registration successful');
    console.log('   User ID:', userId);
    console.log('   Token received:', !!authToken);
    console.log('');

    // Test 3: Get Current User
    console.log('3. Testing get current user...');
    const userResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get current user successful');
    console.log('   User:', userResponse.data.data.user.displayName);
    console.log('');

    // Test 4: Create Group
    console.log('4. Testing group creation...');
    const createGroupResponse = await axios.post(`${API_BASE}/groups`, {
      name: 'Test Farm',
      description: 'A test farm for API testing'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    groupId = createGroupResponse.data.data.group.id;
    console.log('✅ Group creation successful');
    console.log('   Group ID:', groupId);
    console.log('   Group Code:', createGroupResponse.data.data.group.code);
    console.log('');

    // Test 5: Get User Groups
    console.log('5. Testing get user groups...');
    const groupsResponse = await axios.get(`${API_BASE}/groups/my-groups`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get user groups successful');
    console.log('   Groups count:', groupsResponse.data.data.groups.length);
    console.log('');

    // Test 6: Get Group Details
    console.log('6. Testing get group details...');
    const groupDetailsResponse = await axios.get(`${API_BASE}/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get group details successful');
    console.log('   Group name:', groupDetailsResponse.data.data.group.name);
    console.log('   Members count:', groupDetailsResponse.data.data.group.members.length);
    console.log('');

    // Test 7: Add Points to Group
    console.log('7. Testing add points to group...');
    const pointsResponse = await axios.post(`${API_BASE}/groups/${groupId}/points`, {
      points: 10,
      reason: 'test farming'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Add points successful');
    console.log('   Points added:', pointsResponse.data.data.pointsAdded);
    console.log('   Total points:', pointsResponse.data.data.totalPoints);
    console.log('');

    // Test 8: Get Group by Code
    const groupCode = createGroupResponse.data.data.group.code;
    console.log('8. Testing get group by code...');
    const codeResponse = await axios.get(`${API_BASE}/groups/code/${groupCode}`);
    console.log('✅ Get group by code successful');
    console.log('   Group found:', codeResponse.data.data.group.name);
    console.log('');

    console.log('🎉 All API tests passed successfully!');
    console.log('');
    console.log('📊 Test Summary:');
    console.log('   - User registration and authentication ✅');
    console.log('   - Group creation and management ✅');
    console.log('   - Points system ✅');
    console.log('   - Group discovery by code ✅');
    console.log('');
    console.log('🚀 Your backend is ready for multi-user groups!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Make sure the backend server is running on port 3001');
    console.log('   2. Check that MongoDB is running and accessible');
    console.log('   3. Verify your .env file has the correct configuration');
    console.log('   4. Check the server logs for any error messages');
  }
}

// Run the tests
testAPI();
