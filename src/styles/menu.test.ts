import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * L'INVARIANT DES HAUTEURS, gardé depuis le FICHIER — même méthode que tokens.test.ts, et pour la
 * même raison : jsdom ne résout pas les `calc()`, et c'est l'arithmétique des jetons qu'on veut
 * tenir, pas le rendu d'un navigateur.
 *
 * Ce que ce test protège : un choix de sélecteur plat comme une destination de barre de menu se
 * PRESSE — ce sont des commandes, elles font --control-height, et leur cadre fait donc une hauteur
 * de commande plus ses deux marges. Seule la recherche loge un CONTENU (search.css). La règle a
 * bougé trois fois ; elle ne doit plus bouger sans casser ici.
 */
const CSS = readFileSync(join(import.meta.dirname, 'menu.css'), 'utf8')

/** Le corps d'une règle, commentaires retirés. */
function rule(selector: string) {
  const sansCommentaires = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
  const hit = sansCommentaires.match(new RegExp(`(^|\\})\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'm'))
  expect(hit, `règle ${selector} introuvable`).not.toBeNull()
  return hit![2]
}

describe("l'invariant des hauteurs de la barre à pastille", () => {
  it('un choix est une COMMANDE : la base le pose à --control-height', () => {
    expect(rule('.ds-menu-item')).toMatch(/height:\s*var\(--control-height\)\s*;/)
    expect(rule('.ds-menu-item')).not.toMatch(/height:\s*var\(--control-inner\)/)
  })

  it("barre de menu et sélecteur plat ne redéfinissent plus la hauteur : il n'y en a qu'une", () => {
    for (const selector of ['.ds-menu-bar .ds-menu-item', '.ds-flat-selector .ds-menu-item']) {
      expect(rule(selector), `${selector} ne doit pas surcharger la hauteur`).not.toMatch(/(^|;)\s*height:/)
    }
  })

  it('les marges des choix passent par les jetons, jamais par un littéral', () => {
    for (const selector of ['.ds-menu-bar .ds-menu-item', '.ds-flat-selector .ds-menu-item']) {
      const padding = rule(selector).match(/padding:\s*([^;]+);/)
      expect(padding, `${selector} doit poser sa marge`).not.toBeNull()
      expect(padding![1], `${selector} : marge en dur`).toMatch(/var\(--control-pad\)/)
      expect(padding![1], `${selector} : marge en dur`).not.toMatch(/\d+px/)
    }
  })
})
