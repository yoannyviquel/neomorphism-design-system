import type { HTMLAttributes, Ref } from 'react'
import { cx } from './cx'

type Props<E extends HTMLElement> = HTMLAttributes<E> & { ref?: Ref<E> }

/** L'écran d'une app : l'en-tête, le corps qui défile, le pied, en colonne sur toute la hauteur. */
export function Screen({ className, ...rest }: Props<HTMLDivElement>) {
  return <div className={cx('ds-screen', className)} {...rest} />
}

/** L'en-tête fixe (une barre de recherche…), sous la barre d'état. */
export function Header({ className, ...rest }: Props<HTMLElement>) {
  return <header className={cx('ds-header', className)} {...rest} />
}

/**
 * Le corps, seul à défiler, entre l'en-tête et le pied : il passe sous eux en s'effaçant en fondu.
 * Sans en-tête, il prend lui-même la marge du haut, sous la barre d'état.
 */
export function Body({ className, ...rest }: Props<HTMLDivElement>) {
  return <div className={cx('ds-body', className)} {...rest} />
}

/** Le pied fixe (la barre de menu), au-dessus de la zone sûre du bas d'iPhone. */
export function Footer({ className, ...rest }: Props<HTMLElement>) {
  return <footer className={cx('ds-footer', className)} {...rest} />
}

/**
 * Une rangée de commandes qui OCCUPE SA LARGEUR : la place libre se répartit à parts égales entre
 * les boutons et aux deux bouts, au lieu de les serrer au centre derrière un écart fixe. L'écart
 * devient une mesure du conteneur — la même rangée respire sur un iPad et se resserre sur un
 * iPhone SE, sans réglage. En dessous de la place nécessaire, l'écart tombe à son minimum (la
 * marge des ombres) puis la rangée se replie.
 *
 * Elle NE POSE PAS de marge latérale : celle de son conteneur (le pied, le corps) suffit, et
 * `space-evenly` laisse déjà de la place aux deux bouts.
 *
 * `label` en fait un groupe nommé pour les lecteurs d'écran (« Commandes de la vue », « Catégories ») ;
 * sans lui, ce n'est qu'une boîte, et ce sont les boutons qui se nomment.
 */
export function ButtonBar({ label, className, ...rest }: Props<HTMLDivElement> & { label?: string }) {
  return <div role={label ? 'group' : undefined} aria-label={label} className={cx('ds-button-bar', className)} {...rest} />
}
