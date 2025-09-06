# 🏃‍♂️ FitAura CLI Health Bot Guide

A command-line health assistant that provides personalized recommendations and tracks your wellness journey.

## 🚀 Quick Start

### Prerequisites
- Backend server must be running on `http://localhost:3001`
- Node.js v20+ installed

### Start the Bot
```bash
node simple-health-bot.js
```

## 📋 Available Commands

### Core Commands
- **`profile`** - View or create your health profile
- **`log <text>`** - Log a health activity (e.g., "log Did 30 minutes of cardio")
- **`insights`** - Get AI-powered personalized health insights
- **`stats`** - View your activity statistics for the last 30 days

### Quick Help Commands
- **`recommend`** - Get 3 random health recommendations
- **`tips`** - Get a random health tip
- **`help`** - Show all available commands
- **`quit`** or **`exit`** - Exit the bot

## 🎯 Example Usage Session

```
FitAura> profile
⚠️  No profile found. Let's create one!

🆕 Creating Your Health Profile:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Enter your name: John Doe
Enter your age: 28
Enter your gender (male/female/other): male
Enter your height (cm): 175
Enter your weight (kg): 70
Enter your body type (lean/athletic/rounded): athletic
Enter your culture (asian/indian/western/african/european/mediterranean): western
Enter your activity level (sedentary/light/moderate/vigorous): moderate
Enter your goals (comma-separated): lose weight, build muscle, improve health
✅ Profile created successfully!

FitAura> log Did 45 minutes of strength training at the gym
✅ Activity logged successfully!
📝 "Did 45 minutes of strength training at the gym"

FitAura> insights
🔍 Your Health Insights (Last 7 Days):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Summary:
Great job on logging your strength training session! Consistency is key...

🍽️  Dinner Recommendation:
For your dinner, I recommend grilled chicken with quinoa and roasted vegetables...

FitAura> recommend
💡 Health Recommendations:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💧 Drink at least 8 glasses of water daily
🚶‍♂️ Take a 10-minute walk after meals
🥗 Include colorful vegetables in every meal

FitAura> stats
📈 Your Activity Stats (Last 30 Days):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Activities: 1
Text Logs: 1
Voice Logs: 0
Photo Logs: 0

Recent Activity:
2025-09-06: 1 activities

FitAura> tips
💡 Health Tip of the Moment:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌅 Start your day with a glass of water

FitAura> quit
👋 Stay healthy! Goodbye!
```

## 🎨 Features

### ✅ **Profile Management**
- Interactive profile creation
- Supports new validation options:
  - Body types: `lean`, `athletic`, `rounded`
  - Cultures: `asian`, `indian`, `western`, `african`, `european`, `mediterranean`
  - Activity levels: `sedentary`, `light`, `moderate`, `vigorous`

### ✅ **Activity Logging**
- Simple text-based logging
- Automatic timestamping
- Persistent storage via backend API

### ✅ **AI-Powered Insights**
- Personalized health summaries
- Culturally-appropriate dinner recommendations
- Goal-specific suggestions
- 7-day activity analysis

### ✅ **Health Recommendations**
- Random health tips
- Evidence-based recommendations
- Quick motivation boosts

### ✅ **Statistics Tracking**
- 30-day activity overview
- Breakdown by input method
- Daily activity counts

## 🛠️ Technical Details

### Built with Node.js Built-ins
- **No external dependencies** - uses only Node.js built-in modules
- **HTTP client** - custom implementation using `http`/`https` modules
- **Colors** - ANSI escape codes for terminal styling
- **Interactive CLI** - readline interface

### API Integration
- Connects to FitAura backend REST API
- Handles profile CRUD operations
- Manages activity logging
- Retrieves AI-generated insights

### Error Handling
- Backend connectivity checks
- Graceful error messages
- Input validation
- Network timeout handling

## 🚨 Troubleshooting

### Backend Not Running
```
❌ Backend server not running. Please start the server first:
   cd backend && node server.js
```

### Profile Not Found
```
⚠️  No profile found. Please create a profile first using "profile" command.
```

### Invalid Commands
```
❌ Unknown command: "invalid". Type "help" for available commands.
```

## 🔮 Future Enhancements

- Voice input support
- Photo logging capabilities
- Meal planning integration
- Exercise routine suggestions
- Progress visualization
- Reminder notifications
- Multi-user support
- Data export features

---

**Stay healthy with FitAura CLI Bot! 🏃‍♀️💪**