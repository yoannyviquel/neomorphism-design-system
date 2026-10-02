import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Button, IconButton, type IconButtonProps } from './Button'
import { cx } from './cx'

/** Le temps d'un second appui, après quoi le bouton désarme de lui-même. */
export const DELETE_ARM_MS = 3000

export interface DeleteButtonProps extends Omit<IconButtonProps, 'icon' | 'tone' | 'active' | 'onClick'> {
  /** Appelé au SECOND appui, celui qui confirme. */
  onDelete: () => void
  /** Nom accessible une fois armé ; par défaut « Confirmer : » suivi du nom. */
  confirmLabel?: string
  /** Le nom AFFICHÉ à côté de la poubelle : un bouton à libellé (« Tout effacer ») au lieu d'un
   *  bouton-icône. Le libellé suit la poubelle : à l'encre au repos, au rouge une fois armé. */
  withLabel?: boolean
  /** Taille du bouton à libellé (sans effet sur le bouton-icône). */
  size?: 'md' | 'sm'
}

/**
 * Le bouton qui supprime, en deux appuis, sans boîte de dialogue.
 *
 * Au repos, un bouton-icône comme les autres : la poubelle, à l'encre des commandes — et non en
 * rouge, qui ferait de chaque ligne d'une liste une alerte. Le PREMIER appui le fait rebondir,
 * comme tout bouton, et l'ARME : la poubelle passe au rouge du danger. Le SECOND supprime. Rien
 * d'autre ne bouge à l'écran : la confirmation est là où était le doigt.
 *
 * Armé, il désarme de lui-même au bout de `DELETE_ARM_MS`, ou dès qu'on touche ailleurs : un appui
 * oublié ne doit pas laisser un piège pour plus tard. Son nom accessible devient « Confirmer : … »,
 * pour qu'un lecteur d'écran sache que le prochain appui supprime.
 *
 * Avec `withLabel`, c'est un bouton à libellé — la poubelle, puis le nom —, pour une suppression
 * qui doit se lire avant d'être touchée (« Tout effacer ») : même geste, même rouge, poubelle ET
 * libellé.
 */
export function DeleteButton({ onDelete, label, confirmLabel, withLabel = false, size = 'md', large, className, disabled, ...rest }: DeleteButtonProps) {
  const [armed, setArmed] = useState(false)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!armed) return
    const timer = window.setTimeout(() => setArmed(false), DELETE_ARM_MS)
    // Un appui ailleurs désarme. À la capture, avant que l'autre commande ne réagisse.
    const elsewhere = (event: PointerEvent) => {
      if (!button.current?.contains(event.target as Node)) setArmed(false)
    }
    document.addEventListener('pointerdown', elsewhere, true)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('pointerdown', elsewhere, true)
    }
  }, [armed])

  // Désactivé, il ne montre pas une confirmation en suspens : l'état se déduit, sans effet.
  const shown = armed && !disabled

  const accessibleName = shown ? (confirmLabel ?? `Confirmer : ${label}`) : label
  const classes = cx('ds-delete', shown && 'ds-armed', className)
  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    // L'élément, retenu à l'appui : c'est lui qu'un appui « ailleurs » doit éviter.
    button.current = event.currentTarget
    if (shown) {
      setArmed(false)
      onDelete()
    } else {
      setArmed(true)
    }
  }

  if (withLabel) {
    return (
      <Button icon="delete" size={size} aria-label={accessibleName} className={classes} disabled={disabled} onClick={onClick} {...rest}>
        {label}
      </Button>
    )
  }
  return <IconButton icon="delete" label={accessibleName} large={large} className={classes} disabled={disabled} onClick={onClick} {...rest} />
}