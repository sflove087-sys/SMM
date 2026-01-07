
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
    translations: any;
}

// Create the provider component
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children, translations }) => {
  const [language] = useState('bn');
  
  useEffect(() => {
    document.documentElement.lang = 'bn';
    document.body.classList.add('font-bengali');
    document.body.classList.remove('font-sans');
  }, []);

  const setLanguage = (lang: string) => {
    // Language is fixed to Bengali, so this function does nothing.
  };

  const t = useCallback((key: string, options?: { [key: string]: string | number }) => {
    const keys = key.split('.');
    let text: any = keys.reduce((obj: any, k: string) => {
        return (obj && typeof obj[k] !== 'undefined') ? obj[k] : null;
    }, translations);
    
    if (text === null) {
        console.warn(`Translation key not found: ${key}`);
        text = key; // Fallback to the key itself if not found
    }

    if (options && typeof text === 'string') {
        Object.keys(options).forEach(k => {
            // Using replaceAll is safer than new RegExp() with dynamic strings.
            // It avoids issues with special regex characters in keys and the "Invalid flags" error.
            text = text.replaceAll(`{${k}}`, String(options[k]));
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