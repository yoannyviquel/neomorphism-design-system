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
 * l'ancien, comme la barre de menu (cf. PillBar). Un choix se PRESSE : c'est une commande, pas un
 * contenu logé, et il fait donc --control-height comme un bouton (33 px à la souris, 50 au doigt) ;
 * un cadre faisant ce qu'il loge plus ses deux marges, le sélecteur fait 43 / 66 — même compte que
 * la barre de menu. Seule la recherche loge un CONTENU (son champ, à --control-inner) et retombe
 * ainsi sur 33 / 50 tout compris.
 * Un choix à libellé seul le montre toujours ; un choix à icône ne le montre que courant.
 * Groupe de boutons radio pour les lecteurs d'écran.
 *
 * C'EST LE SOUS-MENU DU DS : toute bascule entre contenus d'un même écran (Build / Run, Courant /
 * Priorisation, une période, un mode d'affichage) passe par lui, jamais par un composant d'app.
 * La barre de menu dit où l'on est dans l'app ; le sélecteur plat, ce qu'on regarde là où l'on est.
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
