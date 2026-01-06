import React, { useState } from 'react';
import { User } from '../types';
import { LogOut, User as UserIcon, Shield, Settings, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
    user: User;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const { language, setLanguage, t } = useLanguage();

    const getUserInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`;
        }
        return name.substring(0, 2);
    };
    
    return (
        <header className="bg-white dark:bg-black p-4 sticky top-0 z-10 border-b dark:border-gray-800">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                     <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-lg overflow-hidden">
                        {user.photoBase64 ? (
                            <img src={user.photoBase64} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            getUserInitials(user.name)
                        )}
                    </div>
                    <div>
                        <h1 className="font-semibold text-gray-800 dark:text-gray-100 text-lg leading-tight">{t('header.greeting', { name: user.name.split(' ')[0] })}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-tight">{t('header.welcome')}</p>
                    </div>
                </div>
                 <div className="relative">
                    <button onClick={() => setShowDropdown(!showDropdown)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Settings size={22} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    {showDropdown && (
                        <div 
                            className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-20 border dark:border-gray-700"
                            onMouseLeave={() => setShowDropdown(false)}
                        >
                            <div className="px-4 py-2 border-b dark:border-gray-700">
                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.mobile}</p>
                            </div>
                            <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <UserIcon size={16} className="mr-3" /> {t('header.myProfile')}
                            </a>
                            <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Shield size={16} className="mr-3" /> {t('header.securitySettings')}
                            </a>
                             <div className="border-t dark:border-gray-700 my-1"></div>
                             <div className="px-4 pt-2 pb-1 text-xs text-gray-500 dark:text-gray-400">{t('header.language')}</div>
                                <button onClick={() => setLanguage('en')} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    {language === 'en' ? <Check size={16} className="mr-3 text-primary-500"/> : <span className="w-7 mr-3"></span>}{t('header.english')}
                                </button>
                                <button onClick={() => setLanguage('bn')} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    {language === 'bn' ? <Check size={16} className="mr-3 text-primary-500"/> : <span className="w-7 mr-3"></span>}{t('header.bengali')}
                                </button>
                             <div className="border-t dark:border-gray-700 my-1"></div>
                            <button onClick={onLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <LogOut size={16} className="mr-3" /> {t('header.logout')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;