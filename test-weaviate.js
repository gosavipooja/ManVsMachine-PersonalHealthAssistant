// Test Weaviate connection and basic operations
const weaviate = require('weaviate-ts-client');

async function testWeaviate() {
  console.log('🔍 Testing Weaviate connection...');
  
  try {
    // Create client with your cloud instance
    const client = weaviate.default.client({
      scheme: 'https',
      host: 'rmjkejpitgkweoun1qyhw.co.us-west3.gcp.weaviate.cloud',
      apiKey: new weaviate.default.ApiKey('VnBpMlFRcDJ0cWh3bG1Ea19EQkNpYkRYZjA3Y1Y3SUsveG9Rek1Vc0E4cjI2Q1Y5cFFoTEVPa1dsejJVPV92MjAw'),
    });

    console.log('✅ Client created successfully');

    // Test connection
    const meta = await client.misc.metaGetter().do();
    console.log('✅ Connection successful!');
    console.log('📊 Weaviate version:', meta.version);
    console.log('🌐 Hostname:', meta.hostname);

    // Test schema operations
    console.log('\n🔍 Testing schema operations...');
    
    // Check if HealthData class exists
    try {
      const schema = await client.schema.getter().do();
      console.log('📋 Current schema classes:', schema.classes?.map(c => c.class) || 'None');
    } catch (error) {
      console.log('⚠️  Schema check failed:', error.message);
    }

    // Test creating a simple class
    console.log('\n🏗️  Testing class creation...');
    try {
      const classDefinition = {
        class: 'TestHealthData',
        description: 'Test class for health data',
        properties: [
          {
            name: 'content',
            dataType: ['text'],
            description: 'Content of the health data'
          },
          {
            name: 'userId',
            dataType: ['string'],
            description: 'User ID'
          },
          {
            name: 'dataType',
            dataType: ['string'],
            description: 'Type of data (food, exercise, etc.)'
          }
        ]
      };

      await client.schema.classCreator().withClass(classDefinition).do();
      console.log('✅ Test class created successfully');

      // Test adding data
      console.log('\n📝 Testing data insertion...');
      const testData = {
        content: 'Test health data entry',
        userId: 'test-user-123',
        dataType: 'test'
      };

      const result = await client.data.creator()
        .withClassName('TestHealthData')
        .withProperties(testData)
        .do();

      console.log('✅ Data inserted successfully');
      console.log('🆔 Object ID:', result.id);

      // Test querying data
      console.log('\n🔍 Testing data query...');
      const queryResult = await client.graphql
        .get()
        .withClassName('TestHealthData')
        .withFields('content userId dataType')
        .withWhere({
          path: ['userId'],
          operator: 'Equal',
          valueText: 'test-user-123'
        })
        .do();

      console.log('✅ Query successful');
      console.log('📊 Found objects:', queryResult.data.Get.TestHealthData?.length || 0);

      // Clean up test class
      console.log('\n🧹 Cleaning up test class...');
      await client.schema.classDeleter().withClassName('TestHealthData').do();
      console.log('✅ Test class deleted');

    } catch (error) {
      console.log('❌ Class operations failed:', error.message);
    }

  } catch (error) {
    console.log('❌ Connection failed:', error.message);
  }
}

testWeaviate();
