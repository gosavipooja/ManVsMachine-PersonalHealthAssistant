const express = require('express');
const { weaviateService } = require('../services/memory-storage');
const { aiCoach } = require('../services/mock-openai');

const router = express.Router();

// Get dashboard data
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user profile
    const profileDocs = await weaviateService.getDocumentsByType('profile', userId, 1);
    if (profileDocs.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
        message: 'No profile found for this user'
      });
    }

    const profile = profileDocs[0].metadata;
    
    // Get today's logs
    const today = new Date().toISOString().split('T')[0];
    const logDocs = await weaviateService.getDocumentsByType('log', userId, 100);
    const todayLogs = logDocs
      .map(doc => doc.metadata)
      .filter(log => log.timestamp.startsWith(today));

    // Get recent logs for AI insights
    const recentLogs = logDocs.map(doc => doc.metadata).slice(0, 20);

    // Calculate today's progress
    const habitProgress = calculateHabitProgress(todayLogs);
    
    // Calculate streaks
    const streaks = await calculateStreaks(userId, logDocs.map(doc => doc.metadata));
    
    // Get weekly progress
    const weeklyProgress = calculateWeeklyProgress(logDocs.map(doc => doc.metadata));
    
    // Generate AI insights
    const aiInsights = await aiCoach.generateComprehensiveInsights(profile, recentLogs);

    const dashboardData = {
      todayProgress: habitProgress,
      streaks,
      weeklyProgress,
      aiInsights
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard data',
      message: error.message
    });
  }
});

// Get progress for specific habit
router.get('/:userId/habit/:habitId', async (req, res) => {
  try {
    const { userId, habitId } = req.params;
    const { days = 7 } = req.query;
    
    const logDocs = await weaviateService.getSimilarLogs(habitId, userId, parseInt(days) * 2);
    const logs = logDocs.map(doc => doc.metadata);

    // Calculate habit-specific progress
    const progress = calculateHabitProgress(logs, habitId);
    const streaks = await calculateStreaks(userId, logs, habitId);

    res.json({
      success: true,
      data: {
        habitId,
        progress,
        streaks,
        logs: logs.slice(0, parseInt(days))
      }
    });
  } catch (error) {
    console.error('Habit progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve habit progress',
      message: error.message
    });
  }
});

// Helper functions
function calculateHabitProgress(logs, specificHabitId = null) {
  const habitTargets = {
    hydration: { target: 8, unit: 'glasses' },
    nutrition: { target: 2000, unit: 'calories' },
    exercise: { target: 30, unit: 'minutes' },
    sleep: { target: 8, unit: 'hours' },
    mindfulness: { target: 10, unit: 'minutes' }
  };

  const habits = specificHabitId ? [specificHabitId] : Object.keys(habitTargets);
  
  return habits.map(habitId => {
    const habitLogs = logs.filter(log => log.habitId === habitId);
    const total = habitLogs.reduce((sum, log) => sum + log.value, 0);
    const target = (habitTargets[habitId] && habitTargets[habitId].target) || 1;
    
    return {
      habitId,
      habitName: habitId.charAt(0).toUpperCase() + habitId.slice(1),
      current: total,
      target,
      percentage: Math.min((total / target) * 100, 100)
    };
  });
}

async function calculateStreaks(userId, logs, specificHabitId = null) {
  const habits = specificHabitId ? [specificHabitId] : ['hydration', 'nutrition', 'exercise', 'sleep', 'mindfulness'];
  
  return habits.map(habitId => {
    const habitLogs = logs.filter(log => log.habitId === habitId);
    const streaks = calculateStreak(habitLogs);
    
    return {
      habitId,
      habitName: habitId.charAt(0).toUpperCase() + habitId.slice(1),
      currentStreak: streaks.current,
      longestStreak: streaks.longest
    };
  });
}

function calculateStreak(logs) {
  if (logs.length === 0) return { current: 0, longest: 0 };
  
  // Sort logs by date
  const sortedLogs = logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate current streak
  for (let i = sortedLogs.length - 1; i >= 0; i--) {
    const logDate = new Date(sortedLogs[i].timestamp);
    logDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today - logDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === currentStreak) {
      currentStreak++;
    } else if (daysDiff === currentStreak + 1) {
      // Gap of one day, continue streak
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Calculate longest streak
  tempStreak = 1;
  for (let i = 1; i < sortedLogs.length; i++) {
    const prevDate = new Date(sortedLogs[i - 1].timestamp);
    const currDate = new Date(sortedLogs[i].timestamp);
    const daysDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  
  return { current: currentStreak, longest: longestStreak };
}

function calculateWeeklyProgress(logs) {
  const weekDays = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayLogs = logs.filter(log => log.timestamp.startsWith(dateStr));
    const habits = ['hydration', 'nutrition', 'exercise', 'sleep', 'mindfulness'];
    
    const dayData = {
      date: dateStr,
      habits: habits.map(habitId => {
        const habitLogs = dayLogs.filter(log => log.habitId === habitId);
        const completed = habitLogs.length > 0;
        const value = habitLogs.reduce((sum, log) => sum + log.value, 0);
        
        return {
          habitId,
          completed,
          value
        };
      })
    };
    
    weekDays.push(dayData);
  }
  
  return weekDays;
}

module.exports = router;
