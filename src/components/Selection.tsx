import { createElement, type HTMLAttributes, type ReactNode } from 'react'
import { IconButton, type IconButtonProps } from './Button'
import { cx } from './cx'

export interface SelectToggleProps extends Omit<IconButtonProps, 'icon' | 'active' | 'onClick' | 'aria-pressed'> {
  /** Choisi ou non. */
  selected: boolean
  /** Appelé à chaque appui : au consommateur de basculer l'état. */
  onToggle: () => void
}

/**
 * Le bouton qui choisit un élément : un bouton-icône À BASCULE, et non une case à cocher.
 *
 * La sélection se lit au relief, comme tout état dans le DS — en relief tant que l'élément n'est
 * pas choisi, ENFONCÉ et allumé une fois choisi —, et l'icône le redit par sa forme : case vide,
 * case cochée. Il a la taille d'une commande (une case n'en montrait que 22 px) et se tient à côté
 * des autres commandes de l'élément, de la même taille qu'elles.
 *
 * `aria-pressed` et `active` vont ensemble, comme pour tout bouton à bascule du DS. Le nom (`label`)
 * dit ce qu'on choisit : « Sélectionner l'opération du 8 mars sur Fonds euros ».
 */
export function SelectToggle({ selected, onToggle, className, ...rest }: SelectToggleProps) {
  return (
    <IconButton
      icon={selected ? 'checkbox_marked_outline' : 'checkbox_blank_outline'}
      active={selected}
      aria-pressed={selected}
      className={cx('ds-select-toggle', className)}
      onClick={onToggle}
      {...rest}
    />
  )
}

/** Les balises qu'un élément sélectionnable peut prendre : un bloc, un élément de liste, une ligne
 *  de tableau. */
export type SelectableTag = 'div' | 'li' | 'tr' | 'article' | 'section'

export interface SelectableProps extends HTMLAttributes<HTMLElement> {
  /** Choisi : le bloc est enfoncé. */
  selected: boolean
  /** La balise rendue — `tr` pour une ligne de tableau. `div` par défaut. */
  as?: SelectableTag
  children?: ReactNode
}

/**
 * Un élément qu'on choisit — une opération dans une liste, une ligne d'un tableau —, et qui
 * S'ENFONCE quand il est choisi, au lieu de se teinter : le relief dit l'état, comme partout dans
 * le DS, et l'élément se creuse du même geste que le bouton qui le choisit (`SelectToggle`) —
 * `--sink`, avec le rebond à l'enfoncement et l'élan au relâchement.
 *
 * Le CREUX SEUL, sans le rebord en relief d'un bouton pressé : au repos, l'élément est à plat — ce
 * n'est pas une commande —, et c'est une région de la page qui s'enfonce, pas une touche.
 *
 * L'élément porte d'avance la marge intérieure et les coins d'un creux, rendus par une marge
 * négative : rien ne bouge quand il s'enfonce, et son contenu reste aligné sur ses voisins. Une ligne
 * de tableau (`as="tr"`) se creuse aussi, mais sans coins ni marges, qu'une ligne de tableau ignore.
 *
 * Le bouton qui le choisit se pose dedans, avec ses autres commandes :
 *
 *   <Selectable selected={choisi}>
 *     …
 *     <SelectToggle selected={choisi} onToggle={basculer} label="Sélectionner …" />
 *   </Selectable>
 */
export function Selectable({ selected, as = 'div', className, children, ...rest }: SelectableProps) {
  return createElement(as, { className: cx('ds-selectable', className), 'data-selected': selected ? '' : undefined, ...rest }, children)
}
