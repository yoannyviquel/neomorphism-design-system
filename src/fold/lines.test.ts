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
})
