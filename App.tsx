import React, { useState, useEffect, useCallback } from 'react';
import { User } from './types';
import LoginScreen from './components/LoginScreen';
import MainApp from './components/MainApp';
import { Moon, Sun } from 'lucide-react';
import { api } from './services/mockApi';


const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const sessionUser = sessionStorage.getItem('currentUser');
        try {
            return sessionUser ? JSON.parse(sessionUser) : null;
        } catch (e) {
            console.error("Failed to parse user from session storage", e);
            sessionStorage.removeItem('currentUser');
            return null;
        }
    });
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!sessionStorage.getItem('currentUser'));

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'dark') {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true);
        }
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
        sessionStorage.clear(); // Clears user session data.
        // We no longer clear localStorage to preserve user's language and theme preferences.
        setIsAuthenticated(false);
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

    return (
        <div className="antialiased text-gray-900 dark:text-gray-200">
            <div className="max-w-sm mx-auto min-h-screen bg-gray-50 dark:bg-gray-950 shadow-2xl flex flex-col">
                {currentUser ? (
                    <MainApp user={currentUser} onLogout={handleLogout} onUserUpdate={refreshUser} toggleTheme={toggleTheme} isDarkMode={isDarkMode}/>
                ) : (
                    <LoginScreen onLogin={handleLogin} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
                )}
            </div>
        </div>
    );
};

export default App;