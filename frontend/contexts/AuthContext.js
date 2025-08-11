"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "@/lib/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);

      const { token: newToken, user: userData } = response;

      // Store in localStorage
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // Update state
      setToken(newToken);
      setUser(userData);

      toast.success("Login successful!");
      return { success: true };
    } catch (error) {
      toast.error(error.message || "Login failed");
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);

      const { token: newToken, user: newUser } = response;

      // Store in localStorage
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      // Update state
      setToken(newToken);
      setUser(newUser);

      toast.success("Registration successful!");
      return { success: true };
    } catch (error) {
      toast.error(error.message || "Registration failed");
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear state
    setToken(null);
    setUser(null);

    toast.success("Logged out successfully");
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === "admin";
  const isFacilityOwner = user?.role === "facility_owner";

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    isFacilityOwner,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
