// Mock OpenAI service for local testing without API keys
class MockAICoach {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('Mock AI Coach initialized successfully');
  }

  async generateMotivation(profile, logs) {
    await this.initialize();
    
    const motivationMessages = [
      "Great job staying consistent with your health journey!",
      "Every small step counts towards your bigger goals!",
      "You're building amazing healthy habits - keep it up!",
      "Your dedication to wellness is inspiring!",
      "Remember, progress over perfection - you're doing great!"
    ];

    const randomMessage = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
    
    return {
      message: randomMessage,
      personalizedTip: `Based on your ${profile.bodyType} body type and ${profile.culture} background, focus on consistent small changes.`,
      timestamp: new Date().toISOString()
    };
  }

  async generateNutritionSuggestions(profile, logs) {
    await this.initialize();
    
    const suggestions = [
      "Try adding more leafy greens to your meals",
      "Consider increasing your protein intake",
      "Stay hydrated - aim for 8 glasses of water daily",
      "Include healthy fats like avocados and nuts",
      "Eat colorful fruits and vegetables for variety"
    ];

    return {
      suggestions: suggestions.slice(0, 3),
      personalizedNote: `For your ${profile.goals.join(', ')} goals, focus on balanced nutrition.`,
      timestamp: new Date().toISOString()
    };
  }

  async generateComprehensiveInsights(profile, logs) {
    await this.initialize();
    
    const motivation = await this.generateMotivation(profile, logs);
    const nutrition = await this.generateNutritionSuggestions(profile, logs);
    
    return {
      motivation: motivation.message,
      personalizedTip: motivation.personalizedTip,
      nutritionSuggestions: nutrition.suggestions,
      insights: [
        "You're making consistent progress towards your health goals",
        "Consider tracking your daily water intake",
        "Small, sustainable changes lead to lasting results"
      ],
      nextSteps: [
        "Log your meals for better awareness",
        "Set a daily movement goal",
        "Practice mindful eating"
      ],
      timestamp: new Date().toISOString()
    };
  }

  async generateChatResponse(message, profile, context) {
    await this.initialize();
    
    const responses = [
      "That's a great question! Based on your profile, I'd suggest focusing on gradual changes.",
      "I understand your concern. Let's work together to find a solution that fits your lifestyle.",
      "Excellent progress! Keep up the good work with your health journey.",
      "That's completely normal. Remember, every small step counts towards your goals.",
      "I'm here to support you. Let's break this down into manageable steps."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      response: randomResponse,
      suggestions: [
        "Try setting small, achievable daily goals",
        "Focus on one habit at a time",
        "Celebrate your progress, no matter how small"
      ],
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { aiCoach: new MockAICoach() };