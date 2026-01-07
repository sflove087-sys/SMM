import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';

const AppLoader: React.FC = () => {
    const [translations, setTranslations] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadTranslations = async () => {
            try {
                const response = await fetch('/locales/bn.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setTranslations(data);
            } catch (e: any) {
                console.error("Failed to load translations:", e);
                setError("Could not load application language file. Please try again later.");
            }
        };

        loadTranslations();
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-950 text-red-500 p-4 text-center">
                <h2 className="text-lg font-semibold">Application Error</h2>
                <p>{error}</p>
            </div>
        );
    }

    if (!translations) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
                <div className="w-16 h-16 border-4 border-t-primary-500 border-gray-200 dark:border-gray-700 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <LanguageProvider translations={translations}>
            <App />
        </LanguageProvider>
    );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppLoader />
  </React.StrictMode>
);
