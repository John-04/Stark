import React, { createContext, useContext, useState, useEffect } from 'react';
import { connect, disconnect as starknetDisconnect } from 'get-starknet';
import { AccountInterface, Provider } from 'starknet';

interface User {
  id: string;
  address?: string;
  email?: string;
  name?: string;
  avatar?: string;
  // Optional profile fields
  linkedin?: string;
  twitter?: string;
  phone?: string;
  country?: string;
  portfolioUrl?: string;
  articleUrl?: string;
  isPremium: boolean;
  queriesUsed: number;
  queryLimit: number;
  authMethod: 'wallet' | 'email';
  walletType?: 'argentX' | 'braavos';
}

interface AuthContextType {
  user: User | null;
  isConnecting: boolean;
  error: string | null;
  account: AccountInterface | null;
  provider: Provider | null;
  connectWallet: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  disconnect: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<AccountInterface | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('stark_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem('stark_user');
      }
    }
  }, []);

  // Save user to localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('stark_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('stark_user');
    }
  }, [user]);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const starknet = await connect({
        modalMode: 'canAsk',
        modalTheme: 'light',
      });

      if (!starknet) {
        throw new Error('No wallet found. Please install ArgentX or Braavos wallet.');
      }

      await starknet.enable();
      
      if (!starknet.account) {
        throw new Error('Failed to connect to wallet account');
      }

      // Get wallet type
      const walletType = starknet.id === 'argentX' ? 'argentX' : 'braavos';
      
      // Create nonce for signing
      const nonce = Date.now().toString();
      const message = `Sign this message to authenticate with StarkAnalytics. Nonce: ${nonce}`;
      
      // Sign the message for authentication (StarkNet Typed Data)
      try {
        const chainId = await (starknet.provider as any)?.getChainId?.().catch(() => 'SN_SEPOLIA');
        const typedData: any = {
          types: {
            StarkNetDomain: [
              { name: 'name', type: 'felt' },
              { name: 'version', type: 'felt' },
              { name: 'chainId', type: 'felt' },
            ],
            Message: [
              { name: 'content', type: 'felt' },
              { name: 'nonce', type: 'felt' },
            ],
          },
          primaryType: 'Message',
          domain: {
            name: 'StarkAnalytics',
            version: '1',
            chainId: chainId || 'SN_SEPOLIA',
          },
          message: {
            content: message,
            nonce,
          },
        };

        const signature = await starknet.account.signMessage(typedData);

        // Create user session
        const newUser: User = {
          id: starknet.account.address,
          address: starknet.account.address,
          isPremium: false,
          queriesUsed: 0,
          queryLimit: 150,
          authMethod: 'wallet',
          walletType,
        };

        setUser(newUser);
        setAccount(starknet.account);
        setProvider(starknet.provider);

        // Store session info
        localStorage.setItem('stark_session', JSON.stringify({
          address: starknet.account.address,
          signature,
          nonce,
          timestamp: Date.now(),
        }));
      } catch (signError) {
        throw new Error('Failed to sign authentication message');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      // Attempt API (optional, may not exist in dev)
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        const newUser: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar,
          isPremium: userData.isPremium || false,
          queriesUsed: userData.queriesUsed || 0,
          queryLimit: userData.queryLimit || 150,
          authMethod: 'email',
        };
        setUser(newUser);
        return;
      }

      // Fallback to local storage users (dev mode)
      const saved = localStorage.getItem('stark_users');
      const users: Array<{ id: string; email: string; name: string; password: string }>
        = saved ? JSON.parse(saved) : [];
      const existing = users.find((u) => u.email === email && u.password === password);
      if (!existing) {
        // Demo credentials also supported
        if (email === 'demo@starkanalytics.com' && password === 'password123') {
          const mockUser: User = {
            id: 'demo-user',
            email: 'demo@starkanalytics.com',
            name: 'Demo User',
            isPremium: false,
            queriesUsed: 25,
            queryLimit: 150,
            authMethod: 'email',
          };
          setUser(mockUser);
          return;
        }
        throw new Error('Invalid email or password');
      }

      const newUser: User = {
        id: existing.id,
        email: existing.email,
        name: existing.name,
        isPremium: false,
        queriesUsed: 0,
        queryLimit: 150,
        authMethod: 'email',
      };
      setUser(newUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const signUpWithEmail = async (name: string, email: string, password: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      // Attempt API (optional)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        // Assume backend handles email verification etc.
        return;
      }

      // Fallback to local storage mock (dev)
      const saved = localStorage.getItem('stark_users');
      const users: Array<{ id: string; email: string; name: string; password: string }>
        = saved ? JSON.parse(saved) : [];

      if (users.some((u) => u.email === email)) {
        throw new Error('An account with this email already exists');
      }

      const id = `user_${Date.now()}`;
      users.push({ id, email, name, password });
      localStorage.setItem('stark_users', JSON.stringify(users));

      // Auto sign-in on successful signup (dev UX)
      const newUser: User = {
        id,
        email,
        name,
        isPremium: false,
        queriesUsed: 0,
        queryLimit: 150,
        authMethod: 'email',
      };
      setUser(newUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const signOut = () => {
    setUser(null);
    setAccount(null);
    setProvider(null);
    setError(null);
    localStorage.removeItem('stark_session');
  };

  const disconnect = async () => {
    try {
      if (account) {
        await starknetDisconnect();
      }
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
    } finally {
      signOut();
    }
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      account,
      provider,
      isConnecting,
      error,
      connectWallet,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      disconnect,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
