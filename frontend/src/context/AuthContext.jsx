import { createContext, useState, useCallback } from 'react';
import { storage } from '../utils/storage.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(storage.getUser());
  const [token, setToken] = useState(storage.getToken());
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback((userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    storage.setUser(userData);
    storage.setToken(userToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    storage.removeUser();
    storage.removeToken();
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    logout,
    setIsLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};