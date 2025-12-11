import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    name: string;
    role: 'admin' | 'member';
    tier: 'junior' | 'senior' | 'lead';
    credits: number;
}

interface AuthContextType {
    user: User | null;
    apiKey: string | null;
    login: (apiKey: string) => Promise<boolean>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// FIX: read API base
const API_BASE = import.meta.env.VITE_API_BASE || 'https://unbound-backend-1.onrender.com/';
const BASE = API_BASE.replace(/\/$/, '');

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('apiKey'));
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = async (key: string): Promise<User | null> => {
        try {
            const response = await fetch(`${BASE}/api/users/me`, {
                headers: { 'X-API-Key': key },
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch {
            return null;
        }
    };

    const login = async (key: string): Promise<boolean> => {
        setIsLoading(true);

        const userData = await fetchUser(key);
        if (userData) {
            setUser(userData);
            setApiKey(key);
            localStorage.setItem('apiKey', key);
            setIsLoading(false);
            return true;
        }

        setIsLoading(false);
        return false;
    };

    const logout = () => {
        setUser(null);
        setApiKey(null);
        localStorage.removeItem('apiKey');
    };

    const refreshUser = async () => {
        if (apiKey) {
            const userData = await fetchUser(apiKey);
            if (userData) {
                setUser(userData);
            }
        }
    };

    useEffect(() => {
        if (apiKey) {
            fetchUser(apiKey).then((userData) => {
                setUser(userData);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [apiKey]);

    return (
        <AuthContext.Provider value={{ user, apiKey, login, logout, refreshUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
