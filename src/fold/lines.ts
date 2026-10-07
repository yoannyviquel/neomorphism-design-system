/**
 * Les LIGNES d'un contenu quelconque, pour le déplier comme une grille : une ligne par étape.
 *
 * Une grille a des lignes toutes faites ; un formulaire non. On les retrouve donc dans la mise en
 * page mesurée, en descendant dans le contenu tant qu'il y a de quoi découper :
 *
 *   - une SECTION (section, article, fieldset, form, liste) s'ouvre toujours : ses enfants sont
 *     des éléments distincts — un titre, un champ, une note ;
 *   - tout autre élément qui ne porte qu'UNE commande au plus est une ligne : un paragraphe, un
 *     titre, un champ avec son libellé — le libellé ne se sépare pas de ce qu'il nomme ;
 *   - un élément qui en porte plusieurs s'ouvre, et ses enfants se rangent en rangées d'après leur
 *     position : ceux qui se tiennent côte à côte font UNE ligne, comme une ligne de grille, et
 *     poppent ensemble ; un enfant seul sur sa rangée est visité à son tour.
 *
 * Les commandes en relief de chaque ligne — ce qui poppera — sont relevées au passage.
 */

/** Ce qui s'actionne : une commande compte pour une, quel que soit son habillage. */
const COMMANDES = 'button, input:not([type="hidden"]), select, textarea, a[href]'

/** Ce qui porte un relief et poppe : la commande telle que le DS l'habille. Un sélecteur porte le
 *  sien sur son enveloppe (le chevron grandit avec lui) ; un bouton section dépliante le porte sur
 *  la SECTION elle-même, puisque la section EST le bouton. */
export const RELIEFS = '.ds-button, .ds-disclosure-button, .ds-select, .ds-input:not(.ds-select > .ds-input), .ds-checkbox'

/** Ce qui s'ouvre toujours, quel que soit le nombre de commandes dedans. */
const SECTIONS = 'section, article, fieldset, form, ul, ol, dl'

/**
 * Ce qui est UNE commande bien que ce soit une section pleine d'autres : le bouton section
 * dépliante, dont la section EST le bouton, en relief au repos.
 *
 * SANS CETTE EXCEPTION IL SE DÉCOUPAIT, et c'est le défaut corrigé : un `<section>` s'ouvre
 * toujours, donc son en-tête et son contenu replié faisaient des lignes séparées, dont aucune ne
 * portait le relief — il est sur la section, et elle n'était plus une ligne. Il se découvrait
 * comme du TEXTE, sans rebond, alors que c'est une commande.
 *
 * L'EXCEPTION EST NOMMÉE, PAS UN RETRAIT DE `SECTIONS` : un vrai `<section>` de mise en page doit
 * continuer de s'ouvrir, et le compte des commandes ne suffisait pas à les distinguer — un bouton
 * section en contient autant que son contenu replié en cache.
 */
const COMMANDES_ENTIERES = '.ds-disclosure-button'

export interface FoldLine {
  /** Les éléments de la ligne : un seul, ou une rangée côte à côte. */
  elements: HTMLElement[]
  /** Haut et bas de la ligne, depuis le haut du contenu, en px. */
  top: number
  bottom: number
  /** Ses commandes en relief, qui poppent quand la ligne se découvre. */
  reliefs: HTMLElement[]
}

const visible = (el: Element) => el.getClientRects().length > 0

/** Les enfants qui occupent une place, `display: contents` traversé. */
function enfants(el: Element): HTMLElement[] {
  return [...el.children].flatMap((child) => {
    if (!(child instanceof HTMLElement)) return []
    if (visible(child)) return [child]
    return getComputedStyle(child).display === 'contents' ? enfants(child) : []
  })
}

function commandes(el: HTMLElement): number {
  let n = el.matches(COMMANDES) && visible(el) ? 1 : 0
  for (const c of el.querySelectorAll(COMMANDES)) if (visible(c)) n++
  return n
}

/** Range des éléments en rangées : un élément qui commence sous le bas de la rangée en ouvre une. */
function enRangees(elements: HTMLElement[]): HTMLElement[][] {
  const rangees: HTMLElement[][] = []
  let bas = -Infinity
  for (const el of elements) {
    const r = el.getBoundingClientRect()
    if (rangees.length === 0 || r.top >= bas - 1) {
      rangees.push([el])
      bas = r.bottom
    } else {
      rangees[rangees.length - 1].push(el)
      bas = Math.max(bas, r.bottom)
    }
  }
  return rangees
}

export function foldLines(racine: HTMLElement): FoldLine[] {
  const origine = racine.getBoundingClientRect().top
  const lignes: FoldLine[] = []

  const ajouter = (elements: HTMLElement[]) => {
    const rects = elements.map((el) => el.getBoundingClientRect())
    const reliefs = elements
      .flatMap((el) => [...(el.matches(RELIEFS) ? [el] : []), ...el.querySelectorAll<HTMLElement>(RELIEFS)])
      // Une commande entière poppe D'UN BLOC : ce qu'elle cache repliée n'a pas de pop à elle, et
      // le jouer quand même ferait rebondir des commandes invisibles dans une commande qui monte.
      .filter((el) => visible(el) && !el.parentElement?.closest(COMMANDES_ENTIERES))
    lignes.push({
      elements,
      top: Math.min(...rects.map((r) => r.top)) - origine,
      bottom: Math.max(...rects.map((r) => r.bottom)) - origine,
      reliefs,
    })
  }

  const visiter = (el: HTMLElement) => {
    // Une commande entière ne se descend pas : elle est la ligne, quoi qu'elle contienne.
    if (el.matches(COMMANDES_ENTIERES)) {
      ajouter([el])
      return
    }
    const dedans = enfants(el)
    if (dedans.length === 0 || (!el.matches(SECTIONS) && commandes(el) <= 1)) {
      ajouter([el])
      return
    }
    ranger(dedans)
  }

  const ranger = (elements: HTMLElement[]) => {
    for (const rangee of enRangees(elements)) {
      if (rangee.length === 1) visiter(rangee[0])
      else ajouter(rangee)
    }
  }

  ranger(enfants(racine))
  return lignes
}
