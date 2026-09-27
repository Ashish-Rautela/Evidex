import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApiClient } from '../api/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  createdAt?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('id_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // Validate session against auth microservice on mount
  useEffect(() => {
    const token = localStorage.getItem('id_token');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    let isMounted = true;
    authApiClient
      .get('/api/v1/auth/me')
      .then((res: any) => {
        if (isMounted && res.user) {
          setUser(res.user);
          localStorage.setItem('user_profile', JSON.stringify(res.user));
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        // If auth-service is offline, maintain local cached session gracefully
        if (isMounted) {
          const cached = localStorage.getItem('user_profile');
          if (cached) {
            try {
              setUser(JSON.parse(cached));
              setIsAuthenticated(true);
            } catch {
              setIsAuthenticated(false);
            }
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApiClient.post('/api/v1/auth/login', { email, password });
      if (res.idToken) {
        localStorage.setItem('id_token', res.idToken);
        if (res.accessToken) localStorage.setItem('access_token', res.accessToken);
        if (res.user) {
          localStorage.setItem('user_profile', JSON.stringify(res.user));
          setUser(res.user);
        }
        setIsAuthenticated(true);
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, tenantId?: string) => {
    setIsLoading(true);
    try {
      const res = await authApiClient.post('/api/v1/auth/signup', { name, email, password, tenantId });
      if (res.idToken) {
        localStorage.setItem('id_token', res.idToken);
        if (res.accessToken) localStorage.setItem('access_token', res.accessToken);
        if (res.user) {
          localStorage.setItem('user_profile', JSON.stringify(res.user));
          setUser(res.user);
        }
        setIsAuthenticated(true);
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApiClient.post('/api/v1/auth/logout', {}).catch(() => {});
    } finally {
      localStorage.removeItem('id_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_profile');
      setIsAuthenticated(false);
      setUser(null);
      navigate('/login');
    }
  }, [navigate]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
  };
}
