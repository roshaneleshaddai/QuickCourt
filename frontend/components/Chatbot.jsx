'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, MapPin, Star, Clock, DollarSign } from 'lucide-react';
import { chatbotAPI } from '@/lib/api';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm your QuickCourt assistant. I can help you find and book the perfect sports venue across India. What would you like to play today?",
      timestamp: null, // Will be set after mount to prevent hydration issues
      suggestions: [
        { text: "🏸 Find Badminton Courts", action: "search_sport", data: { sport: "badminton" } },
        { text: "🎾 Tennis Courts Near Me", action: "search_sport", data: { sport: "tennis" } },
        { text: "⚽ Football Grounds", action: "search_sport", data: { sport: "football" } },
        { text: "💰 Budget-Friendly Options", action: "search_price", data: { range: "budget" } }
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && suggestions.length === 0) {
      loadInitialSuggestions();
    }
  }, [isOpen]);

  // Set initial message timestamp after mount to prevent hydration issues
  useEffect(() => {
    if (messages[0] && messages[0].timestamp === null) {
      setMessages(prev => prev.map((msg, index) => 
        index === 0 ? { ...msg, timestamp: new Date() } : msg
      ));
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadInitialSuggestions = async () => {
    try {
      const data = await chatbotAPI.getSuggestions();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      // Set default suggestions if API fails
      setSuggestions([
        { text: "🏸 Find Badminton Courts", action: "search_sport", data: { sport: "badminton" } },
        { text: "🎾 Tennis Courts Near Me", action: "search_sport", data: { sport: "tennis" } },
        { text: "⚽ Football Grounds", action: "search_sport", data: { sport: "football" } },
        { text: "💰 Budget-Friendly Options", action: "search_price", data: { range: "budget" } }
      ]);
    }
  };

  const sendMessage = async (message, context = {}) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const data = await chatbotAPI.sendMessage(message, context);

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.message,
        timestamp: new Date(),
        venues: data.venues,
        venueButtons: data.venueButtons,
        suggestions: data.suggestions,
        messageType: data.type
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      let errorMsg = "I'm having trouble connecting to the server. ";
      
      if (error.message.includes('Network error')) {
        errorMsg += "Please make sure the backend server is running.";
      } else if (error.message.includes('Route not found')) {
        errorMsg += "The chatbot service is not available yet.";
      } else {
        errorMsg += "Please try again in a moment.";
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: errorMsg,
        timestamp: new Date(),
        suggestions: [
          { text: "🏸 Find Badminton Courts", action: "search_sport", data: { sport: "badminton" } },
          { text: "🎾 Tennis Courts Near Me", action: "search_sport", data: { sport: "tennis" } },
          { text: "💰 Budget-Friendly Options", action: "search_price", data: { range: "budget" } }
        ]
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (suggestion) => {
    if (suggestion.action === 'book_venue' && suggestion.data.venueId) {
      // Show booking confirmation message first
      const bookingMessage = {
        id: Date.now(),
        type: 'user',
        content: suggestion.text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, bookingMessage]);

      const confirmMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `🎯 Redirecting you to book ${suggestion.data.venueName} at ₹${suggestion.data.price}/hr (Rating: ⭐${suggestion.data.rating}). Opening booking page...`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmMessage]);

      // Direct booking redirect
      setTimeout(() => {
        window.open(`/book/${suggestion.data.venueId}`, '_blank');
      }, 1000);
      return;
    }

    // Add user message to show what button was clicked
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: suggestion.text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      console.log('Quick action clicked:', suggestion);
      
      // Use the centralized API function
      const data = await chatbotAPI.quickAction(suggestion.action, suggestion.data);

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.message,
        timestamp: new Date(),
        venues: data.venues,
        venueButtons: data.venueButtons,
        suggestions: data.suggestions,
        messageType: data.type
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Quick action error:', error);
      
      // Fallback to regular chat if quick action fails
      await sendMessage(suggestion.text, suggestion.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  const VenueCard = ({ venue }) => (
    <div className="bg-white border border-green-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-800 text-sm">{venue.name}</h4>
        <div className="flex items-center text-yellow-500 text-xs">
          <Star className="w-3 h-3 fill-current mr-1" />
          <span className="font-medium">{venue.rating?.toFixed(1) || '4.0'}</span>
          <span className="text-gray-600 ml-1 font-medium">({venue.ratingCount || 0})</span>
        </div>
      </div>
      
      <div className="flex items-center text-gray-700 text-xs mb-2">
        <MapPin className="w-3 h-3 mr-1" />
        <span className="font-medium">{venue.address}</span>
      </div>

      {/* Venue Tags */}
      {venue.tags && venue.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {venue.tags.map((tag, index) => (
            <span 
              key={index}
              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Price Range Summary */}
      {venue.priceRange && venue.priceRange.average > 0 && (
        <div className="flex items-center text-green-700 text-xs mb-2">
          <DollarSign className="w-3 h-3 mr-1" />
          <span className="font-medium">₹{venue.priceRange.min}-{venue.priceRange.max}/hr (Avg: ₹{venue.priceRange.average})</span>
        </div>
      )}

      {venue.courts && venue.courts.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-700 mb-1 font-medium">Available Courts ({venue.courts.length}):</p>
          <div className="space-y-1">
            {venue.courts.slice(0, 2).map((court, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-gray-800 font-medium">
                  {court.name} 
                  <span className="text-green-600 ml-1">({court.sport})</span>
                </span>
                <div className="flex items-center text-green-700 font-medium">
                  <span>₹{court.hourlyRate}/hr</span>
                </div>
              </div>
            ))}
            {venue.courts.length > 2 && (
              <p className="text-xs text-gray-600 font-medium">+{venue.courts.length - 2} more courts</p>
            )}
          </div>
        </div>
      )}

      {/* Recommendation Score (for debugging/premium users) */}
      {venue.recommendationScore && process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mb-2 font-medium">
          Match Score: {venue.recommendationScore}/100
        </div>
      )}

      <div className="flex gap-2">
        <button 
          onClick={() => window.open(venue.facilityUrl || `/facilities/${venue.id}`, '_blank')}
          className="flex-1 bg-gray-600 text-white text-xs py-2 px-2 rounded hover:bg-gray-700 transition-colors font-medium"
        >
          View Details
        </button>
        <button 
          onClick={() => window.open(venue.bookingUrl || `/book/${venue.id}`, '_blank')}
          className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white text-xs py-2 px-2 rounded hover:from-green-700 hover:to-green-600 transition-all shadow-sm font-medium"
        >
          Book Now
        </button>
      </div>
    </div>
  );

  const MessageBubble = ({ message }) => (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-xs ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          message.type === 'user' ? 'bg-green-600 ml-2' : 'bg-green-500 mr-2'
        }`}>
          {message.type === 'user' ? 
            <User className="w-4 h-4 text-white" /> : 
            <Bot className="w-4 h-4 text-white" />
          }
        </div>
        
        <div className={`p-3 rounded-lg ${
          message.type === 'user' 
            ? 'bg-green-600 text-white' 
            : 'bg-white border border-green-200 text-gray-800 shadow-sm'
        }`}>
          <p className="text-sm font-medium">{message.content}</p>
          
          {/* Venue Buttons - Priority display for booking */}
          {message.venueButtons && message.venueButtons.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-700 font-semibold">🏟️ Available Venues:</p>
              {message.venueButtons.map((venue, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(venue)}
                  className="w-full text-left bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 hover:border-green-500 p-3 rounded-lg transition-all hover:shadow-md text-sm"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{venue.text}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        ⭐ {venue.data.rating}
                      </span>
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-medium">
                        Book Now →
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Regular venue cards (fallback) */}
          {message.venues && message.venues.length > 0 && !message.venueButtons && (
            <div className="mt-3 space-y-2">
              {message.venues.map((venue, index) => (
                <VenueCard key={index} venue={venue} />
              ))}
            </div>
          )}
          
          {/* Regular suggestions */}
          {message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {message.suggestions.filter(s => s.action !== 'book_venue').map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(suggestion)}
                  className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hover:bg-green-200 transition-colors font-medium"
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-2 font-medium">
            {message.timestamp ? message.timestamp.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            }) : ''}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-full shadow-lg hover:from-green-700 hover:to-green-600 transition-all duration-300 z-40 flex items-center justify-center ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
      >
        <MessageCircle className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
      </button>

      {/* Chatbot Window */}
      <div className={`fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl z-50 flex flex-col transition-all duration-300 transform ${
        isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      }`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="w-6 h-6 mr-2" />
            <div>
              <h3 className="font-semibold">QuickCourt Assistant</h3>
              <p className="text-xs opacity-90">Find your perfect venue</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-green-700 p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="flex">
                <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-gray-600" />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        {suggestions.length > 0 && messages.length === 1 && (
          <div className="p-4 border-t border-green-200">
            <p className="text-xs text-gray-700 font-medium mb-2">💡 Quick suggestions:</p>
            <div className="space-y-1">
              {suggestions[0]?.suggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left text-xs p-2 bg-green-50 hover:bg-green-100 rounded transition-colors text-green-800 font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-green-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about venues, sports, or booking..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage(inputMessage)}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-gradient-to-r from-green-600 to-green-500 text-white p-2 rounded-lg hover:from-green-700 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
