import type { IconName } from './icons'
import { cx } from './cx'
import { PillBar } from './PillBar'

export { MENU_RELEASE_DELAY_MS, MENU_RELEASE_MS, MENU_STRETCH_MS } from './PillBar'

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
 * Barre de menu : les destinations de l'app, des icônes ; celle où l'on est s'étire pour montrer
 * son libellé, sous la pastille qui s'étire puis se rétracte d'une destination à l'autre (cf.
 * PillBar). Une destination se PRESSE : c'est une commande, pas un contenu logé, et elle fait donc
 * --control-height, la hauteur de toutes les commandes du DS (33 px à la souris, 50 au doigt) ; un
 * cadre faisant ce qu'il loge plus ses deux marges, la barre fait 43 / 66 — même compte que le
 * sélecteur plat, qui loge lui aussi des commandes. Seule la recherche loge un CONTENU (son champ,
 * à --control-inner) et retombe ainsi sur 33 / 50 tout compris.
 * L'app la place (marges, zone sûre) — dans un Footer.
 */
export function MenuBar<Id extends string>({ items, active, onSelect, label, className }: MenuBarProps<Id>) {
  return (
    <PillBar
      as="nav"
      className={cx('ds-menu-bar', className)}
      items={items}
      active={active}
      onSelect={onSelect}
      rootProps={{ 'aria-label': label }}
      itemProps={(current) => ({ 'aria-current': current ? 'page' : undefined })}
    />
  )
}
