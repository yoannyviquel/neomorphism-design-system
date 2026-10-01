import { cx } from './cx'
import { PillBar, type PillItem } from './PillBar'

export type FlatSelectorOption<Id extends string = string> = PillItem<Id>

export interface FlatSelectorProps<Id extends string> {
  options: readonly FlatSelectorOption<Id>[]
  value: Id
  onChange: (id: Id) => void
  /** Nom accessible du groupe de choix. */
  label: string
  /** Les choix se replient sur autant de lignes qu'il en faut, au lieu de se serrer sur une seule :
   *  de quoi remplacer une liste déroulante tant qu'ils tiennent à l'écran (une douzaine). */
  multiline?: boolean
  className?: string
}

/**
 * Sélecteur multiple plat : un choix parmi quelques-uns, côte à côte dans un cadre creusé, la
 * pastille en relief sous le choix courant — qui s'étire jusqu'au nouveau puis se rétracte de
 * l'ancien, comme la barre de menu (cf. PillBar), dans la hauteur d'une commande (50 px, choix de
 * 34 px). Un choix à libellé seul le montre toujours ; un choix à icône ne le montre que courant.
 * Groupe de boutons radio pour les lecteurs d'écran.
 *
 * `multiline` : les choix se replient sur plusieurs lignes, chacune occupant toute la largeur, la
 * dernière à gauche comme un texte justifié. La pastille s'étire d'une ligne à l'autre. Tous les
 * choix restent visibles d'un coup d'œil : là où une liste déroulante en cache une douzaine, le
 * sélecteur plat les montre, et un seul toucher suffit.
 */
export function FlatSelector<Id extends string>({ options, value, onChange, label, multiline, className }: FlatSelectorProps<Id>) {
  return (
    <PillBar
      as="div"
      className={cx('ds-flat-selector', multiline && 'ds-multiline', className)}
      items={options}
      active={value}
      onSelect={onChange}
      rootProps={{ role: 'radiogroup', 'aria-label': label }}
      itemProps={(current) => ({ role: 'radio', 'aria-checked': current })}
    />
  )
}
