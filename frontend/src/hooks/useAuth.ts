import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('id_token'));
  }, []);

  const login = (token: string) => {
    localStorage.setItem('id_token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('id_token');
    setIsAuthenticated(false);
    navigate('/');
  };

  return { isAuthenticated, login, logout };
}
