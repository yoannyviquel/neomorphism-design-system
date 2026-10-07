import type { HTMLAttributes } from 'react'
import { cx } from './cx'
import type { IconName } from './icons'

/** Une icône du DS. Décorative par défaut : le nom accessible est porté par la commande. */
export function Icon({ name, className, ...rest }: { name: IconName } & HTMLAttributes<HTMLElement>) {
  // `fa-rocket` est la classe Nerd Fonts `nf-fa-rocket` ; les autres sont des Material Design, `nf-md-*`.
  return <i className={cx('nf', name.startsWith('fa-') ? `nf-${name}` : `nf-md-${name}`, className)} aria-hidden="true" {...rest} />
}
