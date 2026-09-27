import type { HTMLAttributes } from 'react'
import { cx } from './cx'
import type { IconName } from './icons'

/** Une icône du DS. Décorative par défaut : le nom accessible est porté par la commande. */
export function Icon({ name, className, ...rest }: { name: IconName } & HTMLAttributes<HTMLElement>) {
  return <i className={cx('nf', `nf-md-${name}`, className)} aria-hidden="true" {...rest} />
}
