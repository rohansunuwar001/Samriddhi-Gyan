import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend'; // To load translations from /public

i18n
  // Use the http backend to load translation files from a server/public folder
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // The default language
    fallbackLng: 'en',
    debug: true, // Set to false in production
    
    // Options for language detection
    detection: {
      // Order and from where user language should be detected
      order: ['localStorage', 'navigator'],
      // Cache user language in localStorage
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already safes from xss
    },
  });

export default i18n;