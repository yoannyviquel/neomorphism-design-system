import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

/** Juste avant le premier sommet du rebond (27 % d'1 s) : le bouton descend encore quand il est
 *  relâché, et rebondit du fond sans s'y arrêter. */
export const PRESS_HOLD_MS = 230

interface PressHandlers {
  onPointerDown?: (event: PointerEvent<HTMLButtonElement>) => void
  onPointerUp?: (event: PointerEvent<HTMLButtonElement>) => void
  onPointerCancel?: (event: PointerEvent<HTMLButtonElement>) => void
  onPointerLeave?: (event: PointerEvent<HTMLButtonElement>) => void
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void
  onKeyUp?: (event: KeyboardEvent<HTMLButtonElement>) => void
}

/**
 * L'enfoncement d'un toucher bref. `:active` ne dure que le temps du doigt sur l'écran — une
 * fraction de seconde sur iPhone —, et l'enfoncement était interrompu avant d'avoir paru. Le bouton
 * reste donc enfoncé (`pressed`, classe `ds-pressed`) presque jusqu'au premier sommet du rebond,
 * puis se relâche, lancé, avec son propre rebond. Clavier compris (Entrée, Espace). Les gestionnaires de
 * l'app sont appelés aussi.
 */
export function usePress(own: PressHandlers): { pressed: boolean; handlers: Required<PressHandlers> } {
  const [pressed, setPressed] = useState(false)
  const since = useRef(0)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const press = () => {
    window.clearTimeout(timer.current)
    since.current = performance.now()
    setPressed(true)
  }
  const release = () => {
    window.clearTimeout(timer.current)
    const left = Math.max(0, PRESS_HOLD_MS - (performance.now() - since.current))
    timer.current = window.setTimeout(() => setPressed(false), left)
  }
  const isKey = (event: KeyboardEvent) => event.key === 'Enter' || event.key === ' '

  return {
    pressed,
    handlers: {
      onPointerDown: (event) => {
        press()
        own.onPointerDown?.(event)
      },
      onPointerUp: (event) => {
        release()
        own.onPointerUp?.(event)
      },
      onPointerCancel: (event) => {
        release()
        own.onPointerCancel?.(event)
      },
      onPointerLeave: (event) => {
        if (pressed) release()
        own.onPointerLeave?.(event)
      },
      onKeyDown: (event) => {
        if (isKey(event) && !event.repeat) press()
        own.onKeyDown?.(event)
      },
      onKeyUp: (event) => {
        if (isKey(event)) release()
        own.onKeyUp?.(event)
      },
    },
  }
}
