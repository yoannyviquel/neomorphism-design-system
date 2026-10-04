import { useId, useState, type ReactNode } from 'react'
import { IconButton } from './Button'
import { cx } from './cx'
import { Icon } from './Icon'
import type { IconName } from './icons'
import { Reveal } from './Reveal'
import { Shade } from './Shade'
import { usePress } from './usePress'

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
  /** Dépliée ou non, quand c'est l'app qui en décide (une seule section ouverte à la fois, un
   *  repli après enregistrement…). Le chevron appelle alors `onToggle`, et l'app suit. */
  open?: boolean
  /** Dépliée, la section S'ENFONCE tout entière — intitulé, contenu et chevron —, comme un élément
   *  choisi (`Selectable`) : du même creux, au même rebond. Elle remonte à la FIN du repli, une
   *  fois le contenu rentré, pas au premier appui. */
  sunken?: boolean
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
 *
 * `sunken` : dépliée, la section s'enfonce tout entière, du creux d'un élément choisi
 * (`Selectable`) — l'ouverture se lit au relief de la région, plus seulement à celui du chevron.
 * Au repli, elle reste enfoncée le temps que le contenu rentre, et ne remonte qu'à la fin.
 * Repliée, elle est à plat, alignée sur ses voisines : le creux a sa marge d'avance.
 */
/** L'état d'une section dépliante : dépliée ou non — par elle-même, ou par l'app (`open`) —, et
 *  enfoncée dès le dépli et jusqu'à la fin du repli : le creux tient le temps que le contenu rentre,
 *  puis la section remonte, à plat. */
function useDepli(defaultOpen: boolean, open: boolean | undefined, onToggle?: (open: boolean) => void) {
  const id = useId()
  const [interne, setInterne] = useState(defaultOpen)
  const ouvert = open ?? interne
  const [enfoncee, setEnfoncee] = useState(ouvert)
  // Dépliée par l'app : enfoncée aussitôt, sans attendre un effet — au même rendu que le dépli.
  if (ouvert && !enfoncee) setEnfoncee(true)
  return {
    id,
    ouvert,
    creuse: ouvert || enfoncee,
    basculer: () => {
      if (open === undefined) setInterne(!ouvert)
      onToggle?.(!ouvert)
    },
    replie: () => setEnfoncee(false),
  }
}

export function Disclosure({ title, hint, icon, toggleLabel, defaultOpen = false, open, sunken = false, onToggle, className, children }: DisclosureProps) {
  const { id, ouvert, creuse, basculer, replie } = useDepli(defaultOpen, open, onToggle)
  const nom = toggleLabel ?? (typeof title === 'string' ? title : 'Déplier')

  return (
    <section
      className={cx('ds-disclosure', ouvert && 'ds-open', sunken && 'ds-selectable ds-disclosure-sunken', className)}
      data-selected={sunken && creuse ? '' : undefined}
    >
      <div className="ds-disclosure-heading">
        {icon && <Icon name={icon} className="ds-disclosure-icon" />}
        <div className="ds-disclosure-titles">
          <h2 className="ds-disclosure-title">{title}</h2>
          {hint && <p className="ds-disclosure-hint">{hint}</p>}
        </div>
      </div>
      <Reveal open={ouvert} id={id} onFolded={replie}>
        {children}
      </Reveal>
      <IconButton
        icon="chevron_down"
        label={nom}
        active={ouvert}
        aria-expanded={ouvert}
        aria-controls={id}
        className="ds-fold-toggle"
        onClick={basculer}
      />
    </section>
  )
}

export interface DisclosureButtonProps {
  /** L'intitulé, dans le bouton. */
  title: ReactNode
  /** Une ligne sous l'intitulé, dans le bouton : ce que la section contient. */
  hint?: ReactNode
  /** Icône devant l'intitulé. */
  icon?: IconName
  /** Dépliée au premier rendu, sans animation. */
  defaultOpen?: boolean
  /** Dépliée ou non, quand c'est l'app qui en décide ; l'en-tête appelle alors `onToggle`. */
  open?: boolean
  onToggle?: (open: boolean) => void
  className?: string
  children: ReactNode
}

/**
 * Le BOUTON SECTION DÉPLIANTE : la section EST le bouton. Au repos, un bouton large en relief, de
 * toute la largeur, qui ne montre que son en-tête — icône, intitulé, indication, et un chevron.
 * Un appui sur l'en-tête ENFONCE le bouton tout entier, du creux et du rebond d'un bouton à bascule,
 * et le déplie : le contenu paraît DANS le bouton, sous l'en-tête, dans le même creux. Un second
 * appui le replie ; le bouton remonte en relief une fois le contenu rentré.
 *
 * Seul l'en-tête s'actionne (un `<button>` à bascule, `aria-expanded`) : le contenu, qui porte ses
 * propres commandes, ne peut pas être dans un bouton. Le relief est donc celui de la section, sur
 * son calque d'ombre (`Shade`), qui suit --sink comme celui d'un bouton.
 */
export function DisclosureButton({ title, hint, icon, defaultOpen = false, open, onToggle, className, children }: DisclosureButtonProps) {
  const { id, ouvert, creuse, basculer, replie } = useDepli(defaultOpen, open, onToggle)
  const { pressed, handlers } = usePress({})

  return (
    <section className={cx('ds-disclosure', 'ds-disclosure-button', ouvert && 'ds-open', creuse && 'ds-active', pressed && 'ds-pressed', className)}>
      <Shade />
      <button type="button" aria-expanded={ouvert} aria-controls={id} className="ds-disclosure-trigger" onClick={basculer} {...handlers}>
        {icon && <Icon name={icon} className="ds-disclosure-icon" />}
        <span className="ds-disclosure-titles">
          <span className="ds-disclosure-title">{title}</span>
          {hint && <span className="ds-disclosure-hint">{hint}</span>}
        </span>
        <Icon name="chevron_down" className="ds-disclosure-chevron" />
      </button>
      <Reveal open={ouvert} id={id} onFolded={replie}>
        {children}
      </Reveal>
    </section>
  )
}
