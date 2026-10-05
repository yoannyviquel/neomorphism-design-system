/**
 * Rythme du dépli d'une grille dépliante (FoldingGrid), ligne par ligne, tout du long : le cadre
 * s'agrandit d'une ligne (la poussée) ; sitôt sa place faite, les boutons de cette ligne « poppent »
 * — ils montent du fond au-delà de leur relief, rebondissent et s'y posent en faisant apparaître leur
 * logo —, et la poussée de la ligne suivante part en même temps. Chaque bouton porte son propre pop ;
 * les lignes le déclenchent l'une après l'autre. Le repli en est le miroir. La courbe du pop vient de
 * l'atelier « Pop du bouton » (cf. ds-pop, fold.css).
 */

/** Poussée d'une ligne, et remontée du cadre au repli, en secondes. */
export const PUSH_S = 0.3
/** Pop des boutons d'une ligne, rebonds compris, en secondes (durée des animations ds-pop). */
export const POP_S = 1

export interface FoldStep {
  /** Lignes découvertes à la fin de l'étape. */
  rows: number
  /** Moment où part sa poussée, depuis le début du dépli, en secondes. */
  at: number
}

/**
 * Le dépli, une ligne par étape : les poussées s'enchaînent, sans attendre la fin des pops.
 * `push` est la durée d'une poussée — celle de la grille par défaut ; la section dépliante la
 * raccourcit quand elle a beaucoup de lignes (cf. foldPush).
 */
export function foldSchedule(extraRows: number, push = PUSH_S): FoldStep[] {
  return Array.from({ length: Math.max(0, extraRows) }, (_, i) => ({ rows: i + 1, at: i * push }))
}

/**
 * Durée totale des poussées au-delà de laquelle elles se resserrent, en secondes : quatre lignes
 * de grille. Une grille a deux ou trois lignes à déplier ; un groupe de réglages en a trente, et
 * trente poussées de 0,3 s feraient neuf secondes d'attente. Au-delà de ce plafond, les poussées
 * se partagent le temps — le dépli reste ligne par ligne, il va plus vite.
 */
export const FOLD_MAX_S = 4 * PUSH_S
/** En deçà, une poussée ne se voit plus comme une poussée. */
export const PUSH_MIN_S = 0.04

/** Durée d'une poussée pour `rows` lignes : celle de la grille, resserrée au-delà du plafond. */
export function foldPush(rows: number): number {
  return rows <= 0 ? PUSH_S : Math.max(PUSH_MIN_S, Math.min(PUSH_S, FOLD_MAX_S / rows))
}

/** Marge avant de recouvrir une ligne repartie au fond, en secondes. */
export const SETTLE_S = 0.05

export interface FoldBackStep {
  /** Lignes encore découvertes après l'étape. */
  rows: number
  /** Moment où les boutons de la ligne rejouent leur pop à l'envers, puis où le cadre la recouvre. */
  unpopAt: number
  pullAt: number
}

/**
 * Le repli : le dépli joué à l'envers, une ligne par étape depuis le bas. Les boutons d'une ligne
 * rejouent leur pop à rebours et retournent au fond ; le cadre ne la recouvre qu'ensuite. Les pops
 * inversés partent en cascade, une ligne toutes les PUSH_S, comme au dépli.
 */
export function foldBackSchedule(extraRows: number, push = PUSH_S): FoldBackStep[] {
  return Array.from({ length: Math.max(0, extraRows) }, (_, i) => ({
    rows: extraRows - i - 1,
    unpopAt: i * push,
    // Une marge : l'animation part à l'image suivant le changement de classe ; sans elle, le cadre
    // recouvrirait des boutons pas tout à fait au fond.
    pullAt: i * push + POP_S + SETTLE_S,
  }))
}

/**
 * Le repli d'une section dépliante (Reveal, Disclosure) : il commence DÈS L'APPUI. Le cadre remonte
 * aussitôt sur la dernière ligne, au rythme des poussées, et les commandes de chaque ligne
 * retournent au fond pendant qu'il la recouvre — leur pop inversé dure une poussée (cf.
 * --unpop-duration, disclosure.css). La grille, elle, attend que ses boutons soient au fond
 * (foldBackSchedule) : ses boutons sont tout son contenu, une section a surtout autre chose à
 * ranger.
 *
 * `retractFirst` : le cadre attend que la ligne la plus basse soit rentrée — une poussée — et
 * partie (Reveal la cache alors) avant de se rétracter d'une ligne, et ainsi de suite en cascade :
 * chaque ligne rentre et part, puis le cadre remonte sur sa place vide, pendant que la suivante
 * rentre à son tour. Le bouton section dépliante se replie ainsi :
 * c'est le bouton qui se rétracte, une fois son contenu rentré.
 */
export function revealBackSchedule(extraRows: number, push = PUSH_S, retractFirst = false): FoldBackStep[] {
  return Array.from({ length: Math.max(0, extraRows) }, (_, i) => ({
    rows: extraRows - i - 1,
    unpopAt: i * push,
    pullAt: i * push + (retractFirst ? push : 0),
  }))
}
