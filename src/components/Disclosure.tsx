import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { foldLines, type FoldLine } from '../fold/lines'
import { prefersReducedMotion } from '../fold/motion'
import { foldBackSchedule, foldPush, foldSchedule, POP_S, PUSH_S } from '../fold/schedule'
import { IconButton } from './Button'
import { cx } from './cx'
import { Icon } from './Icon'
import type { IconName } from './icons'

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

/** Les marques posées sur le contenu le temps d'une animation : des attributs, que React ne
 *  réécrit pas — une classe ajoutée à la main sauterait au premier rendu du bouton qui la porte. */
const CACHEE = 'data-fold-hidden'

function decouvrir(ligne: FoldLine) {
  for (const el of ligne.elements) el.removeAttribute(CACHEE)
}

function couvrir(ligne: FoldLine) {
  for (const el of ligne.elements) el.setAttribute(CACHEE, '')
}

function marquer(ligne: FoldLine, etat: 'folded' | 'pop' | 'unpop' | null) {
  for (const el of ligne.reliefs) {
    if (etat) el.dataset.fold = etat
    else delete el.dataset.fold
  }
}

/** Hauteur du cadre quand `n` lignes sont découvertes : jusqu'au bas de la dernière ; toutes, le
 *  contenu entier, marges comprises. */
function hauteurPour(n: number, lignes: FoldLine[], total: number): number {
  if (n <= 0) return 0
  if (n >= lignes.length) return total
  return Math.max(...lignes.slice(0, n).map((ligne) => ligne.bottom))
}

/**
 * Section dépliante : le système de la grille dépliante, appliqué à un contenu quelconque.
 *
 * Un intitulé, toujours visible ; dessous, le contenu replié ; dessous encore, le CHEVRON de la
 * grille — un bouton-icône, enfoncé tant que tout est affiché. Le dépli va LIGNE PAR LIGNE : le
 * cadre pousse la suite de la page pour faire la place d'une ligne, puis les commandes de cette
 * ligne POPPENT — elles montent du fond au-delà de leur relief, rebondissent et s'y posent —,
 * pendant que la ligne suivante se découvre. Le repli est le dépli joué à l'envers, depuis le bas.
 *
 * Les lignes d'un formulaire ne sont pas données comme celles d'une grille : elles sont relevées
 * dans la mise en page mesurée (cf. foldLines) — un titre, un champ avec son libellé, une note,
 * ou une rangée de commandes côte à côte, qui poppent ensemble. Un texte se découvre sans popper :
 * seul ce qui s'actionne a un relief à reprendre.
 *
 * Au-delà de quelques lignes, les poussées se resserrent pour que le dépli entier tienne dans le
 * temps de quatre lignes de grille (cf. foldPush) : trente poussées de 0,3 s feraient neuf secondes.
 *
 * Repliée, le contenu est caché et `inert`. Sous `prefers-reduced-motion`, tout est immédiat.
 */
export function Disclosure({ title, hint, icon, toggleLabel, defaultOpen = false, onToggle, className, children }: DisclosureProps) {
  const id = useId()
  const contenu = useRef<HTMLDivElement>(null)
  const [ouvert, setOuvert] = useState(defaultOpen)
  const [mouvement, setMouvement] = useState<'opening' | 'closing' | null>(null)
  // `undefined` veut dire « auto » : la hauteur n'est fixée que le temps d'une animation.
  const [hauteur, setHauteur] = useState<number | undefined>(defaultOpen ? undefined : 0)
  const [pousse, setPousse] = useState(PUSH_S)
  // Combien de lignes sont découvertes — l'infini quand tout l'est, le contenu pouvant grandir.
  const decouvertes = useRef(defaultOpen ? Infinity : 0)
  const timers = useRef<number[]>([])

  const annuler = () => {
    for (const timer of timers.current) window.clearTimeout(timer)
    timers.current = []
  }
  useEffect(() => annuler, [])

  const plusTard = (fn: () => void, secondes: number) => timers.current.push(window.setTimeout(fn, secondes * 1000))

  /** Toutes les marques retirées : chaque ligne découverte, chaque commande à son relief. */
  const effacer = (lignes: FoldLine[]) => {
    for (const ligne of lignes) {
      decouvrir(ligne)
      marquer(ligne, null)
    }
  }

  function deplier() {
    annuler()
    setOuvert(true)
    onToggle?.(true)
    const el = contenu.current
    const lignes = el ? foldLines(el) : []
    if (!el || lignes.length === 0 || prefersReducedMotion()) {
      effacer(lignes)
      decouvertes.current = Infinity
      setMouvement(null)
      setHauteur(undefined)
      return
    }

    // Reprise possible d'un repli en cours : les lignes encore découvertes restent où elles sont.
    const deja = Math.min(decouvertes.current, lignes.length)
    const restantes = lignes.length - deja
    const push = foldPush(restantes)
    const total = el.offsetHeight
    lignes.forEach((ligne, index) => {
      if (index < deja) {
        decouvrir(ligne)
        marquer(ligne, null)
      } else {
        // À découvrir : cachée, et à plat — elle n'a pas encore popé.
        couvrir(ligne)
        marquer(ligne, 'folded')
      }
    })
    setPousse(push)
    setMouvement('opening')
    setHauteur(hauteurPour(deja, lignes, total))

    // Une marge, comme la grille : les marques posées sont peintes avant la première poussée.
    const debut = 0.05
    const etapes = foldSchedule(restantes, push)
    for (const etape of etapes) {
      plusTard(() => {
        const index = deja + etape.rows - 1
        const ligne = lignes[index]
        decouvrir(ligne)
        // Le pop part une poussée plus tard (--pop-delay) : sitôt la place faite.
        marquer(ligne, 'pop')
        decouvertes.current = index + 1
        setHauteur(hauteurPour(index + 1, lignes, total))
      }, debut + etape.at)
    }
    const derniere = etapes[etapes.length - 1]
    plusTard(() => {
      effacer(lignes)
      decouvertes.current = Infinity
      setMouvement(null)
      setHauteur(undefined)
    }, debut + (derniere ? derniere.at + push + POP_S : 0) + 0.05)
  }

  function replier() {
    annuler()
    setOuvert(false)
    onToggle?.(false)
    const el = contenu.current
    const lignes = el ? foldLines(el) : []
    if (!el || lignes.length === 0 || prefersReducedMotion()) {
      lignes.forEach(couvrir)
      decouvertes.current = 0
      setMouvement(null)
      setHauteur(0)
      return
    }

    const deja = Math.min(decouvertes.current, lignes.length)
    const push = foldPush(deja)
    const total = el.offsetHeight
    lignes.forEach((ligne, index) => {
      if (index < deja) decouvrir(ligne)
      else {
        couvrir(ligne)
        marquer(ligne, 'folded')
      }
    })
    setPousse(push)
    setMouvement('closing')
    // De « auto » à une hauteur en clair : le point de départ de la première remontée.
    setHauteur(hauteurPour(deja, lignes, total))

    const etapes = foldBackSchedule(deja, push)
    for (const etape of etapes) {
      // La ligne qui s'en va est la dernière encore découverte.
      const ligne = lignes[etape.rows]
      plusTard(() => marquer(ligne, 'unpop'), etape.unpopAt)
      plusTard(() => {
        decouvertes.current = etape.rows
        setHauteur(hauteurPour(etape.rows, lignes, total))
      }, etape.pullAt)
      // Recouverte : elle disparaît aussi de la marge qui laisse voir les ombres.
      plusTard(() => couvrir(ligne), etape.pullAt + push)
    }
    const derniere = etapes[etapes.length - 1]
    // Les marques restent : le contenu replié est caché, et le prochain dépli les repose toutes.
    plusTard(() => setMouvement(null), (derniere ? derniere.pullAt + push : 0) + 0.05)
  }

  const replie = !ouvert && mouvement === null
  const cadre = { height: hauteur, '--fold-duration': `${pousse}s`, '--pop-delay': `${pousse}s` } as CSSProperties
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
      <div className="ds-disclosure-frame" style={cadre}>
        <div id={id} ref={contenu} className={cx('ds-disclosure-content', replie && 'ds-folded')} inert={replie}>
          {children}
        </div>
      </div>
      <IconButton
        icon="chevron_down"
        label={nom}
        active={ouvert}
        aria-expanded={ouvert}
        aria-controls={id}
        className="ds-fold-toggle"
        onClick={() => (ouvert ? replier() : deplier())}
      />
    </section>
  )
}
