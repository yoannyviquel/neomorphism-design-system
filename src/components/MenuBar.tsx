import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'
import type { IconName } from './icons'

export interface MenuItem<Id extends string = string> {
  id: Id
  icon: IconName
  /** Libellé court, montré quand la destination est la courante. */
  label: string
  /** Nom accessible ; le libellé visible est décoratif. */
  ariaLabel?: string
}

export interface MenuBarProps<Id extends string> {
  items: readonly MenuItem<Id>[]
  active: Id
  onSelect: (id: Id) => void
  /** Nom accessible de la navigation. */
  label: string
  className?: string
}

/** La pastille s'étire jusqu'à la nouvelle destination… */
export const MENU_STRETCH_MS = 380
/** …et se rétracte depuis l'ancienne, qui s'éteint alors, JUSTE AVANT que l'étirement s'achève :
 *  à 150 ms, il en est aux 7/8 (il ralentit en arrivant), et les deux temps s'enchaînent sans pause. */
export const MENU_RELEASE_DELAY_MS = 150
export const MENU_RELEASE_MS = 420

const easeOut = (p: number) => 1 - (1 - Math.min(1, Math.max(0, p))) ** 4
const lerp = (from: number, to: number, p: number) => from + (to - from) * p

/**
 * Barre de menu : un cadre creusé, et dedans UNE pastille en relief sous la destination courante,
 * qui s'étire pour montrer son libellé. Changer de destination ne fait pas glisser la pastille :
 * elle S'ÉTIRE d'abord jusqu'à la nouvelle (qui s'allume et s'élargit), puis SE RÉTRACTE depuis
 * l'ancienne (qui s'éteint et se resserre). Ses bords suivent ceux des destinations, mesurés à
 * chaque image, pendant que celles-ci changent de largeur. L'app la place (marges, zone sûre).
 */
export function MenuBar<Id extends string>({ items, active, onSelect, label, className }: MenuBarProps<Id>) {
  const at = Math.max(0, items.findIndex((item) => item.id === active))
  // L'ancienne destination reste allumée le temps que la pastille l'atteigne… puis la quitte.
  const [shown, setShown] = useState({ at, trail: null as number | null })
  if (shown.at !== at) setShown({ at, trail: shown.at })
  const trail = shown.at === at ? shown.trail : shown.at

  const nav = useRef<HTMLElement>(null)
  const pill = useRef<HTMLSpanElement>(null)
  const from = useRef(at)
  const edges = useRef<[number, number] | null>(null)

  useLayoutEffect(() => {
    const bar = nav.current
    const indicator = pill.current
    if (!bar || !indicator) return
    const rect = (index: number): [number, number] => {
      const item = bar.querySelectorAll<HTMLElement>('.ds-menu-item')[index]
      return item ? [item.offsetLeft, item.offsetLeft + item.offsetWidth] : [0, 0]
    }
    const place = ([left, right]: [number, number]) => {
      edges.current = [left, right]
      indicator.style.left = `${left}px`
      indicator.style.width = `${Math.max(0, right - left)}px`
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
      const [oldLeft, oldRight] = rect(start)
      const [offLeft, offRight] = [edges.current[0] - oldLeft, edges.current[1] - oldRight]
      const rightward = at > start
      const t0 = performance.now()
      const step = (now: number) => {
        const t = now - t0
        const stretch = easeOut(t / MENU_STRETCH_MS)
        const release = easeOut((t - MENU_RELEASE_DELAY_MS) / MENU_RELEASE_MS)
        const [aLeft, aRight] = rect(start)
        const [bLeft, bRight] = rect(at)
        place([
          lerp(aLeft + offLeft, bLeft, rightward ? release : stretch),
          lerp(aRight + offRight, bRight, rightward ? stretch : release),
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

  // Au repos, la pastille suit la barre si elle change de largeur (rotation, fenêtre).
  useLayoutEffect(() => {
    const bar = nav.current
    if (!bar || typeof ResizeObserver !== 'function') return
    const observer = new ResizeObserver(() => {
      const item = bar.querySelectorAll<HTMLElement>('.ds-menu-item')[from.current]
      const indicator = pill.current
      if (!item || !indicator || bar.querySelector('.ds-menu-item.ds-trail')) return
      edges.current = [item.offsetLeft, item.offsetLeft + item.offsetWidth]
      indicator.style.left = `${item.offsetLeft}px`
      indicator.style.width = `${item.offsetWidth}px`
    })
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])

  return (
    <nav ref={nav} className={cx('ds-menu', className)} aria-label={label} style={{ '--menu-n': items.length } as CSSProperties}>
      <span ref={pill} className="ds-menu-indicator" aria-hidden="true" />
      {items.map((item, index) => {
        const current = index === at
        const lit = current || index === trail
        return (
          <button
            key={item.id}
            type="button"
            className={cx('ds-menu-item', lit && 'ds-active', !current && lit && 'ds-trail')}
            aria-label={item.ariaLabel ?? item.label}
            aria-current={current ? 'page' : undefined}
            onClick={() => onSelect(item.id)}
          >
            <Icon name={item.icon} />
            <span className="ds-menu-label" aria-hidden="true">
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
