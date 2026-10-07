import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * L'INVARIANT D'ÉCHELLE DU BOUTON SECTION, gardé depuis le FICHIER — même méthode que
 * menu.test.ts et tokens.test.ts, et pour la même raison : jsdom ne résout pas les `calc()`, et
 * c'est l'arithmétique des jetons qu'on veut tenir, pas le rendu d'un navigateur.
 *
 * CE QUE CE TEST PROTÈGE, et qui s'était perdu : l'en-tête d'un bouton section est une COMMANDE, et
 * une commande suit l'échelle du support. Ses marges étaient écrites en dur à l'échelle du POUCE
 * (14 px et 16 px), si bien qu'un en-tête d'une seule ligne mesurait ~47 px à la souris, où une
 * commande en fait 33 : le `min-height` ne servait à rien, la marge décidait avant lui.
 *
 * LA RÈGLE EST CELLE DE `tokens.css` : « ce qui change, ce sont les BOÎTES ». La typographie, elle,
 * ne bouge pas — l'intitulé reste à 16 px, et ce test ne le lui reproche pas.
 */
const CSS = readFileSync(join(import.meta.dirname, 'disclosure.css'), 'utf8')

/** Le corps d'une règle, commentaires retirés. */
function rule(selector: string) {
  const sansCommentaires = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
  const hit = sansCommentaires.match(
    new RegExp(`(^|\\})\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'm'),
  )
  expect(hit, `règle ${selector} introuvable`).not.toBeNull()
  return hit![2]
}

describe("l'invariant d'échelle du bouton section", () => {
  it("l'en-tête a pour PLANCHER la hauteur d'une commande, jamais une hauteur figée", () => {
    const entete = rule('.ds-disclosure-trigger')

    expect(entete).toMatch(/min-height:\s*var\(--control-height\)\s*;/)
    // `min-height` et non `height` : l'en-tête peut porter une indication sous l'intitulé, et il
    // lui faut alors deux lignes. La hauteur d'une commande est son plancher, pas sa mesure.
    expect(entete).not.toMatch(/(^|;)\s*height:/)
  })

  it('ses marges et son écart passent par les jetons, jamais par un littéral', () => {
    const entete = rule('.ds-disclosure-trigger')
    const marge = entete.match(/padding:\s*([^;]+);/)
    const ecart = entete.match(/gap:\s*([^;]+);/)

    expect(marge, "l'en-tête doit poser sa marge").not.toBeNull()
    expect(ecart, "l'en-tête doit poser son écart").not.toBeNull()
    // LE LITTÉRAL EST CE QU'ON INTERDIT : une valeur en px ici ne suit plus l'échelle du support, et
    // c'est exactement par là que les ~47 px à la souris étaient arrivés.
    expect(marge![1]).not.toMatch(/\d+px/)
    expect(ecart![1]).not.toMatch(/\d+px/)
    expect(marge![1]).toContain('--control-pad')
    expect(ecart![1]).toContain('--control-pad')
  })

  it('le contenu est rentré de la MÊME expression que l’en-tête : « aligné sur l’icône »', () => {
    const contenu = rule('.ds-disclosure.ds-disclosure-button .ds-reveal-content')
    /**
     * Les composantes d'un raccourci `padding`, coupées sur les blancs de PREMIER NIVEAU : une
     * expression `calc(2 * var(--control-pad))` en contient elle-même, et une coupe naïve rendait
     * « calc(2 », « * », « var(--control-pad)) ». D'où le compte des parenthèses.
     */
    const lateral = (marge: string) => {
      const parts: string[] = []
      let profondeur = 0
      let courant = ''
      for (const c of marge.trim()) {
        if (c === '(') profondeur++
        if (c === ')') profondeur--
        if (/\s/.test(c) && profondeur === 0) {
          if (courant) parts.push(courant)
          courant = ''
        } else courant += c
      }
      if (courant) parts.push(courant)
      return parts
    }

    const marges = lateral(contenu.match(/padding:\s*([^;]+);/)![1])
    const entete = lateral(rule('.ds-disclosure-trigger').match(/padding:\s*([^;]+);/)![1])

    // Trois valeurs pour le contenu (haut, côtés, bas), deux pour l'en-tête : c'est la valeur des
    // CÔTÉS qui doit coïncider, et elle seule — sans quoi le texte se décale de l'icône à la souris,
    // où l'en-tête se resserre et pas le contenu.
    expect(marges[1]).toBe(entete[1])
    expect(marges[1]).toContain('--control-pad')
  })
})

describe('le pop du bouton section', () => {
  /**
   * LA MOITIÉ QUE jsdom NE PEUT PAS TENIR : il ne résout ni `calc()` ni animation, donc le rebond ne
   * s'y observe pas. Ce qui se garde, c'est que la RÈGLE existe — le bouton section monte son relief
   * sur --pop comme les autres commandes —, lue depuis le fichier, comme les tests voisins.
   *
   * SANS ELLE LE DÉFAUT SE REJOUAIT À MOITIÉ : la marque de pop était bien posée (et `lines.test.ts`
   * la garde), l'échelle jouait, mais l'ombre restait celle de --sink — le relief ne bougeait pas.
   * Son calque est enfant de la SECTION, pas d'un `.ds-button` : il n'était atteint par aucun
   * sélecteur.
   */
  const POP = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((ligne) => ligne.includes('[data-fold]') && ligne.includes('.ds-shade'))

  it('monte son relief sur --pop, comme toute commande qui se découvre', () => {
    expect(POP.join('\n')).toMatch(/\.ds-disclosure-button\b/)
  })

  it('garde son creux quand il se découvre DÉJÀ DÉPLIÉ : --pop ne commande pas un enfoncé', () => {
    // La règle de la grille, appliquée ici : un bouton enfoncé garde son creux. C'est aussi ce qui
    // empêche le pop de se battre avec l'état déplié du bouton section (.ds-active, porté par la
    // même section), dont le creux vient de --sink.
    expect(POP.join('\n')).toMatch(/:not\(\.ds-active\)/)
  })
})

describe("le fondu d'une ligne sans relief", () => {
  /**
   * CE QUE jsdom NE PEUT PAS TENIR : que l'encre monte vraiment. Il ne joue aucune animation et ne
   * résout aucun `var()`, donc l'opacité d'une ligne en cours d'entrée n'y est pas observable. Ce
   * qui se garde ici, c'est la RÈGLE — son existence, et surtout ses durées, qui sont le seul
   * endroit où le fondu peut se décrocher du rythme du dépli. Le câblage, lui (quelle ligne reçoit
   * quelle marque, et quand), est tenu par `components.test.tsx`, où il s'observe.
   */
  it('entre en fondu sur une POUSSÉE, et part au même instant que le pop', () => {
    const fondu = rule(`.ds-reveal [data-fold='fade']`)

    expect(fondu).toMatch(/animation:\s*ds-fade-in/)
    // La durée est la poussée, et le retard celui du pop : deux jetons posés par le composant, qui
    // suivent le resserrement des poussées. Un nombre écrit en clair décrocherait le texte du
    // rythme dès qu'une section a beaucoup de lignes.
    expect(fondu).toContain('var(--fold-duration')
    expect(fondu).toContain('var(--pop-delay')
    expect(CSS).toMatch(/@keyframes ds-fade-in/)
  })

  it('se joue à l’envers au repli, sur la mesure du pop inversé', () => {
    // Sans quoi le repli redevenait sec : la ligne disparaissait net sous un cadre encore ouvert.
    const sortie = rule(`.ds-reveal [data-fold='unfade']`)

    expect(sortie).toMatch(/ds-fade-in.*reverse/)
    expect(sortie).toContain('var(--unpop-duration')
  })

  it('ne remplace pas la barrière : une ligne couverte reste hors d’atteinte', () => {
    // L'OPACITÉ NE PEINT QUE L'ENTRÉE. Une ligne pas encore découverte doit rester invisible AU SENS
    // FORT — ni lue, ni cliquable, ni atteinte à la tabulation —, ce que seule `visibility` donne.
    expect(rule('.ds-reveal [data-fold-hidden]')).toMatch(/visibility:\s*hidden/)
  })

  it('disparaît sous prefers-reduced-motion, comme le pop', () => {
    // La règle coupe la marque SANS VALEUR : pop et fondu passent par la même, donc une seule ligne
    // les tient tous les deux.
    const sans = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    const reduit = sans.slice(sans.lastIndexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduit).toMatch(/\.ds-reveal \[data-fold\]\s*\{\s*animation:\s*none/)
  })
})
