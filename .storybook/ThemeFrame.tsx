import { useEffect, type ReactNode } from 'react'

/** Le thème : celui de l'appareil, ou forcé (data-theme sur <html>, que les jetons suivent). */
export function ThemeFrame({ theme, children }: { theme: 'system' | 'dark' | 'light'; children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
  }, [theme])
  return <div style={{ padding: 36, minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>{children}</div>
}
