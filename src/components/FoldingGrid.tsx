import { Fragment, useEffect, useRef, useState, type CSSProperties, type Key, type ReactNode } from 'react'
import { prefersReducedMotion } from '../fold/motion'
import { foldBackSchedule, foldSchedule, POP_S, PUSH_S } from '../fold/schedule'
import { useGridLayout } from '../fold/useGridLayout'
import { IconButton } from './Button'
import type { FoldItemState } from './ImageButton'

/** Colonnes supposées tant que la grille n'est pas mesurée (4 tiennent sur un téléphone). */
export const FALLBACK_COLUMNS = 4

export interface FoldingGridProps<T> {
  items: readonly T[]
  getKey: (item: T) => Key
  /** Dessine un élément ; passer `fold` au bouton (ImageButton) le fait popper avec la grille. */
  renderItem: (item: T, fold: FoldItemState) => ReactNode
  /**
   * Ce qui reste toujours visible, repliée : la grille garde autant de lignes qu'il en faut pour le
   * dernier de ces éléments (une au moins). À placer en tête de `items`.
   */
  keepVisible?: (item: T) => boolean
  /** Nom accessible du chevron qui déplie. */
  toggleLabel: string
  /** Largeur minimale d'une cellule (par défaut, le côté d'une tuile à image). */
  cellSize?: number
  className?: string
}

/**
 * Grille dépliante. Repliée, une ligne (ou celles de `keepVisible`) ; un chevron la déplie, et reste
 * enfoncé tant que tout est affiché. Le dépli va ligne par ligne : le cadre pousse la suite de la page
 * pour faire la place d'une ligne, puis ses boutons poppent pendant que la ligne suivante se découvre ;
 * le repli est le dépli joué à l'envers. Sans mise en page mesurable, ou sous
 * `prefers-reduced-motion`, tout est immédiat.
 */
export function FoldingGrid<T>({ items, getKey, renderItem, keepVisible, toggleLabel, cellSize, className }: FoldingGridProps<T>) {
  // Dépliée (ce que dit le chevron, enfoncé), et combien de lignes du dessous sont découvertes.
  const [open, setOpen] = useState(false)
  const [revealed, setRevealed] = useState(0)
  // Au repli, les lignes pas encore reparties au fond : une ligne y retourne avant d'être recouverte.
  const [lit, setLit] = useState(0)
  // Les lignes du bas ne sont rendues qu'une fois la grille dépliée, puis restent là, repliées sous le
  // cadre : c'est ce qui les laisse popper à l'ouverture et repartir au fond à la fermeture.
  const [unfolded, setUnfolded] = useState(false)
  const [motion, setMotion] = useState<'opening' | 'closing' | null>(null)
  const timers = useRef<number[]>([])
  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
  }
  useEffect(() => clearTimers, [])
  const [grid, setGrid] = useState<HTMLDivElement | null>(null)
  const layout = useGridLayout(grid)
  const row = layout?.columns ?? FALLBACK_COLUMNS

  const lastKept = keepVisible ? items.reduce((last, item, index) => (keepVisible(item) ? index : last), -1) : -1
  const rows = Math.ceil(items.length / row)
  const foldedRows = Math.min(rows, Math.max(1, Math.ceil((lastKept + 1) / row)))
  const foldedCount = foldedRows * row
  const extraRows = rows - foldedRows
  const rendered = unfolded ? items : items.slice(0, foldedCount)

  const visibleRows = open && motion !== 'opening' ? rows : foldedRows + revealed
  const litRows = motion === 'closing' ? foldedRows + lit : visibleRows
  const heightFor = (count: number) => (layout ? layout.rowHeight + (Math.max(1, count) - 1) * layout.step : 0)
  const frameHeight = layout ? heightFor(visibleRows) : undefined

  const later = (fn: () => void, seconds: number) => timers.current.push(window.setTimeout(fn, seconds * 1000))

  const unfold = () => {
    setOpen(true)
    setUnfolded(true)
    if (!layout || prefersReducedMotion()) {
      setRevealed(extraRows)
      return
    }
    // Les lignes du bas arrivent d'abord à plat, cachées ; les étapes commencent une fois peintes.
    setMotion('opening')
    setRevealed(0)
    const start = 0.05
    const steps = foldSchedule(extraRows)
    for (const step of steps) later(() => setRevealed(step.rows), start + step.at)
    const last = steps[steps.length - 1]
    later(() => setMotion(null), start + (last ? last.at + PUSH_S + POP_S : 0) + 0.05)
  }

  const fold = () => {
    setOpen(false)
    if (!layout || prefersReducedMotion()) {
      setRevealed(0)
      setMotion(null)
      return
    }
    setMotion('closing')
    setRevealed(extraRows)
    setLit(extraRows)
    const steps = foldBackSchedule(extraRows)
    for (const step of steps) {
      later(() => setLit(step.rows), step.unpopAt)
      later(() => setRevealed(step.rows), step.pullAt)
    }
    const last = steps[steps.length - 1]
    later(() => setMotion(null), (last ? last.pullAt + PUSH_S : 0) + 0.05)
  }

  const frameStyle = { height: frameHeight, '--fold-duration': `${PUSH_S}s`, ...(cellSize ? { '--fold-cell': `${cellSize}px` } : {}) } as CSSProperties

  return (
    <div className={className}>
      {rendered.length > 0 && (
        <div className="ds-fold" style={frameStyle}>
          <div className="ds-fold-grid" ref={setGrid}>
            {rendered.map((item, index) => {
              const line = Math.floor(index / row)
              const folded = line >= visibleRows
              const itemMotion =
                motion === 'opening' && !folded && line >= foldedRows ? 'pop' : motion === 'closing' && !folded && line >= litRows ? 'unpop' : null
              return (
                <Fragment key={getKey(item)}>{renderItem(item, { folded, motion: itemMotion, popDelay: PUSH_S })}</Fragment>
              )
            })}
          </div>
        </div>
      )}
      {items.length > foldedCount && (
        <IconButton
          icon="chevron_down"
          label={toggleLabel}
          active={open}
          aria-expanded={open}
          className="ds-fold-toggle"
          onClick={() => {
            clearTimers()
            if (open) fold()
            else unfold()
          }}
        />
      )}
    </div>
  )
}
