import { createContext, useContext, useState } from 'react'

const LanguageContext = createContext()

export const LANGUAGES = [
  { code: 'en-US', label: 'English',    flag: '🇺🇸' },
  { code: 'es-ES', label: 'Spanish',    flag: '🇪🇸' },
  { code: 'fr-FR', label: 'French',     flag: '🇫🇷' },
  { code: 'pt-BR', label: 'Portuguese', flag: '🇧🇷' },
  { code: 'de-DE', label: 'German',     flag: '🇩🇪' },
  { code: 'ja-JP', label: 'Japanese',   flag: '🇯🇵' },
  { code: 'zh-CN', label: 'Chinese',    flag: '🇨🇳' },
  { code: 'ar-SA', label: 'Arabic',     flag: '🇸🇦' },
]

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(
    () => localStorage.getItem('pulseos_language') || 'en-US'
  )

  const changeLanguage = (code) => {
    setLanguage(code)
    localStorage.setItem('pulseos_language', code)
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)