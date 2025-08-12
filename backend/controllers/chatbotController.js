const axios = require('axios');
const Facility = require('../models/Facility');
const Sport = require('../models/Sport');

class ChatbotController {
  // Initialize Mistral AI client
  constructor() {
    this.mistralApiKey = process.env.MISTRAL_API_KEY;
    this.mistralBaseUrl = 'https://api.mistral.ai/v1/chat/completions';
    
    // Log initialization status
    if (!this.mistralApiKey) {
      console.log('📝 Chatbot initialized without Mistral API key - using fallback responses');
    } else {
      console.log('🤖 Chatbot initialized with Mistral AI integration');
    }
  }

  // Main chatbot conversation handler
  async handleChat(req, res) {
    try {
      const { message, context = {} } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Check if the message is about venue booking
      const isBookingQuery = this.detectBookingIntent(message);

      if (isBookingQuery) {
        const venues = await this.getVenueRecommendations(message, context);
        
        // Convert venues to clickable buttons
        const venueButtons = venues.map(venue => ({
          text: `🏟️ ${venue.name} - ₹${venue.priceRange.average}/hr`,
          action: "book_venue",
          data: { 
            venueId: venue.id,
            venueName: venue.name,
            price: venue.priceRange.average,
            rating: venue.rating
          }
        }));

        return res.json({
          type: 'venue_suggestions',
          message: this.generateVenueResponse(message, venues),
          venues: venues,
          venueButtons: venueButtons,
          suggestions: [
            ...venueButtons,
            ...this.generateQuickActions().slice(0, 2) // Add a couple more search options
          ]
        });
      }

      // Handle general conversation with Mistral AI
      const aiResponse = await this.callMistralAI(message, context);
      
      res.json({
        type: 'conversation',
        message: aiResponse,
        suggestions: this.generateQuickActions()
      });

    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Provide a helpful fallback response instead of generic error
      res.json({
        type: 'conversation',
        message: this.getFallbackResponse(message || 'help'),
        suggestions: this.generateQuickActions()
      });
    }
  }

