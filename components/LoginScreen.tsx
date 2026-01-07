import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/mockApi';
import Button from './common/Button';
import Input from './common/Input';
import Logo from './common/Logo';
import SignUpFlow from './SignUpFlow';
import ForgotPinFlow from './ForgotPinFlow';
import { Smartphone, Lock, Sun, Moon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { APP_NAME } from '../constants';
import BiometricPrompt from './BiometricPrompt';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, toggleTheme, isDarkMode }) => {
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'login' | 'signup' | 'forgotPin'>('login');
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [biometricUser, setBiometricUser] = useState<User | null>(null);
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await api.login(mobile, pin);
      onLogin(user);
    } catch (err: any) {
      // Use a generic key for the error message from the API
      setError(t('login.invalidCredentialsError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMobileBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const mobileValue = e.target.value;
    // Mock check for biometrics. In a real app, you'd check a local flag or user preference.
    if (mobileValue === '01700000001') { 
        try {
            const user = await api.getUserByMobile(mobileValue);
            if (user) {
                setBiometricUser(user);
                setShowBiometricPrompt(true);
            }
        } catch (error) {
            console.error("Failed to fetch user for biometric check", error);
        }
    }
  };

  const handleBiometricSuccess = () => {
    if(biometricUser) {
        onLogin(biometricUser);
    }
    setShowBiometricPrompt(false);
  }

  const renderLoginView = () => (
    <div className="flex-grow flex flex-col justify-center items-center text-center">
        <Logo className="mb-8" />
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('login.welcome')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{t('login.subtitle', { appName: APP_NAME })}</p>
      
        <div className="mb-6">
            <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>

        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <Input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            onBlur={handleMobileBlur}
            placeholder={t('login.mobilePlaceholder')}
            required
            autoComplete="tel"
            leftIcon={<Smartphone size={18} className="text-gray-400" />}
          />
          <Input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder={t('login.pinPlaceholder')}
            required
            maxLength={4}
            autoComplete="current-password"
            leftIcon={<Lock size={18} className="text-gray-400" />}
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button type="submit" isLoading={isLoading} className="mt-4">
            {t('login.button')}
          </Button>
        </form>
    </div>
  );

  return (
    <div className="flex flex-col justify-center h-full p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      {view === 'login' && renderLoginView()}
      {view === 'signup' && <SignUpFlow onLogin={onLogin} onShowLogin={() => setView('login')} />}
      {view === 'forgotPin' && <ForgotPinFlow onShowLogin={() => setView('login')} />}
      
      {showBiometricPrompt && biometricUser && (
        <BiometricPrompt 
            user={biometricUser}
            onSuccess={handleBiometricSuccess}
            onCancel={() => setShowBiometricPrompt(false)}
        />
      )}

      <div className="py-4 text-center">
        {view === 'login' && (
           <>
            <button onClick={() => setView('forgotPin')} className="text-sm font-medium text-primary-600 hover:underline">{t('login.forgotPin')}</button>
            <p className="text-sm text-gray-500 mt-4">{t('login.signupPrompt', { appName: APP_NAME })} <button onClick={() => setView('signup')} className="font-medium text-primary-600 hover:underline">{t('login.signupLink')}</button></p>
           </>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;