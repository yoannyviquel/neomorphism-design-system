import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { foldLines } from './lines'

/**
 * jsdom ne met rien en page : chaque élément porte sa boîte dans `data-r="haut,bas"`, et celles
 * qui n'en ont pas sont invisibles. C'est tout ce que foldLines lit de la mise en page.
 */
function boite(el: Element): DOMRect {
  const [top, bottom] = (el.getAttribute('data-r') ?? '0,0').split(',').map(Number)
  return { top, bottom, left: 0, right: 100, width: 100, height: bottom - top, x: 0, y: top, toJSON: () => ({}) } as DOMRect
}

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    return boite(this)
  })
  vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (this: Element) {
    return (this.hasAttribute('data-r') ? [boite(this)] : []) as unknown as DOMRectList
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const nom = (el: HTMLElement) => el.dataset.n ?? el.tagName.toLowerCase()

describe('foldLines', () => {
  it("découpe un formulaire en lignes : titres, champs, rangées côte à côte", () => {
    document.body.innerHTML = `
      <div id="racine" data-r="0,400">
        <section data-r="0,240">
          <h3 data-n="titre" data-r="0,20">Famille</h3>
          <div data-n="champ" data-r="30,90">
            <label data-r="30,45">Origine</label>
            <div class="ds-select" data-n="selecteur" data-r="50,90"><select class="ds-input" data-r="50,90"></select></div>
          </div>
          <div class="toolbar" data-r="100,240">
            <div data-n="a" data-r="100,150"><input class="ds-input" data-n="ia" data-r="120,150" /></div>
            <div data-n="b" data-r="100,150"><input class="ds-input" data-n="ib" data-r="120,150" /></div>
            <div data-n="c" data-r="160,210"><input class="ds-input" data-n="ic" data-r="180,210" /></div>
          </div>
        </section>
        <p data-n="note" data-r="250,270">Une note.</p>
        <div data-r="280,330">
          <button class="ds-button" data-n="exporter" data-r="280,330">Exporter</button>
          <button class="ds-button" data-n="effacer" data-r="280,330">Effacer</button>
        </div>
      </div>`
    const lignes = foldLines(document.getElementById('racine') as HTMLElement)

    expect(lignes.map((l) => l.elements.map(nom).join('+'))).toEqual([
      'titre',
      // Un champ et son libellé font une ligne : le libellé ne se sépare pas de ce qu'il nomme.
      'champ',
      // Deux champs côte à côte : une ligne, comme une ligne de grille.
      'a+b',
      'c',
      'note',
      // Deux boutons côte à côte : une ligne, qui poppera d'un bloc.
      'exporter+effacer',
    ])

    // Ce qui poppe : la commande telle que le DS l'habille — l'enveloppe d'un sélecteur, pas son
    // champ intérieur ; rien pour un texte.
    expect(lignes.map((l) => l.reliefs.map(nom).join('+'))).toEqual(['', 'selecteur', 'ia+ib', 'ic', '', 'exporter+effacer'])

    // Positions depuis le haut du contenu.
    expect(lignes[2]).toMatchObject({ top: 100, bottom: 150 })
  })

  it("tient un bouton section dépliante pour UNE commande, là où un vrai <section> s'ouvre", () => {
    /**
     * LE DÉFAUT : un `<section>` s'ouvre toujours, et le bouton section dépliante en est un. Son
     * en-tête et son contenu replié faisaient donc des lignes séparées, dont aucune ne portait le
     * relief — il est sur la SECTION, puisque la section EST le bouton. Rien ne poppait : il se
     * découvrait comme du texte.
     *
     * LES DEUX CAS SONT DANS LE MÊME TEST à dessein : c'est leur DIFFÉRENCE qui est la règle, et une
     * correction qui ferait d'un `<section>` de mise en page une ligne d'un bloc la casserait sans
     * que rien ne le dise.
     */
    document.body.innerHTML = `
      <div id="racine" data-r="0,200">
        <section class="ds-disclosure ds-disclosure-button" data-n="bouton-section" data-r="0,60">
          <span class="ds-shade" data-r="0,60"></span>
          <button class="ds-disclosure-trigger" data-n="entete" data-r="0,40">Revenus</button>
          <div class="ds-reveal" data-r="40,60">
            <div class="ds-reveal-content" data-r="40,60">
              <button class="ds-button" data-n="dedans" data-r="40,60">Enregistrer</button>
            </div>
          </div>
        </section>
        <section data-n="mise-en-page" data-r="80,200">
          <h3 data-n="titre" data-r="80,100">Famille</h3>
          <button class="ds-button" data-n="ajouter" data-r="110,160">Ajouter</button>
        </section>
      </div>`
    const lignes = foldLines(document.getElementById('racine') as HTMLElement)

    // Le bouton section : UNE ligne, quoi qu'il contienne. La section de mise en page, elle, s'ouvre
    // toujours — son titre et son bouton restent deux lignes.
    expect(lignes.map((l) => l.elements.map(nom).join('+'))).toEqual(['bouton-section', 'titre', 'ajouter'])

    // Ce qui poppe : la section elle-même, et ELLE SEULE — ce qu'elle cache repliée poppe avec elle,
    // pas à part, sans quoi des commandes invisibles rebondiraient dans une commande qui monte.
    expect(lignes.map((l) => l.reliefs.map(nom).join('+'))).toEqual(['bouton-section', '', 'ajouter'])
  })
})