  // Detect if user wants to book a venue
  detectBookingIntent(message) {
    const bookingKeywords = [
      'book', 'booking', 'reserve', 'court', 'venue', 'facility',
      'badminton', 'tennis', 'cricket', 'football', 'basketball',
      'play', 'game', 'sport', 'indore', 'available', 'time slot'
    ];

    const lowerMessage = message.toLowerCase();
    return bookingKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Get venue recommendations based on user preferences
  async getVenueRecommendations(message, context) {
    try {
      const { sport, location, priceRange, date } = this.extractPreferences(message, context);
      
      console.log('🔍 Searching for venues with criteria:', { sport, location, priceRange });

      // Build basic query for facilities
      let query = { 
        isActive: true,
        'address.city': { $regex: 'indore', $options: 'i' }
      };

      console.log('🔍 Query being used:', query);

      // Get all facilities first (removed .lean() as it can cause populate issues)
      let facilities = await Facility.find(query)
        .populate('sports.sport')
        .limit(10);

      console.log('📊 Found facilities in database:', facilities.length);
      console.log('📊 Facility details:', facilities.map(f => ({ 
        name: f.name, 
        city: f.address?.city, 
        isActive: f.isActive,
        sportsCount: f.sports?.length || 0
      })));

      // If no facilities found, try without city filter
      if (facilities.length === 0) {
        console.log('🔄 No facilities found in Indore, searching all locations...');
        facilities = await Facility.find({ isActive: true })
          .populate('sports.sport')
          .limit(10);
        console.log('📊 Total facilities found:', facilities.length);
        
        // If still no facilities, check database connection
        if (facilities.length === 0) {
          console.log('🔄 Still no facilities, checking raw count...');
          const totalCount = await Facility.countDocuments({});
          console.log('📊 Total facilities in database (any status):', totalCount);
          
          if (totalCount === 0) {
            console.log('❌ Database appears to be empty! Run npm run seed');
            return [];
          }
        }
      }

      // If still no facilities, return empty with helpful message
      if (facilities.length === 0) {
        console.log('❌ No facilities found in database');
        return [];
      }

      // Filter by sport if specified
      let filteredFacilities = facilities;
      if (sport) {
        console.log('🎯 Filtering by sport:', sport);
        
        filteredFacilities = facilities.filter(facility => {
          if (!facility.sports || facility.sports.length === 0) return false;
          
          return facility.sports.some(s => {
            if (!s.sport || !s.sport.name) return false;
            return s.sport.name.toLowerCase().includes(sport.toLowerCase());
          });
        });
        
        console.log('🎯 Facilities matching sport:', filteredFacilities.length);
      }

      // If no matches for specific sport, return all facilities
      if (filteredFacilities.length === 0 && sport) {
        console.log('🔄 No sport-specific matches, returning all facilities');
        filteredFacilities = facilities;
      }

      // Take top 5 facilities
      const topFacilities = filteredFacilities.slice(0, 5);
      console.log('✅ Returning top facilities:', topFacilities.length);

      // Convert to plain objects for easier handling
      const plainFacilities = topFacilities.map(f => f.toObject ? f.toObject() : f);
      return plainFacilities.map(facility => this.formatVenueForResponse(facility, priceRange));
    } catch (error) {
      console.error('❌ Error getting venue recommendations:', error);
      return [];
    }
  }

  // Extract user preferences from message
  extractPreferences(message, context) {
    const lowerMessage = message.toLowerCase();
    
    const sports = ['badminton', 'tennis', 'cricket', 'football', 'basketball', 'squash'];
    const sport = sports.find(s => lowerMessage.includes(s));
    
    const priceRange = this.extractPriceRange(lowerMessage);
    const location = lowerMessage.includes('indore') ? 'indore' : context.location;
    const date = this.extractDate(lowerMessage) || context.date;

    return { sport, location, priceRange, date };
  }

  // Extract price preferences
  extractPriceRange(message) {
    if (message.includes('cheap') || message.includes('budget') || message.includes('affordable')) {
      return { min: 0, max: 500 };
    }
    if (message.includes('premium') || message.includes('luxury') || message.includes('high-end')) {
      return { min: 1000, max: 5000 };
    }
    if (message.includes('moderate') || message.includes('medium')) {
      return { min: 500, max: 1000 };
    }
    return null;
  }

  // Extract date from message (basic implementation)
  extractDate(message) {
    const dateKeywords = ['today', 'tomorrow', 'weekend', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const found = dateKeywords.find(keyword => message.includes(keyword));
    
    if (found) {
      const date = new Date();
      switch(found) {
        case 'today': return date;
        case 'tomorrow': 
          date.setDate(date.getDate() + 1);
          return date;
        case 'weekend':
          // Find next Saturday
          const daysUntilSaturday = (6 - date.getDay()) % 7;
          date.setDate(date.getDate() + daysUntilSaturday);
          return date;
        default: return null;
      }
    }
    return null;
  }

  // Format venue data for response
  formatVenueForResponse(facility, priceRange) {
    try {
      // Handle both populated and non-populated facility objects
      const courts = [];
      let priceInfo = { min: 500, max: 1500, average: 800 };
      
      if (facility.sports && facility.sports.length > 0) {
        facility.sports.forEach(sport => {
          if (sport.courts && sport.courts.length > 0) {
            sport.courts.forEach(court => {
              // Filter by price range if specified
              let includesCourt = true;
              if (priceRange && typeof priceRange === 'string') {
                if (priceRange === 'budget' && court.hourlyRate > 500) includesCourt = false;
                if (priceRange === 'moderate' && (court.hourlyRate <= 500 || court.hourlyRate > 1000)) includesCourt = false;
                if (priceRange === 'premium' && court.hourlyRate <= 1000) includesCourt = false;
              }
              
              if (includesCourt) {
                courts.push({
                  id: court._id,
                  name: court.name,
                  sport: sport.sport ? sport.sport.name : 'Sport',
                  hourlyRate: court.hourlyRate || 800,
                  type: court.type || 'indoor',
                  surface: court.surface || 'Standard',
                  amenities: court.amenities || []
                });
              }
            });
          }
        });
        
        // Calculate actual price range from courts
        if (courts.length > 0) {
          const rates = courts.map(c => c.hourlyRate);
          priceInfo = {
            min: Math.min(...rates),
            max: Math.max(...rates),
            average: Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length)
          };
        }
      }

      // Generate helpful tags
      const tags = [];
      if (facility.rating && facility.rating.average >= 4.5) tags.push('⭐ Top Rated');
      if (facility.rating && facility.rating.average >= 4.0) tags.push('✅ Highly Rated');
      if (priceInfo.average <= 500) tags.push('💰 Budget Friendly');
      else if (priceInfo.average > 1000) tags.push('👑 Premium');
      else tags.push('💸 Good Value');
      if (facility.isVerified) tags.push('✓ Verified');
      if (facility.address && facility.address.city && 
          facility.address.city.toLowerCase().includes('indore')) {
        tags.push('📍 Indore');
      }

      return {
        id: facility._id,
        name: facility.name || 'Sports Facility',
        description: facility.description || 'Premium sports facility with modern amenities',
        address: facility.address ? 
          `${facility.address.street || ''}, ${facility.address.city || 'Indore'}`.trim() : 
          'Indore, India',
        rating: facility.rating ? facility.rating.average || 4.2 : 4.2,
        ratingCount: facility.rating ? facility.rating.count || 25 : 25,
        courts: courts.length > 0 ? courts : [
          {
            id: 'default-1',
            name: 'Court 1',
            sport: 'Multi-Sport',
            hourlyRate: 800,
            type: 'indoor',
            surface: 'Standard',
            amenities: ['Lighting', 'Parking']
          }
        ],
        contact: facility.contactInfo || {},
        operatingHours: facility.operatingHours || {},
        images: facility.images || [],
        amenities: facility.amenities || [],
        priceRange: priceInfo,
        tags: tags.slice(0, 4),
        bookingUrl: `/book/${facility._id}`,
        facilityUrl: `/facilities/${facility._id}`
      };
    } catch (error) {
      console.error('Error formatting venue:', error);
      // Return a fallback venue format
      return {
        id: facility._id,
        name: facility.name || 'Sports Facility',
        description: 'Sports facility in Indore',
        address: 'Indore, India',
        rating: 4.0,
        ratingCount: 10,
        courts: [{
          id: 'default',
          name: 'Court 1',
          sport: 'Multi-Sport',
          hourlyRate: 800,
          type: 'indoor'
        }],
        priceRange: { min: 500, max: 1200, average: 800 },
        tags: ['💸 Good Value', '📍 Indore'],
        bookingUrl: `/book/${facility._id}`,
        facilityUrl: `/facilities/${facility._id}`
      };
    }
  }

  // Generate helpful tags for venues
  generateVenueTags(facility, priceInfo) {
    const tags = [];
    
    // Rating-based tags
    if (facility.rating.average >= 4.5) tags.push('⭐ Top Rated');
    if (facility.rating.average >= 4.0) tags.push('✅ Highly Rated');
    
    // Price-based tags
    if (priceInfo.average <= 500) tags.push('💰 Budget Friendly');
    else if (priceInfo.average > 1000) tags.push('👑 Premium');
    else tags.push('💸 Good Value');
    
    // Feature-based tags
    if (facility.isVerified) tags.push('✓ Verified');
    if (facility.amenities && facility.amenities.length > 3) tags.push('🏆 Well Equipped');
    
    // Location-based tags
    if (facility.address && facility.address.city && 
        facility.address.city.toLowerCase().includes('indore')) {
      tags.push('📍 Indore');
    }
    
    return tags.slice(0, 4); // Limit to 4 tags
  }

  // Get fallback response when API fails
  getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Sport-specific responses
    if (lowerMessage.includes('badminton')) {
      return "I can help you find badminton courts in Indore! Try clicking the '🏸 Find Badminton Courts' button below for instant results.";
    }
    if (lowerMessage.includes('tennis')) {
      return "Looking for tennis courts? I have several great options in Indore! Click '🎾 Tennis Courts Near Me' to see available venues.";
    }
    if (lowerMessage.includes('football') || lowerMessage.includes('soccer')) {
      return "Football grounds available in Indore! Click '⚽ Football Grounds' to explore your options.";
    }
    if (lowerMessage.includes('basketball')) {
      return "Basketball courts are ready for you! Try '🏀 Basketball Courts' for the best venues in Indore.";
    }
    
    // Budget-related responses
    if (lowerMessage.includes('cheap') || lowerMessage.includes('budget')) {
      return "Looking for budget-friendly options? Click '💰 Budget-Friendly Options' below to find venues under ₹500/hour!";
    }
    if (lowerMessage.includes('premium') || lowerMessage.includes('luxury')) {
      return "Want premium facilities? Try '⭐ Top Rated Venues' to see our highest-rated sports facilities in Indore!";
    }
    
    // General responses
    return "I'm here to help you find the perfect sports venue in Indore! Use the quick action buttons below or tell me what sport you'd like to play.";
  }

  // Call Mistral AI for general conversation
  async callMistralAI(message, context) {
    try {
      if (!this.mistralApiKey) {
        return this.getFallbackResponse(message);
      }

      const systemPrompt = `You are a helpful AI assistant for QuickCourt, a sports venue booking platform in Indore, India. 
      Your main role is to help users find and book sports venues. You should be friendly, knowledgeable about sports, 
      and always try to guide conversations toward helping users find the perfect venue for their needs.
      
      Key information:
      - You help book venues in Indore for various sports like badminton, tennis, cricket, football, basketball
      - You can suggest venues based on budget, location, sport type, and timing preferences
      - Always be enthusiastic about sports and encourage users to stay active
      - If users ask about non-sports topics, gently redirect them back to venue booking
      
      Keep responses concise and helpful.`;

      const response = await axios.post(this.mistralBaseUrl, {
        model: 'mistral-medium-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.mistralApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Mistral AI error:', error);
      return "I'm here to help you find the perfect sports venue in Indore! What sport would you like to play today?";
    }
  }

  // Generate AI response for venue suggestions
  generateVenueResponse(message, venues) {
    if (venues.length === 0) {
      return "I couldn't find specific venues for your search. Try seeding the database first with sample venues, or search for different sports like badminton, tennis, or basketball.";
    }

    const venueCount = venues.length;
    const sports = [...new Set(venues.flatMap(v => v.courts.map(c => c.sport)))];
    
    let response = `🎉 Found ${venueCount} venue${venueCount > 1 ? 's' : ''} near you in Indore`;
    
    if (sports.length > 0) {
      response += ` for ${sports.join(', ')}`;
    }
    
    response += '! Click any venue below to book instantly:';
    
    return response;
  }

  // Generate quick action suggestions
  generateQuickActions(includeSeeder = false) {
    const actions = [
      { text: "🏸 Find Badminton Courts", action: "search_sport", data: { sport: "badminton" } },
      { text: "🎾 Tennis Courts Near Me", action: "search_sport", data: { sport: "tennis" } },
      { text: "⚽ Football Grounds", action: "search_sport", data: { sport: "football" } },
      { text: "🏀 Basketball Courts", action: "search_sport", data: { sport: "basketball" } },
      { text: "💰 Budget-Friendly Options", action: "search_price", data: { range: "budget" } },
      { text: "⭐ Top Rated Venues", action: "search_rating", data: { minRating: 4 } }
    ];

    if (includeSeeder) {
      actions.unshift({ text: "🌱 Seed Database", action: "seed_database", data: {} });
    }

    return actions;
  }

  // Get available time slots for a specific venue
  async getAvailableSlots(req, res) {
    try {
      const { facilityId, courtId, date } = req.query;

      if (!facilityId || !courtId || !date) {
        return res.status(400).json({ error: 'Facility ID, Court ID, and date are required' });
      }

      const facility = await Facility.findById(facilityId);
      if (!facility) {
        return res.status(404).json({ error: 'Facility not found' });
      }

      // Find the specific court
      const court = facility.sports
        .flatMap(sport => sport.courts)
        .find(court => court._id.toString() === courtId);

      if (!court) {
        return res.status(404).json({ error: 'Court not found' });
      }

      // Get operating hours for the requested date
      const requestDate = new Date(date);
      const dayName = requestDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const daySchedule = facility.operatingHours[dayName];

      if (!daySchedule || !daySchedule.isOpen) {
        return res.json({ availableSlots: [], message: 'Facility is closed on this day' });
      }

      // Generate time slots (this is a basic implementation)
      const slots = this.generateTimeSlots(daySchedule.open, daySchedule.close, court.hourlyRate);
      
      res.json({
        availableSlots: slots,
        courtInfo: {
          name: court.name,
          hourlyRate: court.hourlyRate,
          type: court.type,
          amenities: court.amenities
        }
      });

    } catch (error) {
      console.error('Error getting available slots:', error);
      res.status(500).json({ error: 'Failed to get available slots' });
    }
  }

  // Generate time slots between open and close times
  generateTimeSlots(openTime, closeTime, hourlyRate) {
    const slots = [];
    const open = new Date(`2000-01-01 ${openTime}`);
    const close = new Date(`2000-01-01 ${closeTime}`);
    
    let current = new Date(open);
    while (current < close) {
      const next = new Date(current.getTime() + 60 * 60 * 1000); // Add 1 hour
      if (next <= close) {
        slots.push({
          startTime: current.toTimeString().substring(0, 5),
          endTime: next.toTimeString().substring(0, 5),
          price: hourlyRate,
          available: Math.random() > 0.3 // Random availability for demo
        });
      }
      current = next;
    }
    
    return slots;
  }
}

const chatbotController = new ChatbotController();

module.exports = {
  handleChat: chatbotController.handleChat.bind(chatbotController),
  getAvailableSlots: chatbotController.getAvailableSlots.bind(chatbotController)
};
