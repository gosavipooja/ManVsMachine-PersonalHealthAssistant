#!/usr/bin/env node

const readline = require('readline');
const axios = require('axios');
const chalk = require('chalk');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const DEFAULT_USER_ID = 'user123';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// CLI Health Bot Class
class HealthBot {
  constructor() {
    this.userId = DEFAULT_USER_ID;
    this.userProfile = null;
    this.isRunning = false;
  }

  // Display welcome message
  displayWelcome() {
    console.log(chalk.cyan.bold('\n🏃‍♂️ FitAura Health Assistant CLI Bot 🏃‍♀️'));
    console.log(chalk.cyan('━'.repeat(50)));
    console.log(chalk.white('Your personal health companion in the terminal!'));
    console.log(chalk.gray('Type "help" for available commands or "quit" to exit.\n'));
  }

  // Display help menu
  displayHelp() {
    console.log(chalk.yellow.bold('\n📋 Available Commands:'));
    console.log(chalk.yellow('━'.repeat(30)));
    console.log(chalk.white('🔹 profile       - View/create your health profile'));
    console.log(chalk.white('🔹 log <text>    - Log a health activity'));
    console.log(chalk.white('🔹 insights      - Get personalized health insights'));
    console.log(chalk.white('🔹 recommend     - Get health recommendations'));
    console.log(chalk.white('🔹 stats         - View your activity statistics'));
    console.log(chalk.white('🔹 tips          - Get quick health tips'));
    console.log(chalk.white('🔹 help          - Show this help menu'));
    console.log(chalk.white('🔹 quit/exit     - Exit the bot\n'));
  }

  // Get or create user profile
  async handleProfile() {
    try {
      // Try to get existing profile
      const response = await axios.get(`${API_BASE_URL}/profile`);
      const profiles = response.data.data || [];
      this.userProfile = profiles.find(p => p.user_id === this.userId);

      if (this.userProfile) {
        console.log(chalk.green.bold('\n👤 Your Health Profile:'));
        console.log(chalk.green('━'.repeat(25)));
        console.log(chalk.white(`Name: ${this.userProfile.name || 'CLI User'}`));
        console.log(chalk.white(`Age: ${this.userProfile.age}`));
        console.log(chalk.white(`Gender: ${this.userProfile.gender}`));
        console.log(chalk.white(`Height: ${this.userProfile.height}cm`));
        console.log(chalk.white(`Weight: ${this.userProfile.weight}kg`));
        console.log(chalk.white(`Body Type: ${this.userProfile.bodyType}`));
        console.log(chalk.white(`Culture: ${this.userProfile.culture}`));
        console.log(chalk.white(`Activity Level: ${this.userProfile.activity_level}`));
        console.log(chalk.white(`Goals: ${this.userProfile.goals.join(', ')}\n`));
      } else {
        console.log(chalk.yellow('⚠️  No profile found. Let\'s create one!\n'));
        await this.createProfile();
      }
    } catch (error) {
      console.log(chalk.red('❌ Error fetching profile:', error.message));
    }
  }

