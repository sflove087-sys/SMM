import React, { useState } from 'react';
import { User } from '../types';
import { Search, Bell, Menu } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
    user: User;
    onLogout: () => void;
    onUserUpdate: () => Promise<void>;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onUserUpdate }) => {
    const [showBalance, setShowBalance] = useState(false);
    const [isBalanceLoading, setIsBalanceLoading] = useState(false);
    const { t } = useLanguage();

    const toggleBalance = async () => {
        if (!showBalance) {
            setIsBalanceLoading(true);
            await onUserUpdate();
            setIsBalanceLoading(false);
        }
        setShowBalance(!showBalance);
    };
    
    const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;

    return (
        <header className="relative bg-primary-600 text-white pb-16">
            <div className="p-4 relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                         <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-white/50">
                            {user.photoBase64 ? (
                                <img src={user.photoBase64} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl">{user.name.charAt(0)}</span>
                            )}
                        </div>
                        <div>
                            <h1 className="font-semibold text-white text-lg leading-tight">{user.name}</h1>
                        </div>
                    </div>
                     <div className="flex items-center space-x-2">
                        <button className="p-2.5 rounded-full bg-white/20 hover:bg-white/30"><Search size={20} /></button>
                        <button className="p-2.5 rounded-full bg-white/20 hover:bg-white/30"><Bell size={20}/></button>
                    </div>
                </div>
                <button 
                    onClick={toggleBalance} 
                    className="bg-white text-primary-800 rounded-lg px-4 py-2 text-md font-bold flex items-center shadow-lg"
                >
                    <span className="font-bengali text-2xl mr-2 text-primary-500">৳</span>
                    {isBalanceLoading ? (
                        <div className="w-5 h-5 border-2 border-t-primary-500 border-primary-200 rounded-full animate-spin"></div>
                    ) : showBalance ? (
                         <span>{formatCurrency(user.balance)}</span>
                    ): (
                        t('header.checkBalance')
                    )}
                </button>
            </div>
            <div className="absolute bottom-0 left-0 w-full z-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path fill="#ffffff" fillOpacity="1" className="dark:fill-gray-900" d="M0,224L48,229.3C96,235,192,245,288,218.7C384,192,480,128,576,128C672,128,768,192,864,218.7C960,245,1056,235,1152,208C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>
        </header>
    );
};

export default Header;