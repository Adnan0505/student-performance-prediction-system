import React, { createContext, useContext, useState, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("spps_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  const persist = (token, userData) => {
    localStorage.setItem("spps_token", token);
    localStorage.setItem("spps_user", JSON.stringify(userData));
    setUser(userData);
  };

  const login = useCallback(async (email, password, remember) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password, remember });
      persist(data.token, data.user);
      toast.success("Login successful");
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", payload);
      persist(data.token, data.user);
      toast.success("Account created successfully");
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (_) {
      /* ignore network errors on logout */
    }
    localStorage.removeItem("spps_token");
    localStorage.removeItem("spps_user");
    setUser(null);
    toast.info("Logged out");
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
