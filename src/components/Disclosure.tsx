import { useId, useRef, useState, type ReactNode } from 'react'
import { Button } from './Button'
import { cx } from './cx'
import { Icon } from './Icon'
import type { IconName } from './icons'
import { prefersReducedMotion } from '../fold/motion'

export interface DisclosureProps {
  /** L'intitulé du groupe, dans l'en-tête. */
  title: ReactNode
  /** Une ligne sous l'intitulé : ce que le groupe règle, pour décider sans ouvrir. */
  hint?: ReactNode
  /** Icône devant l'intitulé — celle de la destination, quand le groupe en suit une. */
  icon?: IconName
  /** Ouverte au premier rendu (non contrôlée). */
  defaultOpen?: boolean
  /** Contrôlée : passer `open` ET `onToggle`. Sans `open`, la section se garde elle-même. */
  open?: boolean
  onToggle?: (open: boolean) => void
  className?: string
  children: ReactNode
}

/**
 * Section dépliante : un en-tête qui s'actionne, un contenu qui se déplie dessous.
 *
 * L'en-tête est un BOUTON du DS, et la règle de relief s'applique sans exception : en relief
 * replié — il se presse —, enfoncé déplié, puisque c'est son état actif. On lit donc d'un coup
 * d'œil quelles sections sont ouvertes, à la même lumière que le reste de l'écran.
 *
 * Le contenu n'est pas une zone : pas de bordure, pas de cadre. Il appartient à la section qui le
 * déplie, et c'est l'en-tête enfoncé juste au-dessus qui le dit.
 *
 * Le dépli pousse la suite de la page comme le fait la grille dépliante, du même mouvement et de
 * la même durée : la hauteur est mesurée puis animée, et rendue à `auto` une fois posée, faute de
 * quoi un contenu qui grandit (un formulaire qui s'allonge) resterait coupé.
 *
 * Replié, le contenu est `inert` : ni doigt, ni focus, ni lecteur d'écran — une commande cachée
 * qu'on atteint à la tabulation est pire qu'absente.
 */
export function Disclosure({ title, hint, icon, defaultOpen = false, open, onToggle, className, children }: DisclosureProps) {
  const id = useId()
  const corps = useRef<HTMLDivElement>(null)
  const [interne, setInterne] = useState(defaultOpen)
  const ouvert = open ?? interne
  // `undefined` veut dire « auto » : la hauteur n'est fixée que le temps de l'animation.
  const [hauteur, setHauteur] = useState<number | undefined>(ouvert ? undefined : 0)
  const [anime, setAnime] = useState(false)

  function basculer() {
    const ouvrant = !ouvert
    if (open === undefined) setInterne(ouvrant)
    onToggle?.(ouvrant)

    const el = corps.current
    if (!el || prefersReducedMotion()) {
      setHauteur(ouvrant ? undefined : 0)
      return
    }

    setAnime(true)
    if (ouvrant) {
      // De 0 à sa taille : `inert` vient de tomber, le contenu est mesurable.
      setHauteur(el.scrollHeight)
      return
    }
    // De « auto » à 0, en deux temps : une hauteur en clair, puis la descente — sans cela le
    // navigateur n'a pas de point de départ et saute.
    setHauteur(el.scrollHeight)
    requestAnimationFrame(() => requestAnimationFrame(() => setHauteur(0)))
  }

  return (
    <section className={cx('ds-disclosure', ouvert && 'ds-open', className)}>
      <Button
        className="ds-disclosure-head"
        active={ouvert}
        aria-expanded={ouvert}
        aria-controls={id}
        onClick={basculer}
      >
        {icon && <Icon name={icon} className="ds-disclosure-icon" />}
        <span className="ds-disclosure-titles">
          <span className="ds-disclosure-title">{title}</span>
          {hint && <span className="ds-disclosure-hint">{hint}</span>}
        </span>
        <Icon name="chevron_down" className="ds-disclosure-chevron" />
      </Button>
      <div
        id={id}
        ref={corps}
        className="ds-disclosure-body"
        style={{ height: hauteur }}
        inert={!ouvert && !anime}
        onTransitionEnd={(event) => {
          if (event.propertyName !== 'height' || event.target !== corps.current) return
          setAnime(false)
          if (ouvert) setHauteur(undefined)
        }}
      >
        <div className="ds-disclosure-content">{children}</div>
      </div>
    </section>
  )
}
