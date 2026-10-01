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
 * l'ancien, comme la barre de menu (cf. PillBar). Le cadre fait une hauteur de commande
 * (--control-height) et chaque choix y est LOGÉ, à --control-inner — comme le champ dans la
 * recherche, et à la différence des destinations de la barre de menu, qui sont des commandes
 * entières. Un choix à libellé seul le montre toujours ; un choix à icône ne le montre que courant.
 * Groupe de boutons radio pour les lecteurs d'écran.
 *
 * C'EST LE SOUS-MENU DU DS : toute bascule entre contenus d'un même écran (Build / Run, Courant /
 * Priorisation, une période, un mode d'affichage) passe par lui, jamais par un composant d'app.
 * La barre de menu dit où l'on est dans l'app ; le sélecteur plat, ce qu'on regarde là où l'on est.
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
