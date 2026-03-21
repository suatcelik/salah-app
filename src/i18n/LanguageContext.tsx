import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { Language, Translations, translations } from './translations';

interface LanguageContextType {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => Promise<void>;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const STORAGE_KEY = '@salah_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('tr');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored && translations[stored as Language]) {
        applyLanguage(stored as Language);
      }
    });
  }, []);

  const applyLanguage = (lang: Language) => {
    I18nManager.forceRTL(translations[lang].isRTL);
    setLanguageState(lang);
  };

  const setLanguage = async (lang: Language) => {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
    applyLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{
      language,
      t: translations[language],
      setLanguage,
      isRTL: translations[language].isRTL,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

// Sadece çeviri stringlerine ihtiyaç duyulunca
export function useT(): Translations {
  return useLanguage().t;
}
