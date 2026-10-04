import { describe, expect, it } from 'vitest'
import { FOLD_MAX_S, foldBackSchedule, foldPush, foldSchedule, POP_S, PUSH_MIN_S, PUSH_S, revealBackSchedule, SETTLE_S } from './schedule'

describe('foldSchedule', () => {
  it('déplie une ligne par étape, tout du long, les poussées enchaînées sans attendre les pops', () => {
    const steps = foldSchedule(12)
    expect(steps.map((step) => step.rows)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(steps[1].at).toBeCloseTo(PUSH_S)
    expect(steps[11].at).toBeCloseTo(11 * PUSH_S)
    expect(foldSchedule(0)).toEqual([])
  })
})

describe('foldBackSchedule', () => {
  it("joue le dépli à l'envers : pops inversés en cascade depuis le bas, chaque ligne recouverte une fois ses boutons au fond", () => {
    const steps = foldBackSchedule(4)
    expect(steps.map((step) => step.rows)).toEqual([3, 2, 1, 0])
    expect(steps.map((step) => step.unpopAt)).toEqual([0, PUSH_S, 2 * PUSH_S, 3 * PUSH_S].map((t) => expect.closeTo(t)))
    for (const step of steps) expect(step.pullAt).toBeCloseTo(step.unpopAt + POP_S + SETTLE_S)
  })

  it("dure autant que le dépli, à la marge près", () => {
    const back = foldBackSchedule(5)
    const forward = foldSchedule(5)
    expect(back[back.length - 1].pullAt + PUSH_S).toBeCloseTo(forward[forward.length - 1].at + PUSH_S + POP_S + SETTLE_S)
  })
})

describe('revealBackSchedule', () => {
  it("replie une section dès l'appui : la dernière ligne recouverte tout de suite, puis une par poussée", () => {
    const steps = revealBackSchedule(4)
    expect(steps.map((step) => step.rows)).toEqual([3, 2, 1, 0])
    expect(steps[0].pullAt).toBe(0)
    expect(steps.map((step) => step.pullAt)).toEqual([0, PUSH_S, 2 * PUSH_S, 3 * PUSH_S].map((t) => expect.closeTo(t)))
    for (const step of steps) expect(step.unpopAt).toBeCloseTo(step.pullAt)
  })

  it("attend, avec `retractFirst`, que chaque ligne soit rentrée avant de la recouvrir", () => {
    const steps = revealBackSchedule(3, PUSH_S, true)
    expect(steps.map((step) => step.unpopAt)).toEqual([0, PUSH_S, 2 * PUSH_S].map((t) => expect.closeTo(t)))
    for (const step of steps) expect(step.pullAt).toBeCloseTo(step.unpopAt + PUSH_S)
  })

  it('dure autant que les poussées du dépli, sans attendre les pops', () => {
    const push = foldPush(10)
    const steps = revealBackSchedule(10, push)
    expect(steps[steps.length - 1].pullAt + push).toBeCloseTo(10 * push)
  })
})

describe('foldPush', () => {
  it("garde la poussée de la grille tant que le dépli tient en quatre lignes, et la resserre au-delà", () => {
    expect(foldPush(1)).toBeCloseTo(PUSH_S)
    expect(foldPush(4)).toBeCloseTo(PUSH_S)
    // Huit lignes : le temps de quatre, partagé.
    expect(foldPush(8)).toBeCloseTo(FOLD_MAX_S / 8)
    expect(8 * foldPush(8)).toBeCloseTo(FOLD_MAX_S)
    // Jamais au point qu'une poussée ne se voie plus.
    expect(foldPush(500)).toBeCloseTo(PUSH_MIN_S)
  })

  it('règle le rythme du dépli et du repli quand on la leur passe', () => {
    const push = foldPush(10)
    expect(foldSchedule(10, push)[9].at).toBeCloseTo(9 * push)
    expect(foldBackSchedule(10, push)[1]).toMatchObject({ rows: 8 })
    expect(foldBackSchedule(10, push)[1].unpopAt).toBeCloseTo(push)
  })
})
