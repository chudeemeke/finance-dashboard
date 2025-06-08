/**
 * Family Finance Dashboard v3.1.0
 * Gamification & Engagement Features
 * 
 * Provides achievement systems, financial coaching, progress tracking,
 * and engagement mechanics to motivate better financial habits
 */

(function(window) {
  'use strict';

  const { React, ReactDOM } = window;
  const { Utils, ActionTypes, useFinance, CONFIG } = window.FinanceApp;
  const { i18n, LocaleFormatter } = window.FinanceApp.InternationalFeatures;
  const { AIAnalyticsEngine } = window.FinanceApp.AdvancedFeatures;

  // Achievement system
  const AchievementSystem = {
    achievements: new Map(),
    userProgress: new Map(),
    
    // Initialize achievements
    init: () => {
      // Define all achievements
      const achievementList = [
        // Savings achievements
        {
          id: 'first_save',
          category: 'savings',
          name: 'First Steps',
          description: 'Make your first savings contribution',
          icon: '🌱',
          points: 10,
          criteria: { type: 'savings_contribution', count: 1 }
        },
        {
          id: 'savings_streak_7',
          category: 'savings',
          name: 'Week Saver',
          description: 'Save money for 7 consecutive days',
          icon: '📅',
          points: 25,
          criteria: { type: 'savings_streak', days: 7 }
        },
        {
          id: 'savings_streak_30',
          category: 'savings',
          name: 'Monthly Champion',
          description: 'Save money for 30 consecutive days',
          icon: '🏆',
          points: 100,
          criteria: { type: 'savings_streak', days: 30 }
        },
        {
          id: 'emergency_fund_25',
          category: 'savings',
          name: 'Safety Net Builder',
          description: 'Build emergency fund to 25% of goal',
          icon: '🛡️',
          points: 50,
          criteria: { type: 'emergency_fund', percentage: 25 }
        },
        {
          id: 'emergency_fund_100',
          category: 'savings',
          name: 'Fully Prepared',
          description: 'Complete your emergency fund goal',
          icon: '🏰',
          points: 200,
          criteria: { type: 'emergency_fund', percentage: 100 }
        },
        
        // Budget achievements
        {
          id: 'budget_created',
          category: 'budget',
          name: 'Budget Beginner',
          description: 'Create your first budget',
          icon: '📊',
          points: 15,
          criteria: { type: 'budget_created', count: 1 }
        },
        {
          id: 'under_budget_1',
          category: 'budget',
          name: 'Under Control',
          description: 'Stay under budget for one month',
          icon: '✅',
          points: 30,
          criteria: { type: 'under_budget', months: 1 }
        },
        {
          id: 'under_budget_3',
          category: 'budget',
          name: 'Budget Master',
          description: 'Stay under budget for 3 consecutive months',
          icon: '🎯',
          points: 100,
          criteria: { type: 'under_budget', months: 3 }
        },
        {
          id: 'all_categories_budget',
          category: 'budget',
          name: 'Comprehensive Planner',
          description: 'Create budgets for all spending categories',
          icon: '📋',
          points: 50,
          criteria: { type: 'all_categories_budgeted' }
        },
        
        // Spending achievements
        {
          id: 'no_spend_day',
          category: 'spending',
          name: 'No Spend Day',
          description: 'Complete a day without any expenses',
          icon: '🚫',
          points: 10,
          criteria: { type: 'no_spend_days', count: 1 }
        },
        {
          id: 'no_spend_week',
          category: 'spending',
          name: 'Frugal Week',
          description: 'Complete 7 no-spend days',
          icon: '💪',
          points: 50,
          criteria: { type: 'no_spend_days', count: 7 }
        },
        {
          id: 'reduce_spending_10',
          category: 'spending',
          name: 'Spending Cutter',
          description: 'Reduce monthly spending by 10%',
          icon: '✂️',
          points: 40,
          criteria: { type: 'spending_reduction', percentage: 10 }
        },
        
        // Financial literacy
        {
          id: 'complete_tutorial',
          category: 'learning',
          name: 'Quick Learner',
          description: 'Complete the financial basics tutorial',
          icon: '🎓',
          points: 20,
          criteria: { type: 'tutorial_completed', tutorial: 'basics' }
        },
        {
          id: 'quiz_perfect',
          category: 'learning',
          name: 'Finance Expert',
          description: 'Get 100% on a financial literacy quiz',
          icon: '💯',
          points: 30,
          criteria: { type: 'quiz_score', score: 100 }
        },
        {
          id: 'weekly_tips_read',
          category: 'learning',
          name: 'Knowledge Seeker',
          description: 'Read financial tips for 4 consecutive weeks',
          icon: '📚',
          points: 25,
          criteria: { type: 'tips_read', weeks: 4 }
        },
        
        // Milestones
        {
          id: 'first_1000_saved',
          category: 'milestone',
          name: 'Thousand Club',
          description: 'Save your first $1,000',
          icon: '💰',
          points: 100,
          criteria: { type: 'total_saved', amount: 1000 }
        },
        {
          id: 'debt_free',
          category: 'milestone',
          name: 'Debt Free',
          description: 'Pay off all your debts',
          icon: '🎉',
          points: 500,
          criteria: { type: 'debt_free' }
        },
        {
          id: 'net_worth_positive',
          category: 'milestone',
          name: 'In the Green',
          description: 'Achieve positive net worth',
          icon: '📈',
          points: 200,
          criteria: { type: 'net_worth_positive' }
        },
        
        // Engagement
        {
          id: 'daily_check_7',
          category: 'engagement',
          name: 'Daily Habit',
          description: 'Check your finances for 7 consecutive days',
          icon: '📱',
          points: 20,
          criteria: { type: 'daily_login', days: 7 }
        },
        {
          id: 'daily_check_30',
          category: 'engagement',
          name: 'Finance Enthusiast',
          description: 'Check your finances for 30 consecutive days',
          icon: '🔥',
          points: 75,
          criteria: { type: 'daily_login', days: 30 }
        },
        {
          id: 'transactions_100',
          category: 'engagement',
          name: 'Transaction Tracker',
          description: 'Log 100 transactions',
          icon: '📝',
          points: 40,
          criteria: { type: 'transactions_logged', count: 100 }
        },
        
        // Special achievements
        {
          id: 'early_bird',
          category: 'special',
          name: 'Early Bird',
          description: 'Check finances before 7 AM',
          icon: '🌅',
          points: 15,
          criteria: { type: 'time_based', hour: 7 }
        },
        {
          id: 'night_owl',
          category: 'special',
          name: 'Night Owl',
          description: 'Review finances after 10 PM',
          icon: '🦉',
          points: 15,
          criteria: { type: 'time_based', hour: 22 }
        },
        {
          id: 'weekend_warrior',
          category: 'special',
          name: 'Weekend Warrior',
          description: 'Complete financial tasks on weekends',
          icon: '🗓️',
          points: 20,
          criteria: { type: 'weekend_activity' }
        }
      ];

      // Add achievements to map
      achievementList.forEach(achievement => {
        AchievementSystem.achievements.set(achievement.id, achievement);
      });
    },

    // Check and award achievements
    checkAchievements: (userId, context) => {
      const userAchievements = AchievementSystem.userProgress.get(userId) || {
        unlocked: new Set(),
        progress: new Map(),
        totalPoints: 0,
        level: 1
      };

      const newlyUnlocked = [];

      AchievementSystem.achievements.forEach((achievement, id) => {
        if (userAchievements.unlocked.has(id)) return;

        const isUnlocked = AchievementSystem.checkCriteria(achievement.criteria, context, userId);
        
        if (isUnlocked) {
          userAchievements.unlocked.add(id);
          userAchievements.totalPoints += achievement.points;
          newlyUnlocked.push(achievement);
          
          // Calculate new level
          userAchievements.level = Math.floor(userAchievements.totalPoints / 100) + 1;
        }
      });

      AchievementSystem.userProgress.set(userId, userAchievements);

      // Notify about new achievements
      newlyUnlocked.forEach(achievement => {
        Utils.NotificationManager.success(
          `🎉 Achievement Unlocked: ${achievement.name}!`,
          { duration: 5000 }
        );
      });

      return newlyUnlocked;
    },

    // Check specific criteria
    checkCriteria: (criteria, context, userId) => {
      const { state } = context;
      
      switch (criteria.type) {
        case 'savings_contribution':
          return state.transactions.filter(t => 
            t.userId === userId && t.category === 'savings'
          ).length >= criteria.count;
          
        case 'savings_streak':
          return AchievementSystem.calculateSavingsStreak(state.transactions, userId) >= criteria.days;
          
        case 'emergency_fund':
          const emergencyGoal = state.savingsGoals.find(g => 
            g.userId === userId && g.category === 'emergency'
          );
          return emergencyGoal && 
            (emergencyGoal.currentAmount / emergencyGoal.targetAmount * 100) >= criteria.percentage;
          
        case 'budget_created':
          return state.budgets.filter(b => b.userId === userId).length >= criteria.count;
          
        case 'under_budget':
          return AchievementSystem.checkBudgetCompliance(state, userId, criteria.months);
          
        case 'no_spend_days':
          return AchievementSystem.countNoSpendDays(state.transactions, userId) >= criteria.count;
          
        case 'spending_reduction':
          return AchievementSystem.calculateSpendingReduction(state.transactions, userId) >= criteria.percentage;
          
        case 'total_saved':
          const totalSaved = state.transactions
            .filter(t => t.userId === userId && t.category === 'savings' && t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
          return totalSaved >= criteria.amount;
          
        case 'daily_login':
          return AchievementSystem.getLoginStreak(userId) >= criteria.days;
          
        case 'transactions_logged':
          return state.transactions.filter(t => t.userId === userId).length >= criteria.count;
          
        default:
          return false;
      }
    },

    // Helper methods
    calculateSavingsStreak: (transactions, userId) => {
      const savingsDays = new Set();
      transactions
        .filter(t => t.userId === userId && t.category === 'savings' && t.amount > 0)
        .forEach(t => savingsDays.add(t.date));
      
      // Check for consecutive days
      let maxStreak = 0;
      let currentStreak = 0;
      let lastDate = null;
      
      Array.from(savingsDays).sort().forEach(date => {
        if (!lastDate || new Date(date) - new Date(lastDate) === 86400000) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
        lastDate = date;
      });
      
      return maxStreak;
    },

    checkBudgetCompliance: (state, userId, months) => {
      // Simplified check - in production would check actual monthly compliance
      const budgets = state.budgets.filter(b => b.userId === userId);
      const transactions = state.transactions.filter(t => t.userId === userId);
      
      // Check if user has been under budget
      let compliantMonths = 0;
      // Implementation would check each month
      
      return compliantMonths >= months;
    },

    countNoSpendDays: (transactions, userId) => {
      const spendDays = new Set();
      transactions
        .filter(t => t.userId === userId && t.type === 'expense')
        .forEach(t => spendDays.add(t.date));
      
      // Count days in the last 30 days without spending
      let noSpendCount = 0;
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        if (!spendDays.has(dateStr)) {
          noSpendCount++;
        }
      }
      
      return noSpendCount;
    },

    calculateSpendingReduction: (transactions, userId) => {
      const now = new Date();
      const thisMonth = now.getMonth();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      
      const thisMonthSpending = transactions
        .filter(t => {
          const date = new Date(t.date);
          return t.userId === userId && 
                 t.type === 'expense' && 
                 date.getMonth() === thisMonth;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const lastMonthSpending = transactions
        .filter(t => {
          const date = new Date(t.date);
          return t.userId === userId && 
                 t.type === 'expense' && 
                 date.getMonth() === lastMonth;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      if (lastMonthSpending === 0) return 0;
      
      const reduction = ((lastMonthSpending - thisMonthSpending) / lastMonthSpending) * 100;
      return Math.max(0, reduction);
    },

    getLoginStreak: (userId) => {
      // In production, would track actual login dates
      // For demo, return a random streak
      return Math.floor(Math.random() * 20) + 1;
    },

    // Get user's achievement data
    getUserAchievements: (userId) => {
      return AchievementSystem.userProgress.get(userId) || {
        unlocked: new Set(),
        progress: new Map(),
        totalPoints: 0,
        level: 1
      };
    },

    // Get achievement progress
    getProgress: (achievementId, userId, state) => {
      const achievement = AchievementSystem.achievements.get(achievementId);
      if (!achievement) return 0;
      
      // Calculate progress based on criteria type
      // This would be more detailed in production
      return Math.random() * 100; // Placeholder
    }
  };

  // Financial coaching service
  const FinancialCoachingService = {
    tips: [
      // Savings tips
      {
        id: 'tip_automate_savings',
        category: 'savings',
        title: 'Automate Your Savings',
        content: 'Set up automatic transfers to your savings account right after payday. You\'ll save without thinking about it!',
        difficulty: 'beginner',
        impact: 'high'
      },
      {
        id: 'tip_50_30_20',
        category: 'budgeting',
        title: 'The 50/30/20 Rule',
        content: 'Allocate 50% of income to needs, 30% to wants, and 20% to savings and debt repayment.',
        difficulty: 'beginner',
        impact: 'high'
      },
      {
        id: 'tip_emergency_fund',
        category: 'savings',
        title: 'Build Your Emergency Fund',
        content: 'Aim to save 3-6 months of expenses for emergencies. Start small with $1,000 as your first goal.',
        difficulty: 'intermediate',
        impact: 'high'
      },
      {
        id: 'tip_meal_planning',
        category: 'spending',
        title: 'Meal Planning Saves Money',
        content: 'Plan your meals for the week and shop with a list. You\'ll reduce food waste and impulse purchases.',
        difficulty: 'beginner',
        impact: 'medium'
      },
      {
        id: 'tip_negotiate_bills',
        category: 'spending',
        title: 'Negotiate Your Bills',
        content: 'Call your service providers annually to negotiate better rates. Many companies offer retention discounts.',
        difficulty: 'intermediate',
        impact: 'medium'
      },
      {
        id: 'tip_compound_interest',
        category: 'investing',
        title: 'Start Investing Early',
        content: 'The power of compound interest means starting early, even with small amounts, can lead to significant growth.',
        difficulty: 'intermediate',
        impact: 'high'
      }
    ],

    tutorials: [
      {
        id: 'basics',
        title: 'Financial Basics',
        description: 'Learn the fundamentals of personal finance',
        duration: '15 min',
        modules: [
          {
            id: 'income_expenses',
            title: 'Understanding Income and Expenses',
            content: 'Learn to track where your money comes from and where it goes.',
            quiz: [
              {
                question: 'What percentage of income should go to necessities?',
                options: ['30%', '50%', '70%', '90%'],
                correct: 1
              }
            ]
          },
          {
            id: 'budgeting_101',
            title: 'Budgeting 101',
            content: 'Create your first budget and stick to it.',
            quiz: [
              {
                question: 'What is zero-based budgeting?',
                options: [
                  'Having no money',
                  'Every dollar has a purpose',
                  'Starting fresh each year',
                  'Spending nothing'
                ],
                correct: 1
              }
            ]
          }
        ]
      },
      {
        id: 'advanced',
        title: 'Advanced Strategies',
        description: 'Take your finances to the next level',
        duration: '30 min',
        modules: [
          {
            id: 'investing_basics',
            title: 'Introduction to Investing',
            content: 'Understand different investment vehicles and strategies.',
            quiz: []
          },
          {
            id: 'tax_optimization',
            title: 'Tax Optimization',
            content: 'Legal ways to reduce your tax burden.',
            quiz: []
          }
        ]
      }
    ],

    // Get personalized tips based on user data
    getPersonalizedTips: (userId, state) => {
      const tips = [];
      const userTransactions = state.transactions.filter(t => t.userId === userId);
      
      // Analyze user's financial situation
      const analysis = AIAnalyticsEngine.analyzeSpendingPatterns(userTransactions);
      
      // Recommend tips based on analysis
      if (analysis.anomalies.length > 0) {
        tips.push(FinancialCoachingService.tips.find(t => t.id === 'tip_meal_planning'));
      }
      
      const savingsRate = FinancialCoachingService.calculateSavingsRate(userTransactions);
      if (savingsRate < 0.1) {
        tips.push(FinancialCoachingService.tips.find(t => t.id === 'tip_automate_savings'));
      }
      
      // Add more personalized recommendations
      return tips.filter(Boolean).slice(0, 3);
    },

    calculateSavingsRate: (transactions) => {
      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const savings = transactions
        .filter(t => t.category === 'savings')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return income > 0 ? savings / income : 0;
    },

    // Track tutorial progress
    trackProgress: (userId, tutorialId, moduleId, completed = false) => {
      const key = `tutorial_${userId}_${tutorialId}_${moduleId}`;
      if (completed) {
        localStorage.setItem(key, 'completed');
      }
      return localStorage.getItem(key) === 'completed';
    },

    // Get next recommended tutorial
    getNextTutorial: (userId) => {
      for (const tutorial of FinancialCoachingService.tutorials) {
        for (const module of tutorial.modules) {
          if (!FinancialCoachingService.trackProgress(userId, tutorial.id, module.id)) {
            return { tutorial, module };
          }
        }
      }
      return null;
    }
  };

  // Challenges and goals system
  const ChallengesSystem = {
    activeChallenges: new Map(),
    
    challenges: [
      {
        id: 'no_coffee_week',
        name: 'Skip the Coffee Shop',
        description: 'Avoid coffee shop purchases for one week',
        duration: 7,
        reward: 50,
        category: 'spending',
        difficulty: 'easy'
      },
      {
        id: 'pack_lunch_month',
        name: 'Lunch Packer',
        description: 'Pack your lunch instead of buying for 30 days',
        duration: 30,
        reward: 150,
        category: 'spending',
        difficulty: 'medium'
      },
      {
        id: 'save_10_percent',
        name: '10% Saver',
        description: 'Save 10% of your income this month',
        duration: 30,
        reward: 200,
        category: 'savings',
        difficulty: 'medium'
      },
      {
        id: 'expense_tracking',
        name: 'Every Penny Counts',
        description: 'Track every expense for 2 weeks',
        duration: 14,
        reward: 75,
        category: 'tracking',
        difficulty: 'easy'
      },
      {
        id: 'budget_buster',
        name: 'Budget Buster',
        description: 'Stay 20% under budget in all categories',
        duration: 30,
        reward: 300,
        category: 'budgeting',
        difficulty: 'hard'
      }
    ],

    // Start a challenge
    startChallenge: (userId, challengeId) => {
      const challenge = ChallengesSystem.challenges.find(c => c.id === challengeId);
      if (!challenge) return false;

      const userChallenges = ChallengesSystem.activeChallenges.get(userId) || [];
      
      // Check if already active
      if (userChallenges.some(c => c.id === challengeId && c.status === 'active')) {
        return false;
      }

      userChallenges.push({
        ...challenge,
        startDate: new Date(),
        endDate: new Date(Date.now() + challenge.duration * 24 * 60 * 60 * 1000),
        status: 'active',
        progress: 0
      });

      ChallengesSystem.activeChallenges.set(userId, userChallenges);
      return true;
    },

    // Update challenge progress
    updateProgress: (userId, challengeId, progress) => {
      const userChallenges = ChallengesSystem.activeChallenges.get(userId) || [];
      const challenge = userChallenges.find(c => c.id === challengeId && c.status === 'active');
      
      if (!challenge) return;

      challenge.progress = Math.min(100, progress);
      
      if (challenge.progress >= 100) {
        challenge.status = 'completed';
        challenge.completedDate = new Date();
        
        // Award points
        AchievementSystem.checkAchievements(userId, { 
          challengeCompleted: challengeId,
          rewardPoints: challenge.reward
        });
      }

      ChallengesSystem.activeChallenges.set(userId, userChallenges);
    },

    // Get active challenges for user
    getActiveChallenges: (userId) => {
      const userChallenges = ChallengesSystem.activeChallenges.get(userId) || [];
      const now = new Date();
      
      // Update expired challenges
      userChallenges.forEach(challenge => {
        if (challenge.status === 'active' && new Date(challenge.endDate) < now) {
          challenge.status = 'expired';
        }
      });
      
      return userChallenges.filter(c => c.status === 'active');
    },

    // Get recommended challenges
    getRecommendedChallenges: (userId, state) => {
      const completedChallenges = (ChallengesSystem.activeChallenges.get(userId) || [])
        .filter(c => c.status === 'completed')
        .map(c => c.id);
      
      return ChallengesSystem.challenges
        .filter(c => !completedChallenges.includes(c.id))
        .slice(0, 3);
    }
  };

  // Progress visualization components
  const ProgressComponents = {
    // Achievement showcase
    AchievementShowcase: ({ userId }) => {
      const { state } = useFinance();
      const [achievements, setAchievements] = React.useState(null);
      const [selectedCategory, setSelectedCategory] = React.useState('all');

      React.useEffect(() => {
        const userAchievements = AchievementSystem.getUserAchievements(userId);
        setAchievements(userAchievements);
      }, [userId]);

      if (!achievements) return null;

      const categories = ['all', 'savings', 'budget', 'spending', 'learning', 'milestone', 'engagement', 'special'];
      const allAchievements = Array.from(AchievementSystem.achievements.values());
      const filteredAchievements = selectedCategory === 'all' 
        ? allAchievements 
        : allAchievements.filter(a => a.category === selectedCategory);

      return React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
        React.createElement('div', { className: 'flex justify-between items-center mb-6' },
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-xl font-semibold' }, 'Achievements'),
            React.createElement('p', { className: 'text-sm text-gray-600' },
              `Level ${achievements.level} • ${achievements.totalPoints} points`
            )
          ),
          React.createElement('div', { className: 'text-right' },
            React.createElement('div', { className: 'text-2xl font-bold text-blue-600' },
              `${achievements.unlocked.size}/${allAchievements.length}`
            ),
            React.createElement('div', { className: 'text-sm text-gray-600' }, 'Unlocked')
          )
        ),

        // Category filter
        React.createElement('div', { className: 'flex space-x-2 mb-6 overflow-x-auto' },
          categories.map(category =>
            React.createElement('button', {
              key: category,
              onClick: () => setSelectedCategory(category),
              className: `px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`
            }, category.charAt(0).toUpperCase() + category.slice(1))
          )
        ),

        // Achievement grid
        React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' },
          filteredAchievements.map(achievement => {
            const isUnlocked = achievements.unlocked.has(achievement.id);
            const progress = isUnlocked ? 100 : AchievementSystem.getProgress(achievement.id, userId, state);

            return React.createElement('div', {
              key: achievement.id,
              className: `relative p-4 rounded-lg border-2 transition-all ${
                isUnlocked
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 opacity-75'
              }`
            },
              React.createElement('div', { className: 'text-center' },
                React.createElement('div', { 
                  className: `text-3xl mb-2 ${isUnlocked ? '' : 'grayscale'}`
                }, achievement.icon),
                React.createElement('h4', { 
                  className: `font-medium text-sm ${isUnlocked ? 'text-gray-800' : 'text-gray-600'}`
                }, achievement.name),
                React.createElement('p', { 
                  className: 'text-xs text-gray-600 mt-1'
                }, achievement.description),
                React.createElement('div', { 
                  className: 'text-xs font-medium mt-2'
                }, `${achievement.points} pts`)
              ),
              
              // Progress bar
              !isUnlocked && progress > 0 && React.createElement('div', {
                className: 'absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden'
              },
                React.createElement('div', {
                  className: 'h-full bg-blue-500 transition-all duration-500',
                  style: { width: `${progress}%` }
                })
              ),
              
              // Unlock indicator
              isUnlocked && React.createElement('div', {
                className: 'absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center'
              },
                React.createElement('span', { className: 'text-white text-xs' }, '✓')
              )
            );
          })
        )
      );
    },

    // Level progress
    LevelProgress: ({ userId }) => {
      const achievements = AchievementSystem.getUserAchievements(userId);
      const currentLevel = achievements.level;
      const currentPoints = achievements.totalPoints;
      const pointsForCurrentLevel = (currentLevel - 1) * 100;
      const pointsForNextLevel = currentLevel * 100;
      const progressInLevel = ((currentPoints - pointsForCurrentLevel) / 100) * 100;

      return React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
        React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Level Progress'),
        
        React.createElement('div', { className: 'flex items-center justify-between mb-2' },
          React.createElement('div', { className: 'flex items-center' },
            React.createElement('div', { 
              className: 'w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg'
            }, currentLevel),
            React.createElement('div', { className: 'ml-3' },
              React.createElement('div', { className: 'font-medium' }, `Level ${currentLevel}`),
              React.createElement('div', { className: 'text-sm text-gray-600' }, 
                `${currentPoints} total points`
              )
            )
          ),
          React.createElement('div', { className: 'text-right' },
            React.createElement('div', { className: 'text-sm text-gray-600' }, 'Next level'),
            React.createElement('div', { className: 'font-medium' }, 
              `${pointsForNextLevel - currentPoints} points`
            )
          )
        ),
        
        React.createElement('div', { className: 'relative h-4 bg-gray-200 rounded-full overflow-hidden' },
          React.createElement('div', {
            className: 'absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500',
            style: { width: `${progressInLevel}%` }
          }),
          React.createElement('div', {
            className: 'absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference'
          }, `${Math.round(progressInLevel)}%`)
        )
      );
    },

    // Daily streak tracker
    StreakTracker: ({ userId }) => {
      const [streaks, setStreaks] = React.useState({
        current: 7,
        longest: 15,
        savingsStreak: 3,
        budgetStreak: 12
      });

      const streakTypes = [
        { 
          name: 'Daily Check-in', 
          current: streaks.current, 
          icon: '📅',
          color: 'blue'
        },
        { 
          name: 'Savings Streak', 
          current: streaks.savingsStreak, 
          icon: '💰',
          color: 'green'
        },
        { 
          name: 'Budget Compliance', 
          current: streaks.budgetStreak, 
          icon: '📊',
          color: 'purple'
        }
      ];

      return React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
        React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Active Streaks'),
        
        React.createElement('div', { className: 'space-y-4' },
          streakTypes.map((streak, index) =>
            React.createElement('div', { 
              key: index,
              className: 'flex items-center justify-between p-3 bg-gray-50 rounded-lg'
            },
              React.createElement('div', { className: 'flex items-center' },
                React.createElement('span', { className: 'text-2xl mr-3' }, streak.icon),
                React.createElement('div', null,
                  React.createElement('div', { className: 'font-medium' }, streak.name),
                  React.createElement('div', { className: 'text-sm text-gray-600' }, 
                    `${streak.current} day${streak.current !== 1 ? 's' : ''}`
                  )
                )
              ),
              React.createElement('div', { 
                className: `text-2xl font-bold text-${streak.color}-600`
              }, streak.current)
            )
          )
        ),
        
        React.createElement('div', { 
          className: 'mt-4 p-3 bg-yellow-50 rounded-lg text-center'
        },
          React.createElement('div', { className: 'text-sm text-yellow-800' }, 
            'Longest streak: ', 
            React.createElement('span', { className: 'font-bold' }, `${streaks.longest} days`)
          )
        )
      );
    },

    // Active challenges
    ActiveChallenges: ({ userId }) => {
      const [challenges, setChallenges] = React.useState([]);
      const [recommended, setRecommended] = React.useState([]);

      React.useEffect(() => {
        setChallenges(ChallengesSystem.getActiveChallenges(userId));
        setRecommended(ChallengesSystem.getRecommendedChallenges(userId));
      }, [userId]);

      const handleStartChallenge = (challengeId) => {
        if (ChallengesSystem.startChallenge(userId, challengeId)) {
          setChallenges(ChallengesSystem.getActiveChallenges(userId));
          setRecommended(ChallengesSystem.getRecommendedChallenges(userId));
          Utils.NotificationManager.success('Challenge started!');
        }
      };

      return React.createElement('div', { className: 'space-y-6' },
        // Active challenges
        challenges.length > 0 && React.createElement('div', { 
          className: 'bg-white rounded-lg shadow-md p-6' 
        },
          React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 
            'Active Challenges'
          ),
          React.createElement('div', { className: 'space-y-3' },
            challenges.map(challenge => {
              const daysLeft = Math.ceil((new Date(challenge.endDate) - new Date()) / (1000 * 60 * 60 * 24));
              
              return React.createElement('div', {
                key: challenge.id,
                className: 'p-4 border border-gray-200 rounded-lg'
              },
                React.createElement('div', { className: 'flex justify-between items-start mb-2' },
                  React.createElement('div', null,
                    React.createElement('h4', { className: 'font-medium' }, challenge.name),
                    React.createElement('p', { className: 'text-sm text-gray-600' }, 
                      challenge.description
                    )
                  ),
                  React.createElement('div', { className: 'text-right' },
                    React.createElement('div', { className: 'text-sm font-medium text-blue-600' },
                      `${challenge.reward} pts`
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500' },
                      `${daysLeft} days left`
                    )
                  )
                ),
                React.createElement('div', { className: 'relative h-3 bg-gray-200 rounded-full overflow-hidden' },
                  React.createElement('div', {
                    className: 'absolute left-0 top-0 h-full bg-blue-500 transition-all duration-500',
                    style: { width: `${challenge.progress}%` }
                  })
                )
              );
            })
          )
        ),

        // Recommended challenges
        React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
          React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 
            'Recommended Challenges'
          ),
          React.createElement('div', { className: 'grid gap-3' },
            recommended.map(challenge =>
              React.createElement('div', {
                key: challenge.id,
                className: 'p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
              },
                React.createElement('div', { className: 'flex justify-between items-center' },
                  React.createElement('div', null,
                    React.createElement('h4', { className: 'font-medium' }, challenge.name),
                    React.createElement('p', { className: 'text-sm text-gray-600' }, 
                      challenge.description
                    ),
                    React.createElement('div', { className: 'flex items-center space-x-4 mt-2 text-xs' },
                      React.createElement('span', { 
                        className: `px-2 py-1 rounded ${
                          challenge.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`
                      }, challenge.difficulty),
                      React.createElement('span', { className: 'text-gray-500' },
                        `${challenge.duration} days`
                      ),
                      React.createElement('span', { className: 'font-medium text-blue-600' },
                        `${challenge.reward} pts`
                      )
                    )
                  ),
                  React.createElement('button', {
                    onClick: () => handleStartChallenge(challenge.id),
                    className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
                  }, 'Start')
                )
              )
            )
          )
        )
      );
    },

    // Financial tips carousel
    TipsCarousel: ({ userId }) => {
      const { state } = useFinance();
      const [tips, setTips] = React.useState([]);
      const [currentTip, setCurrentTip] = React.useState(0);

      React.useEffect(() => {
        const personalizedTips = FinancialCoachingService.getPersonalizedTips(userId, state);
        setTips(personalizedTips.length > 0 ? personalizedTips : FinancialCoachingService.tips.slice(0, 3));
      }, [userId, state]);

      const nextTip = () => {
        setCurrentTip((prev) => (prev + 1) % tips.length);
      };

      const prevTip = () => {
        setCurrentTip((prev) => (prev - 1 + tips.length) % tips.length);
      };

      if (tips.length === 0) return null;

      const tip = tips[currentTip];

      return React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
        React.createElement('div', { className: 'flex justify-between items-center mb-4' },
          React.createElement('h3', { className: 'text-lg font-semibold' }, 'Financial Tips'),
          React.createElement('div', { className: 'flex space-x-2' },
            React.createElement('button', {
              onClick: prevTip,
              className: 'p-1 text-gray-600 hover:text-gray-800'
            }, '←'),
            React.createElement('span', { className: 'text-sm text-gray-600' },
              `${currentTip + 1} / ${tips.length}`
            ),
            React.createElement('button', {
              onClick: nextTip,
              className: 'p-1 text-gray-600 hover:text-gray-800'
            }, '→')
          )
        ),
        
        React.createElement('div', { className: 'bg-blue-50 rounded-lg p-4' },
          React.createElement('h4', { className: 'font-medium text-blue-900 mb-2' }, 
            tip.title
          ),
          React.createElement('p', { className: 'text-blue-800' }, tip.content),
          React.createElement('div', { className: 'flex items-center justify-between mt-4' },
            React.createElement('div', { className: 'flex items-center space-x-3 text-sm' },
              React.createElement('span', { 
                className: `px-2 py-1 rounded text-xs ${
                  tip.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                  tip.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`
              }, tip.difficulty),
              React.createElement('span', { 
                className: `px-2 py-1 rounded text-xs ${
                  tip.impact === 'high' ? 'bg-purple-100 text-purple-700' :
                  tip.impact === 'medium' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`
              }, `${tip.impact} impact`)
            ),
            React.createElement('button', {
              className: 'text-sm text-blue-600 hover:text-blue-800'
            }, 'Learn More →')
          )
        )
      );
    },

    // Interactive tutorial
    InteractiveTutorial: ({ userId }) => {
      const [currentTutorial, setCurrentTutorial] = React.useState(null);
      const [currentModule, setCurrentModule] = React.useState(null);
      const [showQuiz, setShowQuiz] = React.useState(false);
      const [quizAnswers, setQuizAnswers] = React.useState({});

      React.useEffect(() => {
        const next = FinancialCoachingService.getNextTutorial(userId);
        if (next) {
          setCurrentTutorial(next.tutorial);
          setCurrentModule(next.module);
        }
      }, [userId]);

      const handleQuizSubmit = () => {
        // Check answers
        const correct = currentModule.quiz.every((q, index) => 
          quizAnswers[index] === q.correct
        );
        
        if (correct) {
          FinancialCoachingService.trackProgress(
            userId, 
            currentTutorial.id, 
            currentModule.id, 
            true
          );
          Utils.NotificationManager.success('Module completed! 🎉');
          
          // Load next module
          const next = FinancialCoachingService.getNextTutorial(userId);
          if (next) {
            setCurrentTutorial(next.tutorial);
            setCurrentModule(next.module);
            setShowQuiz(false);
            setQuizAnswers({});
          }
        } else {
          Utils.NotificationManager.error('Some answers are incorrect. Try again!');
        }
      };

      if (!currentTutorial || !currentModule) {
        return React.createElement('div', { 
          className: 'bg-white rounded-lg shadow-md p-6 text-center' 
        },
          React.createElement('div', { className: 'text-4xl mb-4' }, '🎓'),
          React.createElement('h3', { className: 'text-lg font-semibold mb-2' }, 
            'All Tutorials Completed!'
          ),
          React.createElement('p', { className: 'text-gray-600' }, 
            'You\'ve mastered all the financial basics. Great job!'
          )
        );
      }

      return React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
        React.createElement('div', { className: 'mb-4' },
          React.createElement('h3', { className: 'text-lg font-semibold' }, 
            currentTutorial.title
          ),
          React.createElement('p', { className: 'text-sm text-gray-600' }, 
            currentTutorial.description
          )
        ),
        
        !showQuiz ? (
          React.createElement('div', null,
            React.createElement('h4', { className: 'font-medium mb-3' }, 
              currentModule.title
            ),
            React.createElement('div', { 
              className: 'prose prose-sm max-w-none text-gray-700 mb-6' 
            }, currentModule.content),
            React.createElement('button', {
              onClick: () => setShowQuiz(true),
              className: 'w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
            }, 'Take Quiz')
          )
        ) : (
          React.createElement('div', null,
            React.createElement('h4', { className: 'font-medium mb-4' }, 
              'Quick Quiz'
            ),
            React.createElement('div', { className: 'space-y-4' },
              currentModule.quiz.map((question, qIndex) =>
                React.createElement('div', { key: qIndex, className: 'p-4 bg-gray-50 rounded-lg' },
                  React.createElement('p', { className: 'font-medium mb-3' }, 
                    `${qIndex + 1}. ${question.question}`
                  ),
                  React.createElement('div', { className: 'space-y-2' },
                    question.options.map((option, oIndex) =>
                      React.createElement('label', {
                        key: oIndex,
                        className: 'flex items-center space-x-2 cursor-pointer'
                      },
                        React.createElement('input', {
                          type: 'radio',
                          name: `question-${qIndex}`,
                          value: oIndex,
                          onChange: () => setQuizAnswers({ ...quizAnswers, [qIndex]: oIndex }),
                          className: 'text-blue-500'
                        }),
                        React.createElement('span', null, option)
                      )
                    )
                  )
                )
              )
            ),
            React.createElement('button', {
              onClick: handleQuizSubmit,
              disabled: Object.keys(quizAnswers).length !== currentModule.quiz.length,
              className: 'w-full mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300'
            }, 'Submit Quiz')
          )
        )
      );
    }
  };

  // Leaderboard component (optional, anonymized)
  const Leaderboard = () => {
    const [leaderboardData] = React.useState([
      { rank: 1, name: 'User****123', points: 2450, level: 25 },
      { rank: 2, name: 'User****456', points: 2200, level: 22 },
      { rank: 3, name: 'User****789', points: 1950, level: 20 },
      { rank: 4, name: 'You', points: 1800, level: 18, isCurrentUser: true },
      { rank: 5, name: 'User****012', points: 1750, level: 18 }
    ]);

    return React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
      React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 
        'Community Leaderboard'
      ),
      React.createElement('p', { className: 'text-sm text-gray-600 mb-4' }, 
        'Compare your progress with the community (anonymized)'
      ),
      
      React.createElement('div', { className: 'space-y-2' },
        leaderboardData.map(user =>
          React.createElement('div', {
            key: user.rank,
            className: `flex items-center justify-between p-3 rounded-lg ${
              user.isCurrentUser ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
            }`
          },
            React.createElement('div', { className: 'flex items-center space-x-3' },
              React.createElement('div', {
                className: `w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  user.rank <= 3 ? 'bg-yellow-400 text-white' : 'bg-gray-300'
                }`
              }, user.rank),
              React.createElement('div', null,
                React.createElement('div', { 
                  className: `font-medium ${user.isCurrentUser ? 'text-blue-700' : ''}`
                }, user.name),
                React.createElement('div', { className: 'text-xs text-gray-600' }, 
                  `Level ${user.level}`
                )
              )
            ),
            React.createElement('div', { className: 'text-right' },
              React.createElement('div', { className: 'font-bold' }, 
                `${user.points.toLocaleString()} pts`
              )
            )
          )
        )
      )
    );
  };

  // Initialize gamification
  AchievementSystem.init();

  // Export all gamification features
  window.FinanceApp.GamificationFeatures = {
    // Systems
    AchievementSystem,
    FinancialCoachingService,
    ChallengesSystem,
    
    // Components
    ProgressComponents,
    Leaderboard,
    
    // Check achievements on state changes
    checkStateAchievements: (userId, state) => {
      return AchievementSystem.checkAchievements(userId, { state });
    }
  };

})(window);