  // Create new profile interactively
  async createProfile() {
    console.log(chalk.blue.bold('🆕 Creating Your Health Profile:'));
    console.log(chalk.blue('━'.repeat(35)));

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
      await axios.post(`${API_BASE_URL}/profile`, profile);
      this.userProfile = profile;
      console.log(chalk.green('✅ Profile created successfully!\n'));
    } catch (error) {
      console.log(chalk.red('❌ Error creating profile:', error.response?.data?.message || error.message));
    }
  }

  // Log health activity
  async handleLog(text) {
    if (!text) {
      console.log(chalk.yellow('⚠️  Please provide text to log. Example: log "Did 30 minutes of cardio"'));
      return;
    }

    try {
      const logEntry = {
        user_id: this.userId,
        timestamp: new Date().toISOString(),
        input_method: 'text',
        content: text
      };

      await axios.post(`${API_BASE_URL}/logging`, logEntry);
      console.log(chalk.green('✅ Activity logged successfully!'));
      console.log(chalk.gray(`📝 "${text}"\n`));
    } catch (error) {
      console.log(chalk.red('❌ Error logging activity:', error.response?.data?.message || error.message));
    }
  }

  // Get personalized insights
  async handleInsights() {
    try {
      const response = await axios.get(`${API_BASE_URL}/insights?userId=${this.userId}&days=7&includeRecommendations=true`);
      const insights = response.data.data;

      console.log(chalk.magenta.bold('\n🔍 Your Health Insights (Last 7 Days):'));
      console.log(chalk.magenta('━'.repeat(40)));
      
      if (insights.summary) {
        console.log(chalk.white.bold('📊 Summary:'));
        console.log(chalk.white(insights.summary + '\n'));
      }

      if (insights.dinnerRecommendation) {
        console.log(chalk.green.bold('🍽️  Dinner Recommendation:'));
        console.log(chalk.green(insights.dinnerRecommendation + '\n'));
      }

      if (insights.suggestions && insights.suggestions.length > 0) {
        console.log(chalk.blue.bold('💡 Suggestions:'));
        insights.suggestions.forEach(suggestion => {
          console.log(chalk.blue(`• ${suggestion}`));
        });
        console.log();
      }

    } catch (error) {
      if (error.response?.status === 404) {
        console.log(chalk.yellow('⚠️  No profile found. Please create a profile first using "profile" command.'));
      } else {
        console.log(chalk.red('❌ Error getting insights:', error.response?.data?.message || error.message));
      }
    }
  }

  // Get quick health recommendations
  async handleRecommend() {
    const recommendations = [
      "💧 Drink at least 8 glasses of water daily",
      "🚶‍♂️ Take a 10-minute walk after meals",
      "🥗 Include colorful vegetables in every meal",
      "😴 Aim for 7-9 hours of quality sleep",
      "🧘‍♀️ Practice 5 minutes of deep breathing daily",
      "🏃‍♂️ Do 30 minutes of moderate exercise most days",
      "📱 Take breaks from screens every hour",
      "🥜 Include healthy fats like nuts and avocados",
      "🍎 Choose whole fruits over fruit juices",
      "💪 Do strength training 2-3 times per week"
    ];

    console.log(chalk.cyan.bold('\n💡 Health Recommendations:'));
    console.log(chalk.cyan('━'.repeat(30)));
    
    // Show 3 random recommendations
    const randomRecs = recommendations.sort(() => 0.5 - Math.random()).slice(0, 3);
    randomRecs.forEach(rec => {
      console.log(chalk.white(rec));
    });
    console.log();
  }

  // Get activity statistics
  async handleStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/logging/stats/${this.userId}?days=30`);
      const stats = response.data.data;

      console.log(chalk.yellow.bold('\n📈 Your Activity Stats (Last 30 Days):'));
      console.log(chalk.yellow('━'.repeat(40)));
      console.log(chalk.white(`Total Activities: ${stats.total_logs}`));
      console.log(chalk.white(`Text Logs: ${stats.by_input_method.text}`));
      console.log(chalk.white(`Voice Logs: ${stats.by_input_method.voice}`));
      console.log(chalk.white(`Photo Logs: ${stats.by_input_method.photo}\n`));

      if (Object.keys(stats.by_date).length > 0) {
        console.log(chalk.white.bold('Recent Activity:'));
        Object.entries(stats.by_date)
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, 5)
          .forEach(([date, count]) => {
            console.log(chalk.gray(`${date}: ${count} activities`));
          });
        console.log();
      }

    } catch (error) {
      console.log(chalk.red('❌ Error getting stats:', error.response?.data?.message || error.message));
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
    console.log(chalk.green.bold('\n💡 Health Tip of the Moment:'));
    console.log(chalk.green('━'.repeat(35)));
    console.log(chalk.white(randomTip + '\n'));
  }

  // Helper method to ask questions
  askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(chalk.cyan(question), (answer) => {
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
      case 'stats':
        await this.handleStats();
        break;
      case 'tips':
        this.handleTips();
        break;
      case 'quit':
      case 'exit':
        console.log(chalk.green('👋 Stay healthy! Goodbye!'));
        this.isRunning = false;
        rl.close();
        break;
      default:
        console.log(chalk.red(`❌ Unknown command: "${command}". Type "help" for available commands.`));
    }
  }

  // Main bot loop
  async start() {
    this.displayWelcome();
    this.isRunning = true;

    // Check if backend is running
    try {
      await axios.get(`${API_BASE_URL}/profile`);
    } catch (error) {
      console.log(chalk.red('❌ Backend server not running. Please start the server first:'));
      console.log(chalk.yellow('   cd backend && node server.js\n'));
      rl.close();
      return;
    }

    while (this.isRunning) {
      const input = await this.askQuestion(chalk.blue.bold('FitAura> '));
      if (input.trim()) {
        await this.processCommand(input);
      }
    }
  }
}

// Start the bot
const bot = new HealthBot();
bot.start().catch(console.error);