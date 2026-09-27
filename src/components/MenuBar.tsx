import type { CSSProperties } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'
import type { IconName } from './icons'

export interface MenuItem<Id extends string = string> {
  id: Id
  icon: IconName
  /** Libellé court, montré quand la destination est la courante. */
  label: string
  /** Nom accessible ; le libellé visible est décoratif. */
  ariaLabel?: string
}

export interface MenuBarProps<Id extends string> {
  items: readonly MenuItem<Id>[]
  active: Id
  onSelect: (id: Id) => void
  /** Nom accessible de la navigation. */
  label: string
  className?: string
}

/**
 * Barre de menu : un cadre creusé, et dedans UNE pastille en relief qui GLISSE sous la destination
 * courante ; celle-ci s'étire pour montrer son libellé. Le rang courant (--menu-at) transite, et la
 * pastille comme la largeur des destinations en découlent. L'app la place (marges, zone sûre).
 */
export function MenuBar<Id extends string>({ items, active, onSelect, label, className }: MenuBarProps<Id>) {
  const at = Math.max(0, items.findIndex((item) => item.id === active))
  const style = { '--menu-at': at, '--menu-n': items.length } as CSSProperties
  return (
    <nav className={cx('ds-menu', className)} aria-label={label} style={style}>
      <span className="ds-menu-indicator" aria-hidden="true" />
      {items.map((item, index) => {
        const current = item.id === active
        return (
          <button
            key={item.id}
            type="button"
            className={cx('ds-menu-item', current && 'ds-active')}
            aria-label={item.ariaLabel ?? item.label}
            aria-current={current ? 'page' : undefined}
            style={{ '--i': index } as CSSProperties}
            onClick={() => onSelect(item.id)}
          >
            <Icon name={item.icon} />
            <span className="ds-menu-label" aria-hidden="true">
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
