import React, { useState } from 'react';
import { User, UserType } from '../types';
import Header from './Header';
import PersonalDashboard from './dashboard/PersonalDashboard';
import AgentDashboard from './dashboard/AgentDashboard';
import AdminDashboard from './dashboard/AdminDashboard';
import TransactionHistoryScreen from './TransactionHistoryScreen';
import ProfileScreen from './ProfileScreen';
import { Home, History, Bell, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface MainAppProps {
  user: User;
  onLogout: () => void;
  onUserUpdate: () => Promise<void>;
}

type ActiveView = 'home' | 'history' | 'inbox' | 'profile';

const MainApp: React.FC<MainAppProps> = ({ user, onLogout, onUserUpdate }) => {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const { t } = useLanguage();

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        if (user.userType === UserType.PERSONAL) return <PersonalDashboard user={user} onUserUpdate={onUserUpdate} />;
        if (user.userType === UserType.AGENT) return <AgentDashboard user={user} onUserUpdate={onUserUpdate} />;
        if (user.userType === UserType.ADMIN) return <AdminDashboard />;
        return null;
      case 'history':
        if (user.userType !== UserType.ADMIN) {
           return <TransactionHistoryScreen user={user} />;
        }
        return <div className="p-4 text-center text-gray-500">{t('mainApp.adminNoHistory')}</div>;
       case 'inbox':
        return <div className="p-4 text-center text-gray-500">{t('mainApp.inboxEmpty')}</div>;
      case 'profile':
        if (user.userType !== UserType.ADMIN) {
            return <ProfileScreen user={user} onUserUpdate={onUserUpdate} />;
        }
        return <div className="p-4 text-center text-gray-500">{t('mainApp.profileComingSoon')}</div>;
      default:
        return null;
    }
  };

  const NavItem: React.FC<{ icon: React.ReactNode, label: string, view: ActiveView }> = ({ icon, label, view }) => {
    const isActive = activeView === view;
    return (
      <button 
        onClick={() => setActiveView(view)} 
        className={`flex flex-col items-center justify-center w-full py-2 transition-colors duration-300 ease-in-out relative ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-primary-500'}`}
      >
         <div className={`absolute inset-0 h-full w-full flex items-center justify-center transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
            <div className="h-10 w-20 bg-primary-50 dark:bg-primary-900/40 rounded-full"></div>
        </div>
        <div className="relative z-10">
            {React.cloneElement(icon as React.ReactElement, { size: 24 })}
        </div>
        <span className="text-xs mt-1 font-semibold relative z-10">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <Header user={user} onLogout={onLogout} />
      <main className="flex-grow overflow-y-auto bg-gray-50 dark:bg-black pb-16">
        {renderContent()}
      </main>
      {user.userType !== UserType.ADMIN && (
          <footer className="fixed bottom-0 w-full max-w-sm mx-auto bg-white/80 dark:bg-black/80 backdrop-blur-sm border-t dark:border-gray-800 shadow-t-lg">
              <nav className="flex justify-around">
                  <NavItem icon={<Home />} label={t('mainApp.home')} view="home" />
                  <NavItem icon={<History />} label={t('mainApp.history')} view="history" />
                  <NavItem icon={<Bell />} label={t('mainApp.inbox')} view="inbox" />
                  <NavItem icon={<UserIcon />} label={t('mainApp.profile')} view="profile" />
              </nav>
          </footer>
      )}
    </div>
  );
};

export default MainApp;