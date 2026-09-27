import { useLayoutEffect, useState } from 'react'

export interface GridLayout {
  /** Colonnes disposées par le navigateur (auto-fill). */
  columns: number
  /** Hauteur d'une ligne, et pas d'une ligne à la suivante (hauteur plus écart), en px. */
  rowHeight: number
  step: number
}

/**
 * La disposition réelle d'une grille, suivie quand sa largeur ou son contenu changent. `null` tant
 * que rien n'est mesurable (pas de mise en page, comme sous jsdom).
 */
export function useGridLayout(grid: HTMLElement | null): GridLayout | null {
  const [layout, setLayout] = useState<GridLayout | null>(null)
  useLayoutEffect(() => {
    if (!grid) return
    const measure = () => {
      // Disposée, la grille rend une largeur par colonne (« 72px 72px … ») ; sans mise en page, rien de tel.
      const style = getComputedStyle(grid)
      const columns = style.gridTemplateColumns.split(' ').filter((track) => /^[\d.]+px$/.test(track)).length
      const first = grid.firstElementChild as HTMLElement | null
      const rowHeight = first?.offsetHeight ?? 0
      // L'écart entre deux lignes se lit sur la grille, qu'elle compte une ligne ou toutes : c'est ce
      // qui laisse calculer la hauteur des lignes repliées avant que les autres ne soient rendues.
      const step = rowHeight + (parseFloat(style.rowGap) || 0)
      setLayout((previous) => {
        if (columns === 0 || rowHeight === 0) return null
        if (previous && previous.columns === columns && previous.rowHeight === rowHeight && previous.step === step) return previous
        return { columns, rowHeight, step }
      })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(grid)
    return () => observer.disconnect()
  }, [grid])
  return layout
}
