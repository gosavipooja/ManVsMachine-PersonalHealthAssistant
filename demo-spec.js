// Demo script following DESIGN.md specifications exactly
// Run with: node demo-spec.js

const axios = require('axios');

const API_BASE = 'http://localhost:3001';

// Demo data following exact spec format
const demoProfile = {
  "id": "user123",
  "name": "Alex",
  "age": 28,
  "gender": "male",
  "height_cm": 175,
  "weight_kg": 70,
  "body_type": "mesomorph",
  "culture": "western"
};

const demoLogs = [
  {
    "id": "log789",
    "user_id": "user123",
    "timestamp": "2025-09-06T15:30:00Z",
    "type": "food",
    "input_method": "text",
    "content": "Pizza for lunch"
  },
  {
    "id": "log790",
    "user_id": "user123",
    "timestamp": "2025-09-06T16:00:00Z",
    "type": "exercise",
    "input_method": "voice",
    "content": "Jogged 20 minutes"
  },
  {
    "id": "log791",
    "user_id": "user123",
    "timestamp": "2025-09-06T17:00:00Z",
    "type": "hydration",
    "input_method": "text",
    "content": "Drank 2 glasses of water"
  }
];

async function runSpecDemo() {
  console.log('🎯 Running DESIGN.md Spec Demo');
  console.log('=' * 50);
  
  try {
    // Step 1: Create profile (age, gender)
    console.log('\n1️⃣ Creating profile...');
    const profileResponse = await axios.post(`${API_BASE}/profile`, demoProfile);
    console.log('✅ Profile created:', profileResponse.data);
    
    // Step 2: Log food via text ("Pizza for lunch")
    console.log('\n2️⃣ Logging food via text...');
    const foodLogResponse = await axios.post(`${API_BASE}/log`, demoLogs[0]);
    console.log('✅ Food logged:', foodLogResponse.data);
    
    // Step 3: Log exercise via voice
    console.log('\n3️⃣ Logging exercise via voice...');
    const exerciseLogResponse = await axios.post(`${API_BASE}/log`, demoLogs[1]);
    console.log('✅ Exercise logged:', exerciseLogResponse.data);
    
    // Step 4: Log hydration for completeness
    console.log('\n4️⃣ Logging hydration...');
    const hydrationLogResponse = await axios.post(`${API_BASE}/log`, demoLogs[2]);
    console.log('✅ Hydration logged:', hydrationLogResponse.data);
    
    // Step 5: Show dashboard progress (get history)
    console.log('\n5️⃣ Getting dashboard progress...');
    const historyResponse = await axios.get(`${API_BASE}/history?user_id=user123`);
    console.log('✅ History retrieved:', historyResponse.data);
    
    // Step 6: Show AI coach message
    console.log('\n6️⃣ Getting AI coach feedback...');
    const coachResponse = await axios.post(`${API_BASE}/coach`, {
      user_id: "user123",
      date: "2025-09-06"
    });
    console.log('✅ AI Coach Feedback:');
    console.log('   Motivation:', coachResponse.data.motivation_message);
    console.log('   Suggestions:', coachResponse.data.suggestions);
    
    console.log('\n🎉 Demo completed successfully!');
    console.log('=' * 50);
    
  } catch (error) {
    console.error('❌ Demo failed:', error.response?.data || error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Test individual endpoints
async function testEndpoints() {
  console.log('\n🧪 Testing Individual Endpoints');
  console.log('=' * 50);
  
  const endpoints = [
    { method: 'POST', path: '/profile', data: demoProfile },
    { method: 'POST', path: '/log', data: demoLogs[0] },
    { method: 'GET', path: '/history?user_id=user123' },
    { method: 'POST', path: '/coach', data: { user_id: 'user123' } }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing ${endpoint.method} ${endpoint.path}`);
      const response = await axios({
        method: endpoint.method,
        url: `${API_BASE}${endpoint.path}`,
        data: endpoint.data
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
    }
  }
}

// Test data validation
async function testDataValidation() {
  console.log('\n🔍 Testing Data Validation');
  console.log('=' * 50);
  
  const invalidRequests = [
    { endpoint: '/profile', data: { id: 'test' }, message: 'Missing required fields' },
    { endpoint: '/log', data: { id: 'test' }, message: 'Missing required fields' },
    { endpoint: '/coach', data: {}, message: 'Missing user_id' }
  ];
  
  for (const test of invalidRequests) {
    try {
      console.log(`\n🔍 Testing invalid request to ${test.endpoint}`);
      await axios.post(`${API_BASE}${test.endpoint}`, test.data);
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected:', error.response.data.message);
      } else {
        console.error('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting DESIGN.md Specification Demo');
  console.log('=' * 50);
  
  // Check if server is running
  try {
    await axios.get(`${API_BASE}/health`);
    console.log('✅ Server is running');
  } catch (error) {
    console.error('❌ Server is not running. Please start with: npm run backend');
    process.exit(1);
  }
  
  await runSpecDemo();
  await testEndpoints();
  await testDataValidation();
  
  console.log('\n✨ All tests completed!');
  console.log('=' * 50);
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runSpecDemo,
  testEndpoints,
  testDataValidation
};
