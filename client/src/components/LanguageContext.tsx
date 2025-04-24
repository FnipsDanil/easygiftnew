import React, { createContext, useContext, useState, useEffect } from 'react';
import { initData, useSignal } from "@telegram-apps/sdk-react";

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
}

// Добавляем тип для children
interface LanguageProviderProps {
  children: React.ReactNode;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const initDataState = useSignal(initData.state);
  const user = initDataState?.user;
  
  const [language, setLanguage] = useState<string>('en'); // Default to English
  
  useEffect(() => {
    if (user?.languageCode === 'ru') {
      setLanguage('ru'); // Set language to Russian if user.languageCode is 'ru'
    } else {
      setLanguage('en'); // Default to English
    }
  }, [user?.languageCode]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
