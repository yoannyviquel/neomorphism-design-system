import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'

/** Chargement : un cercle qui rebondit par son ombre ; `compact`, le point seul. */
export function Spinner({ label = 'Chargement…', compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div className={compact ? 'ds-spinner ds-spinner-compact' : 'ds-spinner'} role="status" aria-label={label}>
      <span className="ds-spinner-dot" aria-hidden="true" />
      {!compact && <span>{label}</span>}
    </div>
  )
}

/** Message : un texte d'accompagnement dont seul le mot clé (`title`) est appuyé. */
export function Notice({ tone, title, children, className, ...rest }: { tone?: 'warn' | 'ok'; title?: ReactNode; children?: ReactNode } & HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cx('ds-notice', tone && `ds-${tone}`, className)} {...rest}>
      {title && <strong>{title}</strong>} {children}
    </p>
  )
}

/** Zone : délimitée par une bordure fine, jamais par une ombre. */
export function Zone({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <section className={cx('ds-zone', className)} {...rest} />
}
