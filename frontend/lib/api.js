const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

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
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("API call failed:", error);
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
};

// Health check
export const healthCheck = () => apiCall("/health");
