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
