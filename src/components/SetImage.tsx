import { useState, type CSSProperties } from 'react'
import { cx } from './cx'
import { initials } from './initials'

export interface SetImageProps {
  /** Le nom : nom accessible de l'image, et ses initiales quand elle manque. */
  name: string
  /** L'image ; à défaut, ou si elle ne charge pas, les initiales du nom. */
  src?: string | null
  /** Le côté, en pixels ; par défaut celui du chaton d'un bouton serti. */
  size?: number
  /** L'image double un nom écrit à côté : les lecteurs d'écran la sautent. */
  decorative?: boolean
  className?: string
}

/**
 * Image sertie hors bouton : un portrait, une vignette qu'on montre sans rien commander. Elle est
 * incrustée dans un chaton, le même creux fixe que celui d'un bouton serti, sans la surface du
 * bouton autour : ce qui ne se touche pas n'a pas de relief, seulement le creux qui la tient.
 */
export function SetImage({ name, src, size, decorative, className }: SetImageProps) {
  const [failed, setFailed] = useState<string | null>(null)
  const style = size ? ({ '--set-image-size': `${size}px` } as CSSProperties) : undefined
  return (
    <span
      className={cx('ds-well', 'ds-set-image', className)}
      style={style}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
    >
      {src && src !== failed ? (
        <img className="ds-image" src={src} alt="" loading="lazy" decoding="async" draggable={false} onError={() => setFailed(src)} />
      ) : (
        <span className="ds-image ds-image-fallback">{initials(name)}</span>
      )}
    </span>
  )
}
