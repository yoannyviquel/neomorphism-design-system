import { cx } from './cx'
import { PillBar, type PillItem } from './PillBar'

export type FlatSelectorOption<Id extends string = string> = PillItem<Id>

export interface FlatSelectorProps<Id extends string> {
  options: readonly FlatSelectorOption<Id>[]
  value: Id
  onChange: (id: Id) => void
  /** Nom accessible du groupe de choix. */
  label: string
  className?: string
}

/**
 * Sélecteur multiple plat : un choix parmi quelques-uns, côte à côte dans un cadre creusé, la
 * pastille en relief sous le choix courant — qui s'étire jusqu'au nouveau puis se rétracte de
 * l'ancien, comme la barre de menu (cf. PillBar), dans la hauteur d'une commande
 * (--control-height ; le choix fait --control-inner). Un choix à libellé seul le montre toujours ;
 * un choix à icône ne le montre que courant.
 * Groupe de boutons radio pour les lecteurs d'écran.
 */
export function FlatSelector<Id extends string>({ options, value, onChange, label, className }: FlatSelectorProps<Id>) {
  return (
    <PillBar
      as="div"
      className={cx('ds-flat-selector', className)}
      items={options}
      active={value}
      onSelect={onChange}
      rootProps={{ role: 'radiogroup', 'aria-label': label }}
      itemProps={(current) => ({ role: 'radio', 'aria-checked': current })}
    />
  )
}
