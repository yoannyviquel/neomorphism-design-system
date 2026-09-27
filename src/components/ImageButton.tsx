import { useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { cx } from './cx'

export type ImageButtonVariant = 'chip' | 'set' | 'label'

/** L'état d'un bouton dans une grille dépliante (cf. FoldingGrid) : repli, pop, attente. */
export interface FoldItemState {
  folded: boolean
  motion: 'pop' | 'unpop' | null
  popDelay: number
}

export interface ImageButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /**
   * La forme (cf. image-button.css) : `chip`, la pastille ; `set`, sertie dans un chaton ; `label`,
   * l'image en icône suivie du nom.
   */
  variant?: ImageButtonVariant
  /** Le nom : nom accessible et infobulle, écrit à côté de l'image en `label`. */
  name: string
  /** L'image ; à défaut, ou si elle ne charge pas, les initiales du nom. */
  src?: string | null
  /** Bouton à bascule : enfoncé et image allumée quand vrai, image éteinte sinon. */
  pressed?: boolean
  /** Dans une grille dépliante : l'état que la grille lui passe. */
  fold?: FoldItemState
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Bouton à image : le bouton reste une surface du DS, l'image en est le contenu, posée au-dessus de
 * ses ombres — le creux se dessine autour d'elle, jamais par-dessus.
 */
export function ImageButton({ variant = 'set', name, src, pressed, fold, className, style, type = 'button', ...rest }: ImageButtonProps) {
  const [failed, setFailed] = useState(false)
  const image: ReactNode =
    src && !failed ? (
      <img className="ds-image" src={src} alt="" loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)} />
    ) : (
      <span className="ds-image ds-image-fallback" aria-hidden="true">
        {initials(name)}
      </span>
    )
  const foldStyle = fold?.motion === 'pop' ? ({ '--pop-delay': `${fold.popDelay}s` } as CSSProperties) : undefined
  return (
    <button
      type={type}
      aria-label={variant === 'label' ? undefined : name}
      title={name}
      aria-pressed={pressed}
      inert={fold?.folded || undefined}
      className={cx(
        'ds-button',
        `ds-image-${variant}`,
        pressed && 'ds-active',
        fold?.folded && 'is-folded',
        fold?.motion === 'pop' && 'is-popping',
        fold?.motion === 'unpop' && 'is-unpopping',
        className,
      )}
      style={foldStyle || style ? { ...style, ...foldStyle } : undefined}
      {...rest}
    >
      {variant === 'set' ? <span className="ds-well">{image}</span> : image}
      {variant === 'label' && <span>{name}</span>}
    </button>
  )
}
