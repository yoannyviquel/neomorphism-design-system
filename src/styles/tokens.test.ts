import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * L'échelle du support, gardée depuis le FICHIER : jsdom ne résout pas les `calc()`, et c'est de
 * toute façon l'arithmétique des six primitives qu'on veut tenir, pas le rendu d'un navigateur.
 * Ce que ce test protège, c'est le choix de --neu-density : --shadow-room n'est PAS une ombre mais
 * une gouttière de mise en page, que les apps posent en marge et en `gap`. Elle doit tomber sur un
 * entier aux deux k — et c'est ce qui a imposé 2/3 plutôt que 0,625 ou 0,66.
 */
const CSS = readFileSync(join(import.meta.dirname, 'tokens.css'), 'utf8')

/** Les six primitives d'un bloc, repéré par son sélecteur. */
function scale(selector: string) {
  const start = CSS.indexOf(selector)
  expect(start, `bloc ${selector} introuvable`).toBeGreaterThan(-1)
  const block = CSS.slice(start, CSS.indexOf('\n}', start))
  const read = (name: string) => {
    const hit = block.match(new RegExp(`^\\s*${name}:\\s*([^;]+);`, 'm'))
    expect(hit, `${name} absent de ${selector}`).not.toBeNull()
    return hit![1].trim()
  }
  const px = (name: string) => {
    const raw = read(name)
    expect(raw, `${name} doit être un littéral en px`).toMatch(/^\d+px$/)
    return Number.parseInt(raw, 10)
  }
  // --neu-density est un nombre, écrit en décimale (1) ou en fraction (calc(2 / 3)).
  const density = (() => {
    const raw = read('--neu-density')
    const frac = raw.match(/^calc\((\d+)\s*\/\s*(\d+)\)$/)
    return frac ? Number(frac[1]) / Number(frac[2]) : Number(raw)
  })()
  return {
    height: px('--control-height'),
    pad: px('--control-pad'),
    icon: px('--control-icon'),
    check: px('--control-check'),
    radius: px('--control-radius'),
    density,
  }
}

const COMPACT = scale(':root {')
const COMFORTABLE = scale(":root[data-density='comfortable'] {")
const COARSE = scale(":root:not([data-density='compact']) {")

describe("l'échelle du support", () => {
  it('compacte : les six primitives à la souris', () => {
    expect(COMPACT).toEqual({ height: 33, pad: 5, icon: 18, check: 18, radius: 9, density: 2 / 3 })
  })

  it('confortable : la maquette au pixel près, sur pointeur grossier comme en forçage', () => {
    expect(COMFORTABLE).toEqual({ height: 50, pad: 8, icon: 20, check: 22, radius: 14, density: 1 })
    // Le bloc `pointer: coarse` et son jumeau de forçage ne doivent jamais diverger.
    expect(COARSE).toEqual(COMFORTABLE)
  })

  it.each([
    ['compacte', COMPACT, { inner: 23, radiusInner: 4, room: 16, roomLg: 24 }],
    ['confortable', COMFORTABLE, { inner: 34, radiusInner: 6, room: 24, roomLg: 36 }],
  ])('%s : les dérivés tombent juste, et --shadow-room sur un ENTIER', (_name, s, attendu) => {
    expect(s.height - 2 * s.pad).toBe(attendu.inner)
    expect(s.radius - s.pad).toBe(attendu.radiusInner)
    // --shadow-room: calc(72px * --neu-k), --neu-k: calc(1 / 3 * --neu-density) ; idem en 1/2.
    const room = 72 * (1 / 3) * s.density
    const roomLg = 72 * (1 / 2) * s.density
    expect(room).toBeCloseTo(attendu.room, 10)
    expect(roomLg).toBeCloseTo(attendu.roomLg, 10)
    expect(Number.isInteger(Math.round(room * 1e9) / 1e9)).toBe(true)
    expect(Number.isInteger(Math.round(roomLg * 1e9) / 1e9)).toBe(true)
  })

  it("une case à cocher atteint la cible tactile de 44 px aux deux échelles, par son débord", () => {
    // field.css : inset: calc((44px - var(--control-check)) / -2), sous `pointer: coarse`.
    for (const s of [COMPACT, COMFORTABLE]) expect(s.check + 2 * ((44 - s.check) / 2)).toBe(44)
  })
})
