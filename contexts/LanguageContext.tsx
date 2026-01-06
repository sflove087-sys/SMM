
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// Define the shape of the context
interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

// Create the context with a default value
const LanguageContext = createContext<LanguageContextType>({
  language: 'bn',
  setLanguage: () => {},
  t: (key) => key,
});

// Create a custom hook for easy consumption of the context
export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
    children: React.ReactNode;
}

// Create the provider component
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState(localStorage.getItem('language') || 'bn');
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch(`/locales/${language}.json`);
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error(`Could not load translations for ${language}`, error);
        // Fallback to English if the selected language file is not found
        if (language !== 'en') {
           const response = await fetch(`/locales/en.json`);
           const data = await response.json();
           setTranslations(data);
        }
      }
    };
    fetchTranslations();

    // Set document language and font
    if (language === 'bn') {
        document.documentElement.lang = 'bn';
        document.body.classList.add('font-bengali');
        document.body.classList.remove('font-sans');
    } else {
        document.documentElement.lang = 'en';
        document.body.classList.add('font-sans');
        document.body.classList.remove('font-bengali');
    }

  }, [language]);

  const setLanguage = (lang: string) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
  };

  const t = useCallback((key: string, options?: { [key: string]: string | number }) => {
    const keys = key.split('.');
    let text = keys.reduce((obj: any, k: string) => (obj && obj[k] !== 'undefined') ? obj[k] : key, translations);

    if (options && typeof text === 'string') {
        Object.keys(options).forEach(k => {
            text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(options[k]));
        });
    }

    return text;
  }, [translations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};