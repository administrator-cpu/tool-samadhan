import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'hi';

interface LanguageState {
  targetLang: Language;
  setTargetLang: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      targetLang: 'en', // Default language
      setTargetLang: (lang) => set({ targetLang: lang }),
    }),
    {
      name: 'samadhan-language-storage', // key in localStorage
    }
  )
);
