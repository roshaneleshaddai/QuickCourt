const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { body, query, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// POST /api/chatbot/chat - Main chat endpoint
router.post('/chat', [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object'),
  handleValidationErrors
], chatbotController.handleChat);

// GET /api/chatbot/slots - Get available time slots for a venue
router.get('/slots', [
  query('facilityId')
    .isMongoId()
    .withMessage('Valid facility ID is required'),
  query('courtId')
    .isMongoId()
    .withMessage('Valid court ID is required'),
  query('date')
    .isISO8601()
    .withMessage('Valid date is required (YYYY-MM-DD format)'),
  handleValidationErrors
], chatbotController.getAvailableSlots);

// POST /api/chatbot/quick-action - Handle quick action buttons
router.post('/quick-action', [
  body('action')
    .isIn(['search_sport', 'search_price', 'search_rating', 'search_location', 'seed_database'])
    .withMessage('Invalid action type'),
  body('data')
    .isObject()
    .withMessage('Action data must be an object'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { action, data } = req.body;
    
    let message = '';
    let context = { ...data, quickAction: true };
    
    switch (action) {
      case 'search_sport':
        message = `I want to book ${data.sport} courts`;
        break;
      case 'search_price':
        message = `Show me ${data.range} courts`;
        break;
      case 'search_rating':
        message = `Show me top rated venues with courts`;
        break;
      case 'search_location':
        message = `Find courts in ${data.location}`;
        break;
      case 'seed_database':
        // Handle database seeding
        return require('child_process').exec('npm run seed', { cwd: __dirname + '/..' }, (error, stdout, stderr) => {
          if (error) {
            console.error('Seed error:', error);
            return res.json({ 
              type: 'conversation',
              message: 'I had trouble setting up the sample data. Please run "npm run seed" in the backend terminal to add sample venues.',
              suggestions: [
                { text: "🏸 Try Badminton Again", action: "search_sport", data: { sport: "badminton" } },
                { text: "🎾 Try Tennis", action: "search_sport", data: { sport: "tennis" } }
              ]
            });
          }
          
          return res.json({
            type: 'conversation',
            message: '🎉 Great! I\'ve added sample venues to the database. Now you can search for badminton courts, tennis courts, and more in Indore!',
            suggestions: [
              { text: "🏸 Find Badminton Courts", action: "search_sport", data: { sport: "badminton" } },
              { text: "🎾 Tennis Courts Near Me", action: "search_sport", data: { sport: "tennis" } },
              { text: "💰 Budget-Friendly Options", action: "search_price", data: { range: "budget" } }
            ]
          });
        });
      default:
        message = 'Show me available courts';
    }

    // Create a new request object with the constructed message
    const chatRequest = {
      body: { message, context },
      // Add other necessary properties that might be needed
    };

    // Call the chat handler directly
    return chatbotController.handleChat(chatRequest, res);
    
  } catch (error) {
    console.error('Quick action error:', error);
    res.status(500).json({ 
      error: 'Failed to process quick action',
      message: 'Sorry, I had trouble processing that action. Please try typing your request instead.',
      suggestions: [
        { text: "🏸 Find Badminton Courts", action: "search_sport", data: { sport: "badminton" } },
        { text: "🎾 Tennis Courts Near Me", action: "search_sport", data: { sport: "tennis" } },
        { text: "💰 Budget-Friendly Options", action: "search_price", data: { range: "budget" } }
      ]
    });
  }
});

// GET /api/chatbot/suggestions - Get conversation starters
router.get('/suggestions', (req, res) => {
  const suggestions = [
    {
      title: "Find Sports Venues",
      suggestions: [
        "I want to book a badminton court for tomorrow",
        "Show me tennis courts in Indore", 
        "Find basketball courts near me",
        "I need a football ground for this weekend"
      ]
    },
    {
      title: "Budget & Preferences", 
      suggestions: [
        "Show me budget-friendly options",
        "I want premium facilities",
        "Find courts with parking",
        "Show me indoor courts only"
      ]
    },
    {
      title: "Timing & Availability",
      suggestions: [
        "What's available this evening?",
        "Show me morning slots", 
        "I need courts for weekend",
        "Check availability for next week"
      ]
    }
  ];

  res.json({ suggestions });
});

// GET /api/chatbot/popular-venues - Get popular venues for quick suggestions
router.get('/popular-venues', async (req, res) => {
  try {
    const Facility = require('../models/Facility');
    
    const popularVenues = await Facility.find({
      isActive: true,
      isVerified: true,
      'address.city': { $regex: 'indore', $options: 'i' }
    })
    .populate('sports.sport')
    .sort({ 'rating.average': -1, 'rating.count': -1 })
    .limit(6)
    .select('name rating address images sports');

    const formattedVenues = popularVenues.map(venue => ({
      id: venue._id,
      name: venue.name,
      rating: venue.rating.average,
      ratingCount: venue.rating.count,
      address: `${venue.address.street}, ${venue.address.city}`,
      image: venue.images?.[0] || null,
      sports: venue.sports.map(s => s.sport.name).slice(0, 3)
    }));

    res.json({ venues: formattedVenues });
  } catch (error) {
    console.error('Error fetching popular venues:', error);
    res.status(500).json({ error: 'Failed to fetch popular venues' });
  }
});

// POST /api/chatbot/seed-database - Seed database with sample data
router.post('/seed-database', async (req, res) => {
  try {
    console.log('🌱 Starting database seeding via API...');
    
    // Import the seeder function
    const { exec } = require('child_process');
    
    exec('npm run seed', { cwd: __dirname + '/..' }, (error, stdout, stderr) => {
      if (error) {
        console.error('Seed error:', error);
        return res.status(500).json({ 
          error: 'Failed to seed database',
          message: 'There was an error seeding the database. Please try again.'
        });
      }
      
      console.log('Seed output:', stdout);
      res.json({
        success: true,
        message: 'Database seeded successfully! You can now search for venues.',
        suggestions: [
          { text: "🏸 Find Badminton Courts", action: "search_sport", data: { sport: "badminton" } },
          { text: "🎾 Tennis Courts Near Me", action: "search_sport", data: { sport: "tennis" } },
          { text: "💰 Budget-Friendly Options", action: "search_price", data: { range: "budget" } }
        ]
      });
    });
    
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({ 
      error: 'Failed to seed database',
      message: 'Please run "npm run seed" in the backend directory to add sample data.'
    });
  }
});

module.exports = router;
