#!/usr/bin/env node

const readline = require('readline');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const DEFAULT_USER_ID = 'user123';

// Simple colors for terminal output (ANSI codes)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

// Simple HTTP client
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// CLI Health Bot Class
class SimpleHealthBot {
  constructor() {
    this.userId = DEFAULT_USER_ID;
    this.userProfile = null;
    this.isRunning = false;
  }

  // Color helper methods
  colorize(text, color) {
    return `${colors[color] || ''}${text}${colors.reset}`;
  }

  // Display welcome message
  displayWelcome() {
    console.log(this.colorize('\n🏃‍♂️ FitAura Health Assistant CLI Bot 🏃‍♀️', 'cyan'));
    console.log(this.colorize('━'.repeat(50), 'cyan'));
    console.log(this.colorize('Your personal health companion in the terminal!', 'white'));
    console.log(this.colorize('Type "help" for available commands or "quit" to exit.\n', 'gray'));
  }

  // Display help menu
  displayHelp() {
    console.log(this.colorize('\n📋 Available Commands:', 'yellow'));
    console.log(this.colorize('━'.repeat(30), 'yellow'));
    console.log(this.colorize('🔹 profile       - View/create your health profile', 'white'));
    console.log(this.colorize('🔹 log <text>    - Log a health activity', 'white'));
    console.log(this.colorize('🔹 insights      - Get personalized health insights', 'white'));
    console.log(this.colorize('🔹 recommend     - Get health recommendations', 'white'));
    console.log(this.colorize('🔹 dinner        - Get AI-powered dinner recommendation', 'white'));
    console.log(this.colorize('🔹 stats         - View your activity statistics', 'white'));
    console.log(this.colorize('🔹 tips          - Get quick health tips', 'white'));
    console.log(this.colorize('🔹 help          - Show this help menu', 'white'));
    console.log(this.colorize('🔹 quit/exit     - Exit the bot\n', 'white'));
  }

  // Get or create user profile
  async handleProfile() {
    try {
      const response = await makeRequest(`${API_BASE_URL}/profile`);
      const profiles = response.data.data || [];
      this.userProfile = profiles.find(p => p.user_id === this.userId);

      if (this.userProfile) {
        console.log(this.colorize('\n👤 Your Health Profile:', 'green'));
        console.log(this.colorize('━'.repeat(25), 'green'));
        console.log(this.colorize(`Name: ${this.userProfile.name || 'CLI User'}`, 'white'));
        console.log(this.colorize(`Age: ${this.userProfile.age}`, 'white'));
        console.log(this.colorize(`Gender: ${this.userProfile.gender}`, 'white'));
        console.log(this.colorize(`Height: ${this.userProfile.height}cm`, 'white'));
        console.log(this.colorize(`Weight: ${this.userProfile.weight}kg`, 'white'));
        console.log(this.colorize(`Body Type: ${this.userProfile.bodyType}`, 'white'));
        console.log(this.colorize(`Culture: ${this.userProfile.culture}`, 'white'));
        console.log(this.colorize(`Activity Level: ${this.userProfile.activity_level}`, 'white'));
        console.log(this.colorize(`Goals: ${this.userProfile.goals.join(', ')}\n`, 'white'));
      } else {
        console.log(this.colorize('⚠️  No profile found. Let\'s create one!\n', 'yellow'));
        await this.createProfile();
      }
    } catch (error) {
      console.log(this.colorize('❌ Error fetching profile: ' + error.message, 'red'));
    }
  }

