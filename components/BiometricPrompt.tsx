import React from 'react';
import { Fingerprint, X } from 'lucide-react';
import Button from './common/Button';
import { User } from '../types';

interface BiometricPromptProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

const BiometricPrompt: React.FC<BiometricPromptProps> = ({ user, onSuccess, onCancel }) => {
  
  const handleAuth = () => {
    // In a real app, you would call navigator.credentials.get() for WebAuthn.
    // For this demo, we simulate a successful scan with a delay.
    setTimeout(() => {
      onSuccess();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-end p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm m-auto relative transform transition-all p-6 text-center animate-slide-up">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={24} />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sign in with Biometrics</h3>
        <p className="text-sm text-gray-500 mt-2 mb-6">Use your Face ID or Fingerprint to sign in as {user.name}.</p>
        <div className="my-8 text-center">
            <div className="inline-block p-4 bg-primary-100 dark:bg-primary-900/50 rounded-full">
                <Fingerprint size={64} className="mx-auto text-primary-500" />
            </div>
        </div>
        <Button onClick={handleAuth} className="w-full">Authenticate</Button>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
      `}</style>
    </div>
  );
};

export default BiometricPrompt;
