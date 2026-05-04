import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import zh from './zh'
import en from './en'

const savedLang = localStorage.getItem('app_language')

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh,
      en,
    },
    lng: savedLang || undefined,
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n

export function setLanguage(lang: string) {
  localStorage.setItem('app_language', lang)
  i18n.changeLanguage(lang)
}
