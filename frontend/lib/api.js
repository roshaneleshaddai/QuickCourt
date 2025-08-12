const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  console.log("API Call:", {
    endpoint,
    fullUrl: url,
    options,
    baseUrl: API_BASE_URL,
  });

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem("token");
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  // If body is FormData, remove Content-Type header to let browser set it with boundary
  if (options.body instanceof FormData) {
    delete defaultOptions.headers["Content-Type"];
  }

  try {
    console.log("Making API request to:", url);
    const response = await fetch(url, defaultOptions);

    console.log("API Response:", {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      ok: response.ok,
    });

    if (!response.ok) {
      let errorData = {};
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        // Try to parse error response as JSON
        const errorText = await response.text();
        if (errorText) {
          try {
            errorData = JSON.parse(errorText);
            errorMessage =
              errorData.error ||
              errorData.details ||
              errorData.message ||
              errorMessage;
          } catch (parseError) {
            // If JSON parsing fails, use the raw text
            errorData = { rawError: errorText };
            errorMessage = errorText || errorMessage;
          }
        }
      } catch (textError) {
        console.warn("Could not read error response text:", textError);
      }

      console.error("API Error Details:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        errorData,
        errorMessage,
      });
      throw new Error(
        errorData.message ||
          errorData.error ||
          errorData.details ||
          `HTTP error! status: ${response.status}`
      );

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("API Response Data:", data);
    return data;
  } catch (error) {
    console.error("API call failed:", error);

    // If it's a network error (like server not running), provide a helpful message
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        `Network error: Unable to connect to server at ${API_BASE_URL}. Please check if the backend server is running.`
      );
    }

    throw error;
  }
}

// Auth API calls
export const authAPI = {
  register: (userData) =>
    apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  changePassword: (passwordData) =>
    apiCall("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(passwordData),
    }),

  forgotPassword: (email) =>
    apiCall("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // Send OTP for verification
  sendOTP: (email) =>
    apiCall("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // Verify OTP
  verifyOTP: (email, otp) =>
    apiCall("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  // Check if email exists
  checkEmail: (email) =>
    apiCall("/auth/check-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // Reset password with OTP
  resetPassword: (email, otp, password) =>
    apiCall("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, password }),
    }),
};

// User API calls
export const userAPI = {
  getProfile: () => apiCall("/users/profile"),

  updateProfile: (profileData) =>
    apiCall("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),

  updatePreferences: (preferences) =>
    apiCall("/users/preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    }),

  getBookings: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/users/bookings?${queryString}`);
  },

  // Get user by ID (admin only)
  getById: (id) => apiCall(`/users/${id}`),

  // Update user status (admin only)
  updateStatus: (id, isActive, adminNotes) =>
    apiCall(`/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ isActive, adminNotes }),
    }),

  // Get user's booking history (admin only)
  getBookingsByUserId: (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/users/${id}/bookings?${queryString}`);
  },
};

// Facilities API calls
export const facilitiesAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/facilities?${queryString}`);
  },

  getById: (id) => apiCall(`/facilities/${id}`),

  create: (facilityData) =>
    apiCall("/facilities", {
      method: "POST",
      body: JSON.stringify(facilityData),
    }),

  update: (id, updateData) =>
    apiCall(`/facilities/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    }),

  delete: (id) =>
    apiCall(`/facilities/${id}`, {
      method: "DELETE",
    }),

  checkAvailability: (id, date) =>
    apiCall(`/facilities/${id}/availability?date=${date}`),

  getBlockedTimeSlots: (id) => apiCall(`/facilities/${id}/blocked-slots`),

  // Get facilities by owner
  getByOwner: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/facilities/my-facilities?${queryString}`);
  },

  // Get facilities by sport
  getBySport: (sportId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/facilities/sport/${sportId}?${queryString}`);
  },

  // Search facilities
  search: (query, params = {}) => {
    const searchParams = new URLSearchParams({
      q: query,
      ...params,
    }).toString();
    return apiCall(`/facilities/search?${searchParams}`);
  },

  // Get nearby facilities
  getNearby: (latitude, longitude, radius = 10, params = {}) => {
    const searchParams = new URLSearchParams({
      lat: latitude,
      lng: longitude,
      radius,
      ...params,
    }).toString();
    return apiCall(`/facilities/nearby?${searchParams}`);
  },
};

// Sports API calls
export const sportsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/sports?${queryString}`);
  },

  getById: (id) => apiCall(`/sports/${id}`),

  getCategories: () => apiCall("/sports/categories"),

  create: (sportData) =>
    apiCall("/sports", {
      method: "POST",
      body: JSON.stringify(sportData),
    }),

  update: (id, updateData) =>
    apiCall(`/sports/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    }),

  delete: (id) =>
    apiCall(`/sports/${id}`, {
      method: "DELETE",
    }),

  updatePopularity: (id, increment) =>
    apiCall(`/sports/${id}/popularity`, {
      method: "PUT",
      body: JSON.stringify({ increment }),
    }),

  // Get sports by category
  getByCategory: (category, params = {}) => {
    const queryString = new URLSearchParams({ category, ...params }).toString();
    return apiCall(`/sports/category/${category}?${queryString}`);
  },

  // Get popular sports
  getPopular: (limit = 10) => apiCall(`/sports/popular?limit=${limit}`),

  // Search sports
  search: (query, params = {}) => {
    const searchParams = new URLSearchParams({
      q: query,
      ...params,
    }).toString();
    return apiCall(`/sports/search?${searchParams}`);
  },
};

// Bookings API calls
export const bookingsAPI = {
  create: (bookingData) =>
    apiCall("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    }),

  createBooking: (bookingData) =>
    apiCall("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    }),

  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/bookings?${queryString}`);
  },

  getById: (id) => apiCall(`/bookings/${id}`),

  update: (id, updateData) =>
    apiCall(`/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    }),

  delete: (id) =>
    apiCall(`/bookings/${id}`, {
      method: "DELETE",
    }),

  checkFacilityAvailability: (facilityId, date) =>
    apiCall(`/bookings/facility/${facilityId}/availability?date=${date}`),

  getFacilityAvailability: (facilityId, date) =>
    apiCall(`/facilities/${facilityId}/availability?date=${date}`),

  // Cancel booking
  cancel: (id, reason = "") =>
    apiCall(`/bookings/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    }),

  // Get user's upcoming bookings
  getUpcoming: (params = {}) => {
    const queryString = new URLSearchParams({
      status: "confirmed",
      ...params,
    }).toString();
    return apiCall(`/bookings?${queryString}`);
  },

  // Get user's past bookings
  getPast: (params = {}) => {
    const queryString = new URLSearchParams({
      status: "completed",
      ...params,
    }).toString();
    return apiCall(`/bookings?${queryString}`);
  },

  // Get booking statistics
  getStats: () => apiCall("/bookings/stats"),
};

// Facility Owner API calls
export const facilityOwnerAPI = {
  // Get all facilities owned by the current user
  getMyFacilities: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/facilities/my-facilities?${queryString}`);
  },

  // Create a new facility
  create: (facilityData) =>
    apiCall("/facilities", {
      method: "POST",
      body: JSON.stringify(facilityData),
    }),

  // Update a facility
  update: (id, updateData) =>
    apiCall(`/facilities/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    }),

  // Delete a facility
  delete: (id) =>
    apiCall(`/facilities/${id}`, {
      method: "DELETE",
    }),

  // Get dashboard statistics for facility owner
  getDashboardStats: () =>
    apiCall("/facilities/facility-owner/dashboard/stats"),

  // Get all bookings for owner's facilities
  getMyFacilityBookings: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/facilities/facility-owner/bookings?${queryString}`);
  },

  // Update booking status
  updateBookingStatus: (bookingId, status, notes = "") =>
    apiCall(`/facilities/facility-owner/bookings/${bookingId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, notes }),
    }),

  // Get facility availability and blocked slots
  getFacilityAvailability: (facilityId, date) =>
    apiCall(
      `/facilities/facility-owner/${facilityId}/availability?date=${date}`
    ),

  // Get all blocked time slots for a facility
  getBlockedTimeSlots: (facilityId) =>
    apiCall(`/facilities/facility-owner/${facilityId}/blocked-slots`),

  // Block/unblock time slots
  blockTimeSlot: (facilityId, courtId, date, startTime, endTime, reason = "") =>
    apiCall(
      `/facilities/facility-owner/${facilityId}/courts/${courtId}/block`,
      {
        method: "POST",
        body: JSON.stringify({ date, startTime, endTime, reason }),
      }
    ),

  // Unblock time slot
  unblockTimeSlot: (facilityId, courtId, blockId) =>
    apiCall(
      `/facilities/facility-owner/${facilityId}/courts/${courtId}/unblock/${blockId}`,
      {
        method: "DELETE",
      }
    ),

  // Get facility earnings and reports
  getFacilityEarnings: (facilityId, startDate, endDate) => {
    const params = new URLSearchParams({ startDate, endDate }).toString();
    return apiCall(
      `/facility-owner/facilities/${facilityId}/earnings?${params}`
    );
  },

  // Update facility operating hours
  updateOperatingHours: (facilityId, operatingHours) =>
    apiCall(`/facility-owner/facilities/${facilityId}/operating-hours`, {
      method: "PUT",
      body: JSON.stringify({ operatingHours }),
    }),

  // Add new court to facility
  addCourt: (facilityId, sportId, courtData) =>
    apiCall(
      `/facility-owner/facilities/${facilityId}/sports/${sportId}/courts`,
      {
        method: "POST",
        body: JSON.stringify(courtData),
      }
    ),

  // Update court details
  updateCourt: (facilityId, sportId, courtId, courtData) =>
    apiCall(
      `/facility-owner/facilities/${facilityId}/sports/${sportId}/courts/${courtId}`,
      {
        method: "PUT",
        body: JSON.stringify(courtData),
      }
    ),

  // Delete court
  deleteCourt: (facilityId, sportId, courtId) =>
    apiCall(
      `/facility-owner/facilities/${facilityId}/sports/${sportId}/courts/${courtId}`,
      {
        method: "DELETE",
      }
    ),
};

// Admin API calls
export const adminAPI = {
  // Dashboard statistics
  getDashboardStats: () => apiCall("/admin/dashboard/stats"),

  // Facility approval management
  getPendingFacilities: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/admin/facilities/pending?${queryString}`);
  },

  approveFacility: (facilityId, status, adminNotes) =>
    apiCall(`/admin/facilities/${facilityId}/approve`, {
      method: "PUT",
      body: JSON.stringify({ status, adminNotes }),
    }),

  // User management
  getUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/admin/users?${queryString}`);
  },

  updateUserStatus: (userId, isActive, adminNotes) =>
    apiCall(`/admin/users/${userId}/status`, {
      method: "PUT",
      body: JSON.stringify({ isActive, adminNotes }),
    }),

  getUserBookings: (userId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/admin/users/${userId}/bookings?${queryString}`);
  },

  // Reports and moderation
  getReports: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/admin/reports?${queryString}`);
  },

  // Sports management
  getSports: () => apiCall("/admin/sports"),

  // Analytics and charts
  getBookingTrends: (period = "7d") =>
    apiCall(`/admin/analytics/booking-trends?period=${period}`),

  getUserRegistrationTrends: (period = "7d") =>
    apiCall(`/admin/analytics/user-registration-trends?period=${period}`),

  getFacilityApprovalTrends: (period = "30d") =>
    apiCall(`/admin/analytics/facility-approval-trends?period=${period}`),

  getSportsActivity: (period = "30d") =>
    apiCall(`/admin/analytics/sports-activity?period=${period}`),

  getEarningsSimulation: (period = "30d") =>
    apiCall(`/admin/analytics/earnings-simulation?period=${period}`),
};

// Reviews API calls
export const reviewsAPI = {
  // Get all reviews for a facility
  getFacilityReviews: (facilityId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/reviews/facility/${facilityId}?${queryString}`);
  },

  // Create a new review
  create: (reviewData) => {
    console.log("🚀 reviewsAPI.create called with:", reviewData);
    return apiCall("/reviews", {
      method: "POST",
      body: JSON.stringify(reviewData),
    });
  },

  // Update user's own review
  update: (id, updateData) =>
    apiCall(`/reviews/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    }),

  // Delete user's own review
  delete: (id) =>
    apiCall(`/reviews/${id}`, {
      method: "DELETE",
    }),

  // Get user's own reviews
  getMyReviews: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/reviews/my-reviews?${queryString}`);
  },

  // Get review by ID
  getById: (id) => apiCall(`/reviews/${id}`),

  // Get review statistics for a facility
  getFacilityStats: (facilityId) =>
    apiCall(`/reviews/facility/${facilityId}/stats`),
};

// Health check
export const healthCheck = () => apiCall("/health");

// Utility functions
export const apiUtils = {
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem("token");
    return !!token;
  },

  // Get auth token
  getToken: () => localStorage.getItem("token"),

  // Set auth token
  setToken: (token) => localStorage.setItem("token", token),

  // Remove auth token
  removeToken: () => localStorage.removeItem("token"),

  // Clear all auth data
  clearAuth: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // Get user data from localStorage
  getUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Set user data in localStorage
  setUser: (user) => localStorage.setItem("user", JSON.stringify(user)),

  // Check if user has specific role
  hasRole: (role) => {
    const user = apiUtils.getUser();
    return user && user.role === role;
  },

  // Check if user is admin
  isAdmin: () => apiUtils.hasRole("admin"),

  // Check if user is facility owner
  isFacilityOwner: () => apiUtils.hasRole("facility_owner"),

  // Check if user is regular user
  isUser: () => apiUtils.hasRole("user"),
};

// Error handling utilities
export const apiErrorHandler = {
  // Handle common API errors
  handleError: (error, fallbackMessage = "Something went wrong") => {
    console.error("API Error:", error);

    if (error.message.includes("Network error")) {
      return "Unable to connect to server. Please check your internet connection.";
    }

    if (error.message.includes("401")) {
      return "Authentication required. Please log in again.";
    }

    if (error.message.includes("403")) {
      return "Access denied. You don't have permission to perform this action.";
    }

    if (error.message.includes("404")) {
      return "Resource not found.";
    }

    if (error.message.includes("500")) {
      return "Server error. Please try again later.";
    }

    return error.message || fallbackMessage;
  },

  // Check if error is authentication related
  isAuthError: (error) => {
    return error.message.includes("401") || error.message.includes("403");
  },

  // Check if error is network related
  isNetworkError: (error) => {
    return (
      error.message.includes("Network error") || error.message.includes("fetch")
    );
  },
};

// Chatbot API calls
export const chatbotAPI = {
  // Get chatbot suggestions
  getSuggestions: () => apiCall("/chatbot/suggestions"),

  // Send chat message
  sendMessage: (message, context = {}) =>
    apiCall("/chatbot/chat", {
      method: "POST",
      body: JSON.stringify({ message, context }),
    }),

  // Handle quick actions
  quickAction: (action, data = {}) =>
    apiCall("/chatbot/quick-action", {
      method: "POST",
      body: JSON.stringify({ action, data }),
    }),

  // Get available time slots for a venue
  getAvailableSlots: (facilityId, courtId, date) => {
    const params = new URLSearchParams({
      facilityId,
      courtId,
      date,
    }).toString();
    return apiCall(`/chatbot/slots?${params}`);
  },

  // Get popular venues
  getPopularVenues: () => apiCall("/chatbot/popular-venues"),

  // Seed database with sample data
  seedDatabase: () =>
    apiCall("/chatbot/seed-database", {
      method: "POST",
    }),
};

// Image Upload API calls
export const uploadAPI = {
  // Upload single image
  uploadSingle: (imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    return apiCall("/upload/single", {
      method: "POST",
      body: formData,
    });
  },

  // Upload multiple images
  uploadMultiple: (imageFiles) => {
    const formData = new FormData();
    imageFiles.forEach((file, index) => {
      formData.append("images", file);
    });

    return apiCall("/upload/multiple", {
      method: "POST",
      body: formData,
    });
  },

  // Delete image from Cloudinary
  deleteImage: (publicId) =>
    apiCall(`/upload/${publicId}`, {
      method: "DELETE",
    }),

  // Transform image URL
  transformImage: (imageUrl, transformations = {}) =>
    apiCall("/upload/transform", {
      method: "POST",
      body: JSON.stringify({ imageUrl, transformations }),
    }),

  // Get upload statistics
  getStats: () => apiCall("/upload/stats"),

  // Get user's uploads
  getMyUploads: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/upload/my-uploads?${queryString}`);
  },
};
