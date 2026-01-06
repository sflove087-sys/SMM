
import React, { useState, useEffect, useCallback } from 'react';
import { User } from './types';
import LoginScreen from './components/LoginScreen';
import MainApp from './components/MainApp';
import { Moon, Sun } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import { api } from './services/mockApi';


const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        const sessionUser = sessionStorage.getItem('currentUser');

        if (storedTheme === 'dark') {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true);
        }
        
        if (sessionUser) {
            setCurrentUser(JSON.parse(sessionUser));
            setIsAuthenticated(true);
        }
        setIsLoading(false); 
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
        setIsDarkMode(!isDarkMode);
    };

    const updateUserState = (user: User) => {
        setCurrentUser(user);
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        setIsAuthenticated(true);
    };
    
    const handleLogin = (user: User) => {
        updateUserState(user);
    };

    const handleLogout = useCallback(() => {
        setCurrentUser(null);
        sessionStorage.clear();
        localStorage.clear();
        setIsAuthenticated(false);
        document.documentElement.classList.remove('dark');
        setIsDarkMode(false);
    }, []);
    
    const refreshUser = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const freshUser = await api.refreshCurrentUser();
            updateUserState(freshUser);
        } catch (error) {
            console.error("Failed to refresh user data, logging out.", error);
            handleLogout();
        }
    }, [isAuthenticated, handleLogout]);
    
    // Auto-logout timer
    useEffect(() => {
        let activityTimer: number;
        const resetTimer = () => {
            clearTimeout(activityTimer);
            if (isAuthenticated) {
                activityTimer = window.setTimeout(() => {
                    alert("You've been logged out due to inactivity.");
                    handleLogout();
                }, 15 * 60 * 1000); // 15 minutes
            }
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keypress', resetTimer);
        resetTimer();

        return () => {
            clearTimeout(activityTimer);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keypress', resetTimer);
        };
    }, [isAuthenticated, handleLogout]);


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="w-16 h-16 border-4 border-t-primary-500 border-gray-200 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="antialiased text-gray-900 dark:text-gray-200">
             <div className="fixed top-4 right-4 z-50">
                <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-md">
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
            <div className="max-w-sm mx-auto min-h-screen bg-white dark:bg-black shadow-2xl flex flex-col">
                {currentUser ? (
                    <MainApp user={currentUser} onLogout={handleLogout} onUserUpdate={refreshUser} />
                ) : (
                    <LoginScreen onLogin={handleLogin} />
                )}
            </div>
        </div>
    );
};

export default App;
