import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { api } from '../api/axios';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User };

const initialState: AuthState = {
  isAuthenticated: !!localStorage.getItem('access_token'),
  user: null,
  loading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { ...state, isAuthenticated: true, user: action.payload.user, loading: false };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, user: null, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
        return { ...state, user: action.payload, isAuthenticated: true, loading: false };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (token: string, role: Role, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
           // Simulating fetching /auth/me or deriving from logic
           // In a real app, you might decode the token JWT here to get the role immediately
           // or call /auth/me
           const res = await api.get('/auth/me');
           dispatch({ type: 'SET_USER', payload: res.data });
        } catch (error) {
           console.error("Failed to restore session", error);
           localStorage.removeItem('access_token');
           dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    initAuth();
  }, []);

  const login = (token: string, role: Role, name: string) => {
    localStorage.setItem('access_token', token);
    // Determine ID based on a real fetch, here we mock the user object for the context
    // In production, you'd decode the token or wait for the /auth/me call
    const mockUser: User = { id: 0, name, username: name.toLowerCase(), role, is_active: true };
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user: mockUser, token } });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};