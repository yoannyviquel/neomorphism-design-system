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

/** Le dépli, une ligne par étape : les poussées s'enchaînent, sans attendre la fin des pops. */
export function foldSchedule(extraRows: number): FoldStep[] {
  return Array.from({ length: Math.max(0, extraRows) }, (_, i) => ({ rows: i + 1, at: i * PUSH_S }))
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
export function foldBackSchedule(extraRows: number): FoldBackStep[] {
  return Array.from({ length: Math.max(0, extraRows) }, (_, i) => ({
    rows: extraRows - i - 1,
    unpopAt: i * PUSH_S,
    // Une marge : l'animation part à l'image suivant le changement de classe ; sans elle, le cadre
    // recouvrirait des boutons pas tout à fait au fond.
    pullAt: i * PUSH_S + POP_S + SETTLE_S,
  }))
}
