import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from './locales/ar.json'
import en from './locales/en.json'

// Get saved language from localStorage or default to 'ar'
const savedLang = typeof window !== 'undefined' ? localStorage.getItem('app-language') : 'ar'
const initialLang = savedLang || 'ar'

// Update document direction when language changes
const updateDirection = (lng: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lng
  }
}

// Set initial direction
if (typeof window !== 'undefined') {
  updateDirection(initialLang)
}

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

// Listen for language changes to update document direction
i18n.on('languageChanged', (lng) => {
  updateDirection(lng)
  if (typeof window !== 'undefined') {
    localStorage.setItem('app-language', lng)
  }
})

export default i18n