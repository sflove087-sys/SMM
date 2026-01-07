import React, { useState } from 'react';
import { User, UserType, TransactionType } from '../types';
import Header from './Header';
import PersonalDashboard from './dashboard/PersonalDashboard';
import AgentDashboard from './dashboard/AgentDashboard';
import AdminDashboard from './dashboard/AdminDashboard';
import MyFinPayScreen from './MyFinPayScreen';
import QrScanner from './common/QrScanner';
import TransactionFlow from './TransactionFlow';
import { Home, LayoutGrid, QrCode, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface MainAppProps {
  user: User;
  onLogout: () => void;
  onUserUpdate: () => Promise<void>;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

type ActiveView = 'home' | 'myfinpay' | 'inbox';

const MainApp: React.FC<MainAppProps> = ({ user, onLogout, onUserUpdate, toggleTheme, isDarkMode }) => {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const { t } = useLanguage();
  const [isGlobalScannerVisible, setIsGlobalScannerVisible] = useState(false);
  const [globalFlowState, setGlobalFlowState] = useState<{ type: TransactionType, recipientMobile?: string, isOpen: boolean } | null>(null);

  const handleGlobalQrScanSuccess = (mobile: string) => {
    setIsGlobalScannerVisible(false);
    // Default to SEND_MONEY when scanning from the main nav
    setGlobalFlowState({ type: TransactionType.SEND_MONEY, recipientMobile: mobile, isOpen: true });
  };

  const closeGlobalFlow = async () => {
    setGlobalFlowState(null);
    await onUserUpdate();
  };

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        if (user.userType === UserType.PERSONAL) return <PersonalDashboard user={user} onUserUpdate={onUserUpdate} />;
        if (user.userType === UserType.AGENT) return <AgentDashboard user={user} onUserUpdate={onUserUpdate} />;
        if (user.userType === UserType.ADMIN) return <AdminDashboard />;
        return null;
      case 'myfinpay':
        if (user.userType !== UserType.ADMIN) {
           return <MyFinPayScreen user={user} onLogout={onLogout} onUserUpdate={onUserUpdate} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />;
        }
        return <div className="p-4 text-center text-gray-500">{t('mainApp.adminNoHistory')}</div>;
       case 'inbox':
        return <div className="p-4 text-center text-gray-500">{t('mainApp.inboxEmpty')}</div>;
      default:
        return null;
    }
  };

  const NavItem: React.FC<{ icon: React.ReactNode, label: string, view: ActiveView | 'qr', onClick?: () => void }> = ({ icon, label, view, onClick }) => {
    const isActive = activeView === view;
    return (
      <button 
        onClick={onClick ? onClick : () => setActiveView(view as ActiveView)} 
        className={`flex flex-col items-center justify-center w-full py-1 transition-colors duration-200 ease-in-out relative text-center ${isActive ? 'text-primary-600' : 'text-gray-700 dark:text-gray-300'}`}
      >
        {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-500 rounded-b-full"></div>}
        <div className={`p-2 rounded-full ${isActive ? 'bg-primary-100/80 dark:bg-primary-900/50' : ''}`}>
             {React.cloneElement(icon as React.ReactElement<any>, { width: 24, height: 24 })}
        </div>
        <span className="text-xs mt-1 font-semibold">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      {activeView === 'home' && user.userType !== UserType.ADMIN && <Header user={user} onLogout={onLogout} onUserUpdate={onUserUpdate} />}
      <main className={`flex-grow overflow-y-auto ${activeView !== 'home' ? 'bg-white dark:bg-gray-900' : ''} pb-20`}>
        {renderContent()}
      </main>

      {isGlobalScannerVisible && user.userType !== UserType.ADMIN && (
          <QrScanner 
              onSuccess={handleGlobalQrScanSuccess}
              onClose={() => setIsGlobalScannerVisible(false)}
          />
      )}
      {globalFlowState?.isOpen && user.userType !== UserType.ADMIN && (
          <TransactionFlow
              user={user}
              transactionType={globalFlowState.type}
              initialRecipientMobile={globalFlowState.recipientMobile}
              onClose={closeGlobalFlow}
          />
      )}
      
      {user.userType !== UserType.ADMIN && (
          <footer className="fixed bottom-0 w-full max-w-sm mx-auto bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-t dark:border-gray-800 shadow-t-lg">
              <nav className="flex justify-around items-center h-16">
                  <NavItem icon={<Home />} label={t('mainApp.home')} view="home" />
                  <NavItem icon={<LayoutGrid />} label={t('mainApp.myFinPay')} view="myfinpay" />
                  <NavItem icon={<QrCode />} label={t('mainApp.qrScan')} view="qr" onClick={() => setIsGlobalScannerVisible(true)} />
                  <NavItem icon={<Mail />} label={t('mainApp.inbox')} view="inbox" />
              </nav>
          </footer>
      )}
    </div>
  );
};

export default MainApp;