import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { foldLines, type FoldLine } from '../fold/lines'
import { prefersReducedMotion } from '../fold/motion'
import { foldPush, foldSchedule, POP_S, PUSH_S, revealBackSchedule } from '../fold/schedule'
import { cx } from './cx'

export interface RevealProps {
  /** Déplié. Chaque changement joue le dépli ou le repli ; au premier rendu, l'état est pris tel quel. */
  open: boolean
  /** Identifiant du contenu, pour l'`aria-controls` de ce qui le commande. */
  id?: string
  /** Appelé quand un repli est TERMINÉ — la dernière ligne recouverte, le cadre à zéro —, pas quand
   *  il commence : ce qui doit suivre la fin du repli (une section qui cesse d'être enfoncée) attend
   *  ce moment. Un dépli repris avant la fin ne l'appelle pas. */
  onFolded?: () => void
  /** Au repli, chaque ligne, depuis le bas, rentre puis disparaît, et le cadre ne se rétracte
   *  d'une ligne qu'une fois elle partie (cf. revealBackSchedule). Sans lui, le cadre remonte dès
   *  l'appui, sur des lignes encore là. */
  retractFirst?: boolean
  className?: string
  children: ReactNode
}

/** Les marques posées sur le contenu le temps d'une animation : des attributs, que React ne
 *  réécrit pas — une classe ajoutée à la main sauterait au premier rendu du bouton qui la porte. */
const CACHEE = 'data-fold-hidden'

/** Au repli, la première remontée attend une image, le temps que la hauteur de départ soit peinte :
 *  sans elle, la transition sauterait de « auto » à la hauteur d'arrivée. */
const DEPART = 0.02

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
 * La SECTION DÉPLIANTE CACHÉE : le dépli d'une section dépliante, sans intitulé ni chevron —
 * c'est l'état qui la commande. Ce qui doit paraître quand il y a lieu (les actions d'une
 * sélection, un message qui s'impose) paraît ainsi comme tout ce qui se déplie dans le DS, au lieu
 * de surgir d'une image à l'autre.
 *
 * Le dépli va LIGNE PAR LIGNE, comme celui de la grille : le cadre pousse la suite de la page pour
 * faire la place d'une ligne, puis les commandes de cette ligne POPPENT — elles montent du fond
 * au-delà de leur relief, rebondissent et s'y posent —, pendant que la ligne suivante se découvre.
 * Le repli est le dépli joué à l'envers, depuis le bas, et part DÈS L'APPUI : le cadre remonte
 * aussitôt, les commandes de chaque ligne retournant au fond pendant qu'il la recouvre (cf.
 * revealBackSchedule).
 *
 * Les lignes d'un contenu ne sont pas données comme celles d'une grille : elles sont relevées dans
 * la mise en page mesurée (cf. foldLines) — un titre, un champ avec son libellé, une note, ou une
 * rangée de commandes côte à côte, qui poppent ensemble. Un texte se découvre sans popper : seul ce
 * qui s'actionne a un relief à reprendre. Au-delà de quelques lignes, les poussées se resserrent
 * pour que le dépli entier tienne dans le temps de quatre lignes de grille (cf. foldPush).
 *
 * Replié, le contenu reste monté — on le mesure pour le déplier —, mais caché et `inert`. Sous
 * `prefers-reduced-motion`, tout est immédiat.
 *
 * C'est le moteur de `Disclosure`, qui y ajoute l'intitulé et le chevron.
 */
export function Reveal({ open, id, onFolded, retractFirst = false, className, children }: RevealProps) {
  const contenu = useRef<HTMLDivElement>(null)
  // Le dernier rappel reçu : les minuteries d'un repli lancé plus tôt appellent celui du moment.
  const replieRappel = useRef(onFolded)
  useEffect(() => {
    replieRappel.current = onFolded
  })
  const [mouvement, setMouvement] = useState<'opening' | 'closing' | null>(null)
  // `undefined` veut dire « auto » : la hauteur n'est fixée que le temps d'une animation.
  const [hauteur, setHauteur] = useState<number | undefined>(open ? undefined : 0)
  const [pousse, setPousse] = useState(PUSH_S)
  // Combien de lignes sont découvertes — l'infini quand tout l'est, le contenu pouvant grandir.
  const decouvertes = useRef(open ? Infinity : 0)
  const timers = useRef<number[]>([])
  // L'état déjà joué : le premier rendu le prend tel quel, et le double appel des effets en mode
  // strict ne rejoue rien.
  const joue = useRef(open)

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
    const el = contenu.current
    const lignes = el ? foldLines(el) : []
    if (!el || lignes.length === 0 || prefersReducedMotion()) {
      lignes.forEach(couvrir)
      decouvertes.current = 0
      setMouvement(null)
      setHauteur(0)
      replieRappel.current?.()
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
    // De « auto » à une hauteur en clair : le point de départ de la première remontée, qui part
    // dès l'image suivante (la transition a besoin de ce point de départ peint).
    setHauteur(hauteurPour(deja, lignes, total))

    const etapes = revealBackSchedule(deja, push, retractFirst)
    for (const etape of etapes) {
      // La ligne qui s'en va est la dernière encore découverte : ses commandes rentrent, puis le
      // cadre la recouvre — au même instant, ou une fois rentrée (`retractFirst`).
      const ligne = lignes[etape.rows]
      plusTard(() => marquer(ligne, 'unpop'), etape.unpopAt + DEPART)
      plusTard(() => {
        decouvertes.current = etape.rows
        setHauteur(hauteurPour(etape.rows, lignes, total))
      }, etape.pullAt + DEPART)
      // Recouverte : elle disparaît aussi de la marge qui laisse voir les ombres. Avec
      // `retractFirst`, elle disparaît dès qu'elle est rentrée, AVANT que le cadre ne remonte : le
      // cadre ne se rétracte d'une ligne qu'une fois la ligne partie, sur une place vide.
      plusTard(() => couvrir(ligne), etape.pullAt + DEPART + (retractFirst ? 0 : push))
    }
    const derniere = etapes[etapes.length - 1]
    // Les marques restent : le contenu replié est caché, et le prochain dépli les repose toutes.
    plusTard(() => {
      setMouvement(null)
      replieRappel.current?.()
    }, (derniere ? derniere.pullAt + DEPART + push : 0) + 0.05)
  }

  useEffect(() => {
    if (joue.current === open) return
    joue.current = open
    if (open) deplier()
    else replier()
    // deplier et replier ne lisent que des références : seul `open` déclenche.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const replie = !open && mouvement === null
  const cadre = { height: hauteur, '--fold-duration': `${pousse}s`, '--pop-delay': `${pousse}s`, '--unpop-duration': `${pousse}s` } as CSSProperties

  return (
    <div className={cx('ds-reveal', className)} style={cadre}>
      <div id={id} ref={contenu} className={cx('ds-reveal-content', replie && 'ds-folded')} inert={replie}>
        {children}
      </div>
    </div>
  )
}
