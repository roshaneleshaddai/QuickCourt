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

// Health check
export const healthCheck = () => apiCall("/health");
