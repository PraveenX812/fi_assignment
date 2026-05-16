/* eslint-disable no-unused-vars */
import { createContext, useState, useEffect, useContext } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const { data } = await apiClient('/me');
          setUser(data);
          setIsAuthenticated(true);
        } catch (err) {
          localStorage.removeItem('access_token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const { data: tokenData } = await apiClient('/login', {
        body: { email, password }
      });
      localStorage.setItem('access_token', tokenData.access_token);
      
      const { data: userData } = await apiClient('/me');
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const register = async (email, password) => {
    try {
      await apiClient('/register', {
        body: { email, password }
      });
      // Auto login after register
      return await login(email, password);
    } catch (error) {
      return { success: false, error };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
