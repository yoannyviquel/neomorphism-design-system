import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FA_ICONS, ICONS } from '../components/icons'

/**
 * UNE ICÔNE DÉCLARÉE EST UNE ICÔNE DESSINÉE. Le nom vit dans icons.ts (pour le type), le glyphe dans
 * icons.css (pour la police) : deux listes à tenir ensemble, et un oubli ne se voit qu'à l'écran,
 * par un carré vide. Ce test les lit l'une contre l'autre, depuis le fichier, comme ses voisins.
 */
const CSS = readFileSync(join(import.meta.dirname, 'icons.css'), 'utf8')

describe('les icônes du DS', () => {
  it('chaque Material Design déclarée a son glyphe', () => {
    for (const name of ICONS) expect(CSS, `nf-md-${name}`).toMatch(new RegExp(`\\.nf-md-${name}::before\\s*\\{\\s*content:\\s*'\\\\f[0-9a-f]+'`))
  })

  it('chaque Font Awesome déclarée a son glyphe', () => {
    for (const name of FA_ICONS) expect(CSS, `nf-fa-${name}`).toMatch(new RegExp(`\\.nf-fa-${name}::before\\s*\\{\\s*content:\\s*'\\\\[0-9a-f]+'`))
  })
})
