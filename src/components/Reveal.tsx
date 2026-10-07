import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
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

/**
 * LA MARQUE D'UNE LIGNE SANS RELIEF, qui entre en FONDU au lieu de monter.
 *
 * `folded` n'a pas d'équivalent, et c'est voulu : « à plat au fond du creux » ne veut rien dire pour
 * un texte, qui n'est nulle part avant d'entrer — il est couvert (`data-fold-hidden`), point. Lui
 * poser quand même la marque du relief le ferait tomber sous les règles du pop, qui mettent à zéro
 * l'image d'une ligne repliée et ne la rendent qu'au pop : elle y serait restée invisible.
 */
const FONDU = { folded: null, pop: 'fade', unpop: 'unfade' } as const

/**
 * LES DEUX FAÇONS D'ENTRER, et c'est la même marque qui les commande : une ligne qui a un relief le
 * fait MONTER (pop), une ligne qui n'en a pas s'AFFICHE (fondu). Faute de commande à qui la poser,
 * la marque va alors sur la ligne elle-même.
 *
 * SANS ÇA, UN TEXTE SURGISSAIT : le retard de sa découverte réglait le QUAND — il ne paraît plus
 * pendant que le cadre s'ouvre encore —, jamais le COMMENT. Il arrivait donc d'un coup, à pleine
 * encre, là où tout le reste du DS entre par un mouvement. La même marque sert les deux familles
 * pour qu'un seul endroit (prefers-reduced-motion, l'effacement final) les tienne toutes les deux.
 */
function marquer(ligne: FoldLine, etat: 'folded' | 'pop' | 'unpop' | null) {
  const fondu = ligne.reliefs.length === 0
  const marque = etat && (fondu ? FONDU[etat] : etat)
  for (const el of fondu ? ligne.elements : ligne.reliefs) {
    if (marque) el.dataset.fold = marque
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
        // Le pop part une poussée plus tard (--pop-delay) : sitôt la place faite.
        marquer(ligne, 'pop')
        decouvertes.current = index + 1
        setHauteur(hauteurPour(index + 1, lignes, total))
        /**
         * UNE LIGNE SANS RELIEF ATTEND SA PLACE ; une ligne qui en a un se montre tout de suite.
         *
         * LA RÈGLE EST CELLE DU DS, appliquée jusqu'au bout : le cadre pousse pour faire la place
         * d'une ligne, PUIS la ligne paraît. Une commande la respecte déjà sans rien devoir à ce
         * code — elle gît à plat au fond du creux (`--pop: 0`) et ne monte qu'une poussée plus tard,
         * par `--pop-delay` ; la voir à plat FAIT PARTIE de l'effet, elle montre le fond du trou
         * qu'on est en train de creuser.
         *
         * UN TEXTE N'A RIEN À MONTRER À PLAT, et c'est tout le défaut signalé à l'usage : découvert
         * au DÉPART de la poussée, il paraissait à pleine encre pendant que le cadre s'ouvrait
         * encore. Et il se voyait, parce que `.ds-reveal` garde un `--shadow-room` de marge sous
         * `overflow: hidden` — 16 px à la densité souris, soit une ligne de texte ENTIÈRE affichée
         * avant que la hauteur n'ait bougé d'un pixel.
         *
         * LE RETARD EST EXACTEMENT CELUI DU POP, et pas un nombre à lui : les deux familles de
         * lignes paraissent donc au même instant de leur poussée, l'une en montant, l'autre en
         * s'affichant. ET C'EST CE QUI SYNCHRONISE LE FONDU : la marque `fade` est posée ici, mais
         * son animation attend `--pop-delay` — la même poussée —, si bien qu'elle démarre, à zéro
         * d'opacité, dans l'image même où la ligne se découvre. Pas de blanc, pas de saut.
         */
        if (ligne.reliefs.length === 0) plusTard(() => decouvrir(ligne), push)
        else decouvrir(ligne)
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

  /**
   * AVANT LA PEINTURE, ET C'EST LOAD-BEARING : `replie` se calcule au RENDU (`!open && mouvement
   * === null`), si bien que le rendu qui ouvre la section retire déjà `ds-folded` et `inert` — le
   * contenu redevient visible —, alors que c'est CET effet qui pose les marques de dépli ligne par
   * ligne. En effet PASSIF, le navigateur peignait entre les deux : une bande de texte à pleine
   * encre apparaissait AVANT que le cadre ne s'ouvre, puis disparaissait quand `couvrir` tombait,
   * puis revenait avec la première poussée.
   *
   * ET ELLE SE VOIT VRAIMENT, parce que le cadre est plus grand que sa hauteur : `.ds-reveal` est en
   * `box-sizing: content-box` avec `padding: var(--shadow-room)` sous `overflow: hidden` (la marge
   * qui laisse les ombres s'étaler). Même à hauteur nulle, il reste une fenêtre d'un `--shadow-room`
   * — 16 px à la densité souris, soit une ligne de texte entière.
   *
   * LE REPLI AVAIT LE MÊME DÉFAUT, en miroir : `replie` redevient vrai au rendu qui ferme, donc le
   * contenu était caché net AVANT que le cadre n'ait commencé à remonter — il se rétractait sur du
   * vide.
   *
   * `useLayoutEffect` écrit donc les marques dans la même image que le changement d'état. La mesure
   * y est valide : les `getBoundingClientRect` de `foldLines` forcent la mise en page, qui est déjà
   * à jour à ce moment-là.
   */
  useLayoutEffect(() => {
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
