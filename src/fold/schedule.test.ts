import { describe, expect, it } from 'vitest'
import { foldBackSchedule, foldSchedule, POP_S, PUSH_S, SETTLE_S } from './schedule'

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
