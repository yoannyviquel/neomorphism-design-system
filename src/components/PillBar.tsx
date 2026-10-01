import { useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'
import type { IconName } from './icons'

/** Un choix de la barre : une icône (le libellé ne se montre alors que sur le choix courant), ou un
 *  libellé seul, toujours visible. */
export interface PillItem<Id extends string = string> {
  id: Id
  icon?: IconName
  label: string
  /** Nom accessible ; le libellé visible est décoratif. */
  ariaLabel?: string
}

interface PillBarProps<Id extends string> {
  items: readonly PillItem<Id>[]
  active: Id
  onSelect: (id: Id) => void
  className: string
  /** L'élément racine et ses attributs (navigation, groupe de choix…). */
  as: 'nav' | 'div'
  rootProps: HTMLAttributes<HTMLElement>
  /** Les attributs de chaque choix, selon qu'il est le courant. */
  itemProps: (current: boolean) => ButtonHTMLAttributes<HTMLButtonElement>
}

/** La pastille s'étire jusqu'à la nouvelle destination… */
export const MENU_STRETCH_MS = 380
/** …et se rétracte depuis l'ancienne, qui s'éteint alors, JUSTE AVANT que l'étirement s'achève :
 *  à 150 ms, il en est aux 7/8 (il ralentit en arrivant), et les deux temps s'enchaînent sans pause. */
export const MENU_RELEASE_DELAY_MS = 150
export const MENU_RELEASE_MS = 420

const easeOut = (p: number) => 1 - (1 - Math.min(1, Math.max(0, p))) ** 4
const lerp = (from: number, to: number, p: number) => from + (to - from) * p

/** Les bords d'un choix dans la barre : gauche, haut, droite, bas. */
type Edges = [number, number, number, number]

const measure = (bar: HTMLElement, index: number): Edges => {
  const item = bar.querySelectorAll<HTMLElement>('.ds-menu-item')[index]
  return item ? [item.offsetLeft, item.offsetTop, item.offsetLeft + item.offsetWidth, item.offsetTop + item.offsetHeight] : [0, 0, 0, 0]
}

const draw = (indicator: HTMLElement, [left, top, right, bottom]: Edges) => {
  indicator.style.left = `${left}px`
  indicator.style.top = `${top}px`
  indicator.style.width = `${Math.max(0, right - left)}px`
  indicator.style.height = `${Math.max(0, bottom - top)}px`
}

/**
 * Le cœur de la barre de menu et du sélecteur multiple plat : un cadre creusé, et dedans UNE
 * pastille en relief sous le choix courant. Changer de choix ne fait pas glisser la pastille : elle
 * S'ÉTIRE d'abord jusqu'au nouveau (qui s'allume, et s'élargit s'il montre alors son libellé), puis
 * SE RÉTRACTE depuis l'ancien (qui s'éteint et se resserre). Ses bords suivent ceux des choix,
 * mesurés à chaque image, pendant que ceux-ci changent de largeur.
 *
 * Ses QUATRE bords : sur une ligne, le haut et le bas ne bougent pas ; quand les choix se replient
 * sur plusieurs lignes, la pastille s'étire aussi en hauteur, jusqu'à la ligne du nouveau choix,
 * puis se rétracte de celle de l'ancien. Les bords qui mènent sont ceux du côté où l'on va.
 */
export function PillBar<Id extends string>({ items, active, onSelect, className, as: Root, rootProps, itemProps }: PillBarProps<Id>) {
  const at = Math.max(0, items.findIndex((item) => item.id === active))
  // L'ancienne destination reste allumée le temps que la pastille l'atteigne… puis la quitte.
  const [shown, setShown] = useState({ at, trail: null as number | null })
  if (shown.at !== at) setShown({ at, trail: shown.at })
  const trail = shown.at === at ? shown.trail : shown.at

  const nav = useRef<HTMLElement>(null)
  const pill = useRef<HTMLSpanElement>(null)
  const from = useRef(at)
  const edges = useRef<Edges | null>(null)

  useLayoutEffect(() => {
    const bar = nav.current
    const indicator = pill.current
    if (!bar || !indicator) return
    const rect = (index: number) => measure(bar, index)
    const place = (next: Edges) => {
      edges.current = next
      draw(indicator, next)
    }

    const start = from.current
    from.current = at
    const still = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let timer = 0
    if (start === at || still || !edges.current) {
      place(rect(at))
      if (start !== at) setShown({ at, trail: null })
    } else {
      // Là où la pastille se trouve (au repos sur l'ancienne, ou en plein mouvement si l'on
      // change d'avis), rapporté aux bords de l'ancienne : on suit ceux-ci en gardant l'écart.
      const old = rect(start)
      const off = edges.current.map((edge, side) => edge - old[side])
      // Le sens se lit sur la position des choix, non sur leur rang : passer du bout d'une ligne au
      // début de la suivante va vers la gauche, et vers le bas.
      const target = rect(at)
      const rightward = target[0] > old[0] || (target[0] === old[0] && at > start)
      const downward = target[1] > old[1]
      const t0 = performance.now()
      const step = (now: number) => {
        const t = now - t0
        const stretch = easeOut(t / MENU_STRETCH_MS)
        const release = easeOut((t - MENU_RELEASE_DELAY_MS) / MENU_RELEASE_MS)
        const [aLeft, aTop, aRight, aBottom] = rect(start)
        const [bLeft, bTop, bRight, bBottom] = rect(at)
        place([
          lerp(aLeft + off[0], bLeft, rightward ? release : stretch),
          lerp(aTop + off[1], bTop, downward ? release : stretch),
          lerp(aRight + off[2], bRight, rightward ? stretch : release),
          lerp(aBottom + off[3], bBottom, downward ? stretch : release),
        ])
        if (t < MENU_RELEASE_DELAY_MS + MENU_RELEASE_MS) frame = requestAnimationFrame(step)
      }
      step(t0)
      frame = requestAnimationFrame(step)
      timer = window.setTimeout(() => setShown({ at, trail: null }), MENU_RELEASE_DELAY_MS)
    }
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [at])

  // Au repos, la pastille suit la barre si elle change de largeur (rotation, fenêtre) — et le choix
  // courant, s'il passe alors d'une ligne à l'autre.
  useLayoutEffect(() => {
    const bar = nav.current
    if (!bar || typeof ResizeObserver !== 'function') return
    const observer = new ResizeObserver(() => {
      const indicator = pill.current
      if (!indicator || bar.querySelector('.ds-menu-item.ds-trail')) return
      edges.current = measure(bar, from.current)
      draw(indicator, edges.current)
    })
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])

  return (
    <Root ref={nav as never} className={cx('ds-menu', className)} style={{ '--menu-n': items.length } as CSSProperties} {...rootProps}>
      <span ref={pill} className="ds-menu-indicator" aria-hidden="true" />
      {items.map((item, index) => {
        const current = index === at
        const lit = current || index === trail
        return (
          <button
            key={item.id}
            type="button"
            className={cx('ds-menu-item', !item.icon && 'ds-plain', lit && 'ds-active', !current && lit && 'ds-trail')}
            aria-label={item.ariaLabel ?? item.label}
            {...itemProps(current)}
            onClick={() => onSelect(item.id)}
          >
            {item.icon && <Icon name={item.icon} />}
            <span className="ds-menu-label" aria-hidden="true">
              {item.label}
            </span>
          </button>
        )
      })}
    </Root>
  )
}
