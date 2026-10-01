import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'
import type { IconName } from './icons'
import { Shade } from './Shade'
import { usePress } from './usePress'

export type ButtonTone = 'default' | 'primary' | 'danger' | 'link'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Couleur d'allumage : l'encre (défaut), le primaire, le danger, ou un lien d'action. */
  tone?: ButtonTone
  /** Taille d'un bouton à libellé. */
  size?: 'md' | 'sm'
  /** Icône avant le libellé. */
  icon?: IconName
  /** Enfoncé, durablement : la destination courante, un réglage actif. Sans elle, le bouton est
   *  une commande MOMENTANÉE (`ds-momentary`) : il ne reste jamais enfoncé, et s'enfonce moins. */
  active?: boolean
  /** À plat au repos (posé dans une surface déjà en relief). */
  flat?: boolean
  children?: ReactNode
}

/**
 * Bouton à libellé : en relief au repos, enfoncé pressé ou actif, avec le rebond du DS — un
 * toucher bref compris (cf. usePress). Un bouton à bascule passe `aria-pressed` et `active` ensemble.
 */
export function Button({ tone = 'default', size = 'md', icon, active, flat = false, className, children, type = 'button', ...rest }: ButtonProps) {
  const { pressed, handlers } = usePress(rest)
  return (
    <button
      type={type}
      className={cx(
        'ds-button',
        'ds-text',
        size === 'sm' && 'ds-small',
        tone !== 'default' && `ds-${tone}`,
        active && 'ds-active',
        active === undefined && 'ds-momentary',
        pressed && 'ds-pressed',
        flat && 'ds-flat',
        className,
      )}
      {...rest}
      {...handlers}
    >
      <Shade />
      {icon && <Icon name={icon} />}
      {children}
    </button>
  )
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName
  /** Nom accessible : un bouton-icône n'a pas de texte. */
  label: string
  active?: boolean
  /** Échelle des grands éléments (ombres k = 1/2), quand il est logé dans une barre de même échelle. */
  large?: boolean
  tone?: ButtonTone
}

/** Bouton-icône : un carré de la hauteur d'une commande (--control-height : 50 px au doigt, 33 à la
 *  souris), au rayon des commandes (--control-radius). */
export function IconButton({ icon, label, active, large = false, tone = 'default', className, type = 'button', ...rest }: IconButtonProps) {
  const { pressed, handlers } = usePress(rest)
  return (
    <button
      type={type}
      aria-label={label}
      className={cx('ds-button', 'ds-icon', large && 'ds-large', tone !== 'default' && `ds-${tone}`, active && 'ds-active', active === undefined && 'ds-momentary', pressed && 'ds-pressed', className)}
      {...rest}
      {...handlers}
    >
      <Shade />
      <Icon name={icon} />
    </button>
  )
}
