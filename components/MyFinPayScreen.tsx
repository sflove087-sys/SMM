import React, { useState } from 'react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ChevronRight, History, User as UserIcon, LogOut, ArrowLeft, Sun, Moon } from 'lucide-react';
import TransactionHistoryScreen from './TransactionHistoryScreen';
import ProfileScreen from './ProfileScreen';

interface MyFinPayScreenProps {
  user: User;
  onLogout: () => void;
  onUserUpdate: () => Promise<void>;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

type MyFinPayView = 'main' | 'history' | 'profile';

const MyFinPayScreen: React.FC<MyFinPayScreenProps> = ({ user, onLogout, onUserUpdate, toggleTheme, isDarkMode }) => {
    const { t } = useLanguage();
    const [view, setView] = useState<MyFinPayView>('main');

    const getUserInitials = (name: string) => {
        if (!name) return '?';
        const names = name.split(' ');
        if (names.length > 1 && names[names.length - 1]) {
            return `${names[0][0]}${names[names.length - 1][0]}`;
        }
        return name.substring(0, 2);
    };

    const MenuItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
        <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center">
                {icon}
                <span className="ml-4 font-semibold text-gray-800 dark:text-gray-200">{label}</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
        </button>
    );

    const ToggleMenuItem: React.FC<{ icon: React.ReactNode, label: string, onToggle: () => void, isToggled: boolean }> = ({ icon, label, onToggle, isToggled }) => (
        <div className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="flex items-center">
                {icon}
                <span className="ml-4 font-semibold text-gray-800 dark:text-gray-200">{label}</span>
            </div>
            <button onClick={onToggle} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${isToggled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isToggled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
    
    const SubScreenWrapper: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
        <div>
            <div className="p-4 flex items-center space-x-4 border-b dark:border-gray-700 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
                <button onClick={() => setView('main')} className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
            </div>
            {children}
        </div>
    );

    if (view === 'history') {
        return (
            <SubScreenWrapper title={t('history.title')}>
                <TransactionHistoryScreen user={user} />
            </SubScreenWrapper>
        );
    }
    
    if (view === 'profile') {
        return (
            <SubScreenWrapper title={t('profile.title')}>
                <ProfileScreen user={user} onUserUpdate={onUserUpdate} />
            </SubScreenWrapper>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-2xl overflow-hidden flex-shrink-0">
                    {user.photoBase64 ? <img src={user.photoBase64} alt={user.name} className="w-full h-full object-cover" /> : getUserInitials(user.name)}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{user.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{user.mobile}</p>
                </div>
            </div>

            <div className="space-y-3">
                <MenuItem icon={<History size={24} className="text-primary-500" />} label={t('history.title')} onClick={() => setView('history')} />
                <MenuItem icon={<UserIcon size={24} className="text-primary-500" />} label={t('profile.title')} onClick={() => setView('profile')} />
                <ToggleMenuItem 
                    icon={isDarkMode ? <Sun size={24} className="text-yellow-400" /> : <Moon size={24} className="text-primary-500" />} 
                    label="Dark Mode" 
                    onToggle={toggleTheme} 
                    isToggled={isDarkMode} 
                />
                <MenuItem icon={<LogOut size={24} className="text-red-500" />} label={t('header.logout')} onClick={onLogout} />
            </div>
        </div>
    );
};

export default MyFinPayScreen;