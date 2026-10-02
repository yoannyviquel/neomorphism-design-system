import { useId, useState, type ReactNode } from 'react'
import { IconButton } from './Button'
import { cx } from './cx'
import { Icon } from './Icon'
import type { IconName } from './icons'
import { Reveal } from './Reveal'

export interface DisclosureProps {
  /** L'intitulé de la section, toujours visible. */
  title: ReactNode
  /** Une ligne sous l'intitulé : ce que la section contient, pour décider sans déplier. */
  hint?: ReactNode
  /** Icône devant l'intitulé — celle de la destination, quand la section en suit une. */
  icon?: IconName
  /** Nom accessible du chevron ; par défaut, l'intitulé s'il est un texte. */
  toggleLabel?: string
  /** Dépliée au premier rendu, sans animation. */
  defaultOpen?: boolean
  onToggle?: (open: boolean) => void
  className?: string
  children: ReactNode
}

/**
 * Section dépliante : le système de la grille dépliante, appliqué à un contenu quelconque.
 *
 * Un intitulé, toujours visible ; dessous, le contenu replié ; dessous encore, le CHEVRON de la
 * grille — un bouton-icône, enfoncé tant que tout est affiché. Le dépli lui-même est celui de la
 * section dépliante cachée (`Reveal`) : ligne par ligne, chaque commande poppant sitôt sa place
 * faite, le repli joué à l'envers depuis le bas.
 */
export function Disclosure({ title, hint, icon, toggleLabel, defaultOpen = false, onToggle, className, children }: DisclosureProps) {
  const id = useId()
  const [ouvert, setOuvert] = useState(defaultOpen)
  const nom = toggleLabel ?? (typeof title === 'string' ? title : 'Déplier')

  return (
    <section className={cx('ds-disclosure', ouvert && 'ds-open', className)}>
      <div className="ds-disclosure-heading">
        {icon && <Icon name={icon} className="ds-disclosure-icon" />}
        <div className="ds-disclosure-titles">
          <h2 className="ds-disclosure-title">{title}</h2>
          {hint && <p className="ds-disclosure-hint">{hint}</p>}
        </div>
      </div>
      <Reveal open={ouvert} id={id}>
        {children}
      </Reveal>
      <IconButton
        icon="chevron_down"
        label={nom}
        active={ouvert}
        aria-expanded={ouvert}
        aria-controls={id}
        className="ds-fold-toggle"
        onClick={() => {
          setOuvert(!ouvert)
          onToggle?.(!ouvert)
        }}
      />
    </section>
  )
}
