// Test script for AI prompt engineering
// Run with: node test-ai-prompts.js

const { AICoachService } = require('./lib/openai');

// Test data
const testProfile = {
  id: 'test-user-1',
  age: 28,
  gender: 'female',
  height: 165,
  weight: 60,
  bodyType: 'mesomorph',
  culture: 'Indian',
  goals: ['lose weight', 'build muscle', 'improve energy'],
  createdAt: new Date(),
  updatedAt: new Date()
};

const testLogs = [
  {
    id: 'log-1',
    habitId: 'hydration',
    value: 6,
    unit: 'glasses',
    notes: 'Morning routine',
    method: 'text',
    timestamp: new Date(),
    metadata: {}
  },
  {
    id: 'log-2',
    habitId: 'nutrition',
    value: 1800,
    unit: 'calories',
    notes: 'Balanced meals',
    method: 'text',
    timestamp: new Date(),
    metadata: {
      foodItems: ['dal', 'rice', 'vegetables', 'yogurt']
    }
  },
  {
    id: 'log-3',
    habitId: 'exercise',
    value: 30,
    unit: 'minutes',
    notes: 'Morning yoga',
    method: 'voice',
    timestamp: new Date(),
    metadata: {}
  }
];

const testContext = {
  timeOfDay: 'morning',
  mood: 'energetic',
  weather: 'sunny',
  mealTime: 'breakfast'
};

async function testPrompts() {
  console.log('🧪 Testing AI Prompt Engineering\n');
  console.log('=' * 50);
  
  const aiCoach = AICoachService.getInstance();
  
  try {
    // Test 1: Daily Motivation
    console.log('\n1️⃣ Testing Daily Motivation Prompt');
    console.log('-' * 30);
    const motivation = await aiCoach.generateDailyMotivation(
      testProfile, 
      testLogs, 
      testLogs, 
      { timeOfDay: 'morning', mood: 'energetic' }
    );
    console.log('✅ Motivation:', motivation);
    
    // Test 2: Nutrition Suggestions
    console.log('\n2️⃣ Testing Nutrition Suggestions Prompt');
    console.log('-' * 30);
    const nutritionSuggestions = await aiCoach.generateNutritionSuggestions(
      testProfile, 
      testLogs.filter(log => log.habitId === 'nutrition'),
      { mealTime: 'breakfast' }
    );
    console.log('✅ Nutrition Suggestions:', nutritionSuggestions);
    
    // Test 3: Chat Response
    console.log('\n3️⃣ Testing Chat Response Prompt');
    console.log('-' * 30);
    const chatResponse = await aiCoach.generateCoachingResponse(
      testProfile, 
      testLogs, 
      'I want to improve my energy levels throughout the day. What should I focus on?',
      { previousMessages: ['Hello!', 'How can I help you today?'] }
    );
    console.log('✅ Chat Response:', chatResponse);
    
    // Test 4: Comprehensive Insights
    console.log('\n4️⃣ Testing Comprehensive Insights Prompt');
    console.log('-' * 30);
    const insights = await aiCoach.generateComprehensiveInsights(testProfile, testLogs);
    console.log('✅ Insights:', JSON.stringify(insights, null, 2));
    
    // Test 5: Cultural Insights
    console.log('\n5️⃣ Testing Cultural Insights Prompt');
    console.log('-' * 30);
    const culturalInsights = await aiCoach.generateCulturalInsights(testProfile, testLogs);
    console.log('✅ Cultural Insights:', culturalInsights);
    
    // Test 6: Health Tips
    console.log('\n6️⃣ Testing Health Tips Prompt');
    console.log('-' * 30);
    const healthTips = await aiCoach.generateHealthTips(testProfile, testLogs, testContext);
    console.log('✅ Health Tips:', healthTips);
    
    // Test 7: Main API Endpoint
    console.log('\n7️⃣ Testing Main API Endpoint');
    console.log('-' * 30);
    const coachingResponse = await aiCoach.getCoachingInsights({
      profile: testProfile,
      todayLogs: testLogs,
      history: testLogs,
      context: testContext
    });
    console.log('✅ Coaching Response:', JSON.stringify(coachingResponse, null, 2));
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Test different cultural contexts
async function testCulturalContexts() {
  console.log('\n🌍 Testing Cultural Contexts\n');
  console.log('=' * 50);
  
  const aiCoach = AICoachService.getInstance();
  const cultures = ['Indian', 'Chinese', 'Mexican', 'American', 'European'];
  
  for (const culture of cultures) {
    console.log(`\n🇺🇸 Testing ${culture} Context`);
    console.log('-' * 20);
    
    const profile = { ...testProfile, culture };
    
    try {
      const motivation = await aiCoach.generateDailyMotivation(profile, testLogs, testLogs);
      console.log(`✅ ${culture} Motivation:`, motivation);
      
      const culturalInsights = await aiCoach.generateCulturalInsights(profile, testLogs);
      console.log(`✅ ${culture} Cultural Insights:`, culturalInsights);
      
    } catch (error) {
      console.error(`❌ ${culture} test failed:`, error.message);
    }
  }
}

// Test different body types
async function testBodyTypes() {
  console.log('\n💪 Testing Body Types\n');
  console.log('=' * 50);
  
  const aiCoach = AICoachService.getInstance();
  const bodyTypes = ['ectomorph', 'mesomorph', 'endomorph'];
  
  for (const bodyType of bodyTypes) {
    console.log(`\n🏃 Testing ${bodyType} Body Type`);
    console.log('-' * 20);
    
    const profile = { ...testProfile, bodyType };
    
    try {
      const nutritionSuggestions = await aiCoach.generateNutritionSuggestions(profile, testLogs);
      console.log(`✅ ${bodyType} Nutrition:`, nutritionSuggestions);
      
      const healthTips = await aiCoach.generateHealthTips(profile, testLogs);
      console.log(`✅ ${bodyType} Health Tips:`, healthTips);
      
    } catch (error) {
      console.error(`❌ ${bodyType} test failed:`, error.message);
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting AI Prompt Engineering Tests');
  console.log('=' * 50);
  
  await testPrompts();
  await testCulturalContexts();
  await testBodyTypes();
  
  console.log('\n✨ All AI prompt tests completed!');
  console.log('=' * 50);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testPrompts,
  testCulturalContexts,
  testBodyTypes,
  runAllTests
};
