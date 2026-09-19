'use client'

import { useState, useEffect, useRef } from 'react'
import { Languages, Check, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'lv', name: 'Latviešu', flag: '🇱🇻' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'lt', name: 'Lietuvių', flag: '🇱🇹' },
  { code: 'et', name: 'Eesti', flag: '🇪🇪' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
]

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}`
  document.cookie = `${name}=${value}; domain=.${window.location.hostname}; path=/; max-age=${maxAgeSeconds}`
}

export function LanguageSelector() {
  const [open, setOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState('es')
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const cookies = document.cookie.split(';')
    const googTransCookie = cookies.find(c => c.trim().startsWith('googtrans='))
    if (googTransCookie) {
      const parts = googTransCookie.split('=')
      const langPart = parts[parts.length - 1].trim()
      const langCode = langPart.split('/').pop()
      if (langCode) {
        Promise.resolve().then(() => setCurrentLang(langCode))
      }
    }
  }, [])

  const handleLanguageChange = (langCode: string) => {
    setCurrentLang(langCode)
    setOpen(false)
    const cookieValue = `/es/${langCode}`
    setCookie('googtrans', cookieValue, 31536000)
    const translateSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement | null
    if (translateSelect) {
      translateSelect.value = langCode
      translateSelect.dispatchEvent(new Event('change', { bubbles: true }))
    } else {
      window.location.reload()
    }
  }

  const currentLangInfo = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0]

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Cambiar idioma"
        title="Cambiar idioma de la página"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden md:inline">{currentLangInfo.flag} {currentLangInfo.name}</span>
        <span className="md:hidden">{currentLangInfo.flag}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-56 max-h-80 overflow-y-auto rounded-lg border border-border/60 bg-card shadow-lg">
          <div className="sticky top-0 border-b border-border/60 bg-card/95 backdrop-blur-sm px-3 py-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Languages className="h-3.5 w-3.5" />
              Selecciona un idioma
            </p>
          </div>
          <ul className="py-1">
            {LANGUAGES.map((lang) => (
              <li key={lang.code}>
                <button
                  onClick={() => handleLanguageChange(lang.code)}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary',
                    currentLang === lang.code ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="flex-1">{lang.name}</span>
                  {currentLang === lang.code && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