  // Create new profile interactively
  async createProfile() {
    console.log(this.colorize('🆕 Creating Your Health Profile:', 'blue'));
    console.log(this.colorize('━'.repeat(35), 'blue'));

    const profile = {
      user_id: this.userId,
      name: await this.askQuestion('Enter your name: '),
      age: parseInt(await this.askQuestion('Enter your age: ')),
      gender: await this.askQuestion('Enter your gender (male/female/other): '),
      height: parseInt(await this.askQuestion('Enter your height (cm): ')),
      weight: parseInt(await this.askQuestion('Enter your weight (kg): ')),
      bodyType: await this.askQuestion('Enter your body type (lean/athletic/rounded): '),
      culture: await this.askQuestion('Enter your culture (asian/indian/western/african/european/mediterranean): '),
      activity_level: await this.askQuestion('Enter your activity level (sedentary/light/moderate/vigorous): '),
      goals: (await this.askQuestion('Enter your goals (comma-separated): ')).split(',').map(g => g.trim())
    };

    try {
      const response = await makeRequest(`${API_BASE_URL}/profile`, {
        method: 'POST',
        body: profile
      });
      
      if (response.status === 200 || response.status === 201) {
        this.userProfile = profile;
        console.log(this.colorize('✅ Profile created successfully!\n', 'green'));
      } else {
        console.log(this.colorize('❌ Error creating profile: ' + (response.data.message || 'Unknown error'), 'red'));
      }
    } catch (error) {
      console.log(this.colorize('❌ Error creating profile: ' + error.message, 'red'));
    }
  }

  // Log health activity
  async handleLog(text) {
    if (!text) {
      console.log(this.colorize('⚠️  Please provide text to log. Example: log "Did 30 minutes of cardio"', 'yellow'));
      return;
    }

    try {
      const logEntry = {
        user_id: this.userId,
        timestamp: new Date().toISOString(),
        input_method: 'text',
        content: text
      };

      const response = await makeRequest(`${API_BASE_URL}/logging`, {
        method: 'POST',
        body: logEntry
      });

      if (response.status === 200) {
        console.log(this.colorize('✅ Activity logged successfully!', 'green'));
        console.log(this.colorize(`📝 "${text}"\n`, 'gray'));
      } else {
        console.log(this.colorize('❌ Error logging activity: ' + (response.data.message || 'Unknown error'), 'red'));
      }
    } catch (error) {
      console.log(this.colorize('❌ Error logging activity: ' + error.message, 'red'));
    }
  }

  // Get personalized insights
  async handleInsights() {
    try {
      const response = await makeRequest(`${API_BASE_URL}/insights?userId=${this.userId}&days=7&includeRecommendations=true`);
      
      if (response.status === 200) {
        const insights = response.data.data;

        console.log(this.colorize('\n🔍 Your Health Insights (Last 7 Days):', 'magenta'));
        console.log(this.colorize('━'.repeat(40), 'magenta'));
        
        if (insights.summary) {
          console.log(this.colorize('📊 Summary:', 'white'));
          console.log(this.colorize(insights.summary + '\n', 'white'));
        }

        if (insights.dinnerRecommendation) {
          console.log(this.colorize('🍽️  Dinner Recommendation:', 'green'));
          console.log(this.colorize(insights.dinnerRecommendation + '\n', 'green'));
        }

        if (insights.suggestions && insights.suggestions.length > 0) {
          console.log(this.colorize('💡 Suggestions:', 'blue'));
          insights.suggestions.forEach(suggestion => {
            console.log(this.colorize(`• ${suggestion}`, 'blue'));
          });
          console.log();
        }
      } else if (response.status === 404) {
        console.log(this.colorize('⚠️  No profile found. Please create a profile first using "profile" command.', 'yellow'));
      } else {
        console.log(this.colorize('❌ Error getting insights: ' + (response.data.message || 'Unknown error'), 'red'));
      }
    } catch (error) {
      console.log(this.colorize('❌ Error getting insights: ' + error.message, 'red'));
    }
  }

  // Get AI-powered health recommendations (excluding dinner)
  async handleRecommend() {
    try {
      const response = await makeRequest(`${API_BASE_URL}/insights?userId=${this.userId}&days=7&includeRecommendations=true`);
      
      if (response.status === 200) {
        const insights = response.data.data;

        console.log(this.colorize('\n💡 AI-Powered Health Recommendations:', 'cyan'));
        console.log(this.colorize('━'.repeat(40), 'cyan'));
        
        // Show general suggestions (not dinner-specific)
        if (insights.suggestions && insights.suggestions.length > 0) {
          insights.suggestions.forEach(suggestion => {
            console.log(this.colorize(`• ${suggestion}`, 'white'));
          });
        }

        // Show key insights if available
        if (insights.keyInsights && insights.keyInsights.length > 0) {
          console.log(this.colorize('\n🔍 Key Insights:', 'blue'));
          insights.keyInsights.forEach(insight => {
            console.log(this.colorize(`• ${insight}`, 'blue'));
          });
        }

        // Show next steps if available
        if (insights.nextSteps && insights.nextSteps.length > 0) {
          console.log(this.colorize('\n📋 Next Steps:', 'green'));
          insights.nextSteps.forEach(step => {
            console.log(this.colorize(`• ${step}`, 'green'));
          });
        }

        console.log();
      } else if (response.status === 404) {
        console.log(this.colorize('⚠️  No profile found. Please create a profile first using "profile" command.', 'yellow'));
      } else {
        console.log(this.colorize('❌ Error getting recommendations: ' + (response.data.message || 'Unknown error'), 'red'));
      }
    } catch (error) {
      console.log(this.colorize('❌ Error getting recommendations: ' + error.message, 'red'));
      
      // Fallback to hardcoded recommendations if API fails
      console.log(this.colorize('\n💡 Fallback Health Recommendations:', 'cyan'));
      console.log(this.colorize('━'.repeat(35), 'cyan'));
      const fallbackRecs = [
        "💧 Drink at least 8 glasses of water daily",
        "🚶‍♂️ Take a 10-minute walk after meals",
        "🥗 Include colorful vegetables in every meal"
      ];
      fallbackRecs.forEach(rec => {
        console.log(this.colorize(rec, 'white'));
      });
      console.log();
    }
  }

  // Get activity statistics
  async handleStats() {
    try {
      const response = await makeRequest(`${API_BASE_URL}/logging/stats/${this.userId}?days=30`);
      
      if (response.status === 200) {
        const stats = response.data.data;

        console.log(this.colorize('\n📈 Your Activity Stats (Last 30 Days):', 'yellow'));
        console.log(this.colorize('━'.repeat(40), 'yellow'));
        console.log(this.colorize(`Total Activities: ${stats.total_logs}`, 'white'));
        console.log(this.colorize(`Text Logs: ${stats.by_input_method.text}`, 'white'));
        console.log(this.colorize(`Voice Logs: ${stats.by_input_method.voice}`, 'white'));
        console.log(this.colorize(`Photo Logs: ${stats.by_input_method.photo}\n`, 'white'));

        if (Object.keys(stats.by_date).length > 0) {
          console.log(this.colorize('Recent Activity:', 'white'));
          Object.entries(stats.by_date)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 5)
            .forEach(([date, count]) => {
              console.log(this.colorize(`${date}: ${count} activities`, 'gray'));
            });
          console.log();
        }
      } else {
        console.log(this.colorize('❌ Error getting stats: ' + (response.data.message || 'Unknown error'), 'red'));
      }
    } catch (error) {
      console.log(this.colorize('❌ Error getting stats: ' + error.message, 'red'));
    }
  }

  // Get quick health tips
  handleTips() {
    const tips = [
      "🌅 Start your day with a glass of water",
      "🥬 Eat the rainbow - colorful fruits and vegetables",
      "🚶‍♀️ Take the stairs instead of the elevator",
      "🍽️ Practice mindful eating - chew slowly",
      "📵 Create a phone-free bedroom for better sleep",
      "🧘‍♂️ Try the 4-7-8 breathing technique for stress",
      "🥤 Replace one sugary drink with water daily",
      "💪 Do desk exercises during work breaks",
      "🌿 Add herbs and spices instead of extra salt",
      "😊 Practice gratitude - write down 3 good things daily"
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    console.log(this.colorize('\n💡 Health Tip of the Moment:', 'green'));
    console.log(this.colorize('━'.repeat(35), 'green'));
    console.log(this.colorize(randomTip + '\n', 'white'));
  }

  // Get AI-powered dinner recommendation
  async handleDinner() {
    try {
      const response = await makeRequest(`${API_BASE_URL}/insights?userId=${this.userId}&days=7&includeRecommendations=true`);
      
      if (response.status === 200) {
        const insights = response.data.data;

        console.log(this.colorize('\n🍽️  AI-Powered Dinner Recommendation:', 'green'));
        console.log(this.colorize('━'.repeat(45), 'green'));
        
        if (insights.dinnerRecommendation) {
          console.log(this.colorize(insights.dinnerRecommendation, 'white'));
        } else {
          console.log(this.colorize('No specific dinner recommendation available at this time.', 'gray'));
        }
        
        console.log();
      } else if (response.status === 404) {
        console.log(this.colorize('⚠️  No profile found. Please create a profile first using "profile" command.', 'yellow'));
      } else {
        console.log(this.colorize('❌ Error getting dinner recommendation: ' + (response.data.message || 'Unknown error'), 'red'));
      }
    } catch (error) {
      console.log(this.colorize('❌ Error getting dinner recommendation: ' + error.message, 'red'));
      
      // Fallback dinner suggestion
      console.log(this.colorize('\n🍽️  Fallback Dinner Suggestion:', 'green'));
      console.log(this.colorize('━'.repeat(35), 'green'));
      console.log(this.colorize('Try a balanced meal with lean protein, complex carbohydrates, and plenty of vegetables.', 'white'));
      console.log();
    }
  }

  // Helper method to ask questions
  askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(this.colorize(question, 'cyan'), (answer) => {
        resolve(answer.trim());
      });
    });
  }

  // Process user commands
  async processCommand(input) {
    const [command, ...args] = input.trim().toLowerCase().split(' ');
    const fullText = args.join(' ');

    switch (command) {
      case 'help':
        this.displayHelp();
        break;
      case 'profile':
        await this.handleProfile();
        break;
      case 'log':
        await this.handleLog(fullText);
        break;
      case 'insights':
        await this.handleInsights();
        break;
      case 'recommend':
        await this.handleRecommend();
        break;
      case 'dinner':
        await this.handleDinner();
        break;
      case 'stats':
        await this.handleStats();
        break;
      case 'tips':
        this.handleTips();
        break;
      case 'quit':
      case 'exit':
        console.log(this.colorize('👋 Stay healthy! Goodbye!', 'green'));
        this.isRunning = false;
        rl.close();
        break;
      default:
        console.log(this.colorize(`❌ Unknown command: "${command}". Type "help" for available commands.`, 'red'));
    }
  }

  // Main bot loop
  async start() {
    this.displayWelcome();
    this.isRunning = true;

    // Check if backend is running
    try {
      await makeRequest(`${API_BASE_URL}/profile`);
    } catch (error) {
      console.log(this.colorize('❌ Backend server not running. Please start the server first:', 'red'));
      console.log(this.colorize('   cd backend && node server.js\n', 'yellow'));
      rl.close();
      return;
    }

    // Handle the interactive loop
    const promptUser = async () => {
      if (!this.isRunning) return;
      
      try {
        const input = await this.askQuestion(this.colorize('FitAura> ', 'blue'));
        if (input.trim()) {
          await this.processCommand(input);
        }
        // Continue the loop if still running
        if (this.isRunning) {
          setImmediate(promptUser);
        }
      } catch (error) {
        if (error.code !== 'ERR_USE_AFTER_CLOSE') {
          console.log(this.colorize('❌ Error: ' + error.message, 'red'));
        }
        this.isRunning = false;
        rl.close();
      }
    };

    promptUser();
  }
}

// Start the bot
const bot = new SimpleHealthBot();
bot.start().catch(console.error);