// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        try {
          const res = await api.get("/api/users/me");
          setUser(res.data);
          setIsAuthenticated(true);
        } catch (err) {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (userData) => {
    try {
      const res = await api.post("/api/users/register", userData);

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);

      toast.success("Registration successful!");
      return true;
    } catch (err) {
      const message =
        err.response && err.response.data.message
          ? err.response.data.message
          : "Registration failed";

      toast.error(message);
      return false;
    }
  };

  // Login user
  const login = async (userData) => {
    try {
      const res = await api.post("/api/users/login", userData);

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);

      toast.success("Login successful!");
      return true;
    } catch (err) {
      const message =
        err.response && err.response.data.message
          ? err.response.data.message
          : "Login failed";

      toast.error(message);
      return false;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.common["Authorization"];
    toast.info("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
