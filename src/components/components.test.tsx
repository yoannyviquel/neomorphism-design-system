import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Button, IconButton } from './Button'
import { ChartFilters } from './ChartFilters'
import { DELETE_ARM_MS, DeleteButton } from './DeleteButton'
import { Disclosure, DisclosureButton } from './Disclosure'
import { Reveal } from './Reveal'
import { Selectable, SelectToggle } from './Selection'
import { Checkbox, Select } from './Field'
import { FALLBACK_COLUMNS, FoldingGrid } from './FoldingGrid'
import { ImageButton } from './ImageButton'
import { FlatSelector } from './FlatSelector'
import { Body, ButtonBar, Footer, Header, Screen, Slides } from './Layout'
import { MENU_RELEASE_DELAY_MS, MenuBar } from './MenuBar'
import { SearchField } from './SearchField'
import { SetImage } from './SetImage'
import { PRESS_HOLD_MS } from './usePress'
import { PUSH_S } from '../fold/schedule'

describe('ChartFilters', () => {
  it("rend les trois filtres d'un graphique, chacun à son échelle", () => {
    const { container } = render(<ChartFilters />)

    // La rainure : le creux à k = 1/24, dont le flou vaut la largeur du trait — 48 × 1/24 = 2 px,
    // soit σ = 1. C'est la règle entière, et c'est elle que ce test garde.
    const sombre = container.querySelector('#ds-chart-groove feDropShadow.ds-groove-dark')
    const claire = container.querySelector('#ds-chart-groove feDropShadow.ds-groove-light')
    expect(sombre).toHaveAttribute('dx', '-1.08')
    expect(sombre).toHaveAttribute('stdDeviation', '1')
    // L'ombre du côté d'où vient la lumière, le rehaut du côté opposé : les signes sont opposés.
    expect(claire).toHaveAttribute('dx', '1.29')
    expect(Number(sombre?.getAttribute('dx')) * Number(claire?.getAttribute('dx'))).toBeLessThan(0)
    // Le tracé passe au-dessus de ses deux parois.
    const fusion = container.querySelectorAll('#ds-chart-groove feMergeNode')
    expect(fusion[fusion.length - 1]).toHaveAttribute('in', 'SourceGraphic')

    // L'ombre d'une donnée : le relief à k = 1/9 (28 et 50 réduits). Déprécié, mais conservé tant
    // que des apps le citent : ce test garde l'identifiant vivant et sa géométrie intacte.
    expect(container.querySelector('#ds-chart-shadow feDropShadow')).toHaveAttribute('dx', '3.11')
    expect(container.querySelector('#ds-chart-shadow feDropShadow')).toHaveAttribute('stdDeviation', '2.78')

    // Le sertissage : le creux à k = 1/3 (26 et 48 réduits), sans reflet clair ni rebord.
    expect(container.querySelector('#ds-chart-set feOffset')).toHaveAttribute('dx', '8.67')
    expect(container.querySelector('#ds-chart-set feGaussianBlur')).toHaveAttribute('stdDeviation', '8')
    expect(container.querySelectorAll('#ds-chart-set feFlood')).toHaveLength(1)

    // Le porteur ne s'annonce pas : il n'existe que pour ses définitions.
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it("entaille une marque pleine à la MÊME profondeur qu'un trait : même géométrie, autre encre", () => {
    const { container } = render(<ChartFilters />)
    const geometrie = (id: string, paroi: string) => {
      const noeud = container.querySelector(`#${id} feDropShadow.${paroi}`)
      return ['dx', 'dy', 'stdDeviation'].map((a) => noeud?.getAttribute(a))
    }

    // LE CŒUR DE LA RÈGLE : une rainure n'a qu'une profondeur par graphique. Si ces deux
    // géométries divergent un jour, une barre et une courbe cesseront de se comparer — c'est
    // exactement ce que ce test interdit.
    expect(geometrie('ds-chart-groove-fill', 'ds-groove-dark')).toEqual(geometrie('ds-chart-groove', 'ds-groove-dark'))
    expect(geometrie('ds-chart-groove-fill', 'ds-groove-light')).toEqual(geometrie('ds-chart-groove', 'ds-groove-light'))

    // Ce qui les distingue est l'ENCRE, et elle vient du thème (chart.css), pas des attributs :
    // le filtre ne porte aucune couleur, c'est son identifiant qui la lui vaut.
    expect(container.querySelector('#ds-chart-groove-fill feDropShadow')).not.toHaveAttribute('flood-color')

    // Le tracé passe au-dessus de ses deux parois, ici aussi.
    const fusion = container.querySelectorAll('#ds-chart-groove-fill feMergeNode')
    expect(fusion[fusion.length - 1]).toHaveAttribute('in', 'SourceGraphic')
  })
})

describe('Disclosure', () => {
  it("se déplie par le chevron de la grille, sous l'intitulé, enfoncé tant que tout est affiché", async () => {
    render(
      <Disclosure title="Portefeuille" hint="D'où viennent les prix">
        <button type="button">Un réglage</button>
      </Disclosure>,
    )
    // L'intitulé est un titre, pas une commande : la seule commande est le chevron.
    expect(screen.getByRole('heading', { name: 'Portefeuille' })).toBeInTheDocument()
    const chevron = screen.getByRole('button', { name: 'Portefeuille' })
    expect(chevron).toHaveClass('ds-fold-toggle')

    // Repliée : le chevron en relief, le contenu hors d'atteinte.
    expect(chevron).toHaveAttribute('aria-expanded', 'false')
    expect(chevron).not.toHaveClass('ds-active')
    const contenu = document.getElementById(chevron.getAttribute('aria-controls') ?? '')
    expect(contenu).toHaveAttribute('inert')

    await userEvent.click(chevron)

    // Dépliée : le chevron ENFONCÉ, comme celui de la grille.
    expect(chevron).toHaveAttribute('aria-expanded', 'true')
    expect(chevron).toHaveClass('ds-active')
    expect(contenu).not.toHaveAttribute('inert')
    expect(screen.getByRole('button', { name: 'Un réglage' })).toBeInTheDocument()

    await userEvent.click(chevron)
    expect(chevron).toHaveAttribute('aria-expanded', 'false')
  })

  it("s'ouvre d'emblée quand on le demande", () => {
    render(
      <Disclosure title="Immobilier" defaultOpen>
        <p>Le bien</p>
      </Disclosure>,
    )
    expect(screen.getByRole('button', { name: 'Immobilier' })).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('Disclosure qui s’enfonce', () => {
  it('se creuse tout entière une fois dépliée, à plat repliée', async () => {
    const { container } = render(
      <Disclosure title="Données" sunken>
        <p>Sauvegarde</p>
      </Disclosure>,
    )
    const section = container.querySelector('.ds-disclosure')
    expect(section).toHaveClass('ds-selectable', 'ds-disclosure-sunken')
    expect(section).not.toHaveAttribute('data-selected')

    await userEvent.click(screen.getByRole('button', { name: 'Données' }))
    expect(section).toHaveAttribute('data-selected')

    await userEvent.click(screen.getByRole('button', { name: 'Données' }))
    expect(section).not.toHaveAttribute('data-selected')
  })

  it('reste une section ordinaire sans `sunken`', () => {
    const { container } = render(
      <Disclosure title="Immobilier" defaultOpen>
        <p>Le bien</p>
      </Disclosure>,
    )
    expect(container.querySelector('.ds-disclosure')).not.toHaveClass('ds-selectable')
    expect(container.querySelector('.ds-disclosure')).not.toHaveAttribute('data-selected')
  })
})

describe('DisclosureButton', () => {
  it("s'enfonce tout entier et se déplie d'un même appui, le contenu dans le bouton", async () => {
    const { container } = render(
      <DisclosureButton title="Données" hint="Synchronisation et sauvegarde" icon="cloud">
        <button type="button">Télécharger</button>
      </DisclosureButton>,
    )
    const bouton = screen.getByRole('button', { name: /Données/ })
    const section = container.querySelector('.ds-disclosure')
    const contenu = document.getElementById(bouton.getAttribute('aria-controls') ?? '')

    // La section est le bouton : elle porte le calque d'ombre, et l'en-tête est sa seule commande.
    expect(section?.querySelector(':scope > .ds-shade')).not.toBeNull()
    expect(bouton).toHaveClass('ds-disclosure-trigger')

    // Replié : la section en relief, le contenu hors d'atteinte.
    expect(bouton).toHaveAttribute('aria-expanded', 'false')
    expect(section).not.toHaveClass('ds-active')
    expect(contenu).toHaveAttribute('inert')

    // Un appui l'enfonce tout entière et la déplie : le contenu est dans la section, sous l'en-tête.
    await userEvent.click(bouton)
    expect(bouton).toHaveAttribute('aria-expanded', 'true')
    expect(section).toHaveClass('ds-active', 'ds-open')
    expect(section).toContainElement(contenu as HTMLElement)
    expect(contenu).not.toHaveAttribute('inert')

    await userEvent.click(bouton)
    expect(bouton).toHaveAttribute('aria-expanded', 'false')
    expect(section).not.toHaveClass('ds-active')
  })

  it("suit l'app quand elle en décide : l'en-tête demande, `open` tranche", async () => {
    function Pilote() {
      const [ouvert, setOuvert] = useState(false)
      return (
        <>
          <DisclosureButton title="Catégorie" open={ouvert} onToggle={setOuvert}>
            <button type="button" onClick={() => setOuvert(false)}>
              Enregistrer
            </button>
          </DisclosureButton>
        </>
      )
    }
    const { container } = render(<Pilote />)
    const entete = screen.getByRole('button', { name: /Catégorie/ })
    const section = container.querySelector('.ds-disclosure')

    await userEvent.click(entete)
    expect(entete).toHaveAttribute('aria-expanded', 'true')
    expect(section).toHaveClass('ds-active')

    // L'app replie : après enregistrement, par exemple.
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(entete).toHaveAttribute('aria-expanded', 'false')
    expect(section).not.toHaveClass('ds-active')
  })

  it('peut s’ouvrir d’emblée', () => {
    render(
      <DisclosureButton title="Revenus" defaultOpen>
        <p>Le salaire</p>
      </DisclosureButton>,
    )
    expect(screen.getByRole('button', { name: /Revenus/ })).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('Reveal', () => {
  // LA MISE EN PAGE SIMULÉE D'UN SEUL TEST NE DOIT PAS DÉBORDER SUR SES VOISINS : sans ce retour à
  // l'état nu, les deux tests qui suivent trouvent des lignes là où ils n'en attendent aucune et
  // basculent sur le chemin ANIMÉ — `inert` n'y revient qu'à la fin du repli.
  afterEach(() => vi.restoreAllMocks())

  /**
   * jsdom ne mesure rien : sans rectangles, `foldLines` ne relève aucune ligne et le composant tombe
   * sur son chemin IMMÉDIAT, où il n'y a aucune chorégraphie à observer. Même procédé que la suite de
   * `foldLines` — c'est la seule façon de tester le dépli lui-même.
   */
  function mesurer() {
    const rect = { top: 0, bottom: 40, left: 0, right: 100, width: 100, height: 40, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect)
    vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([rect] as unknown as DOMRectList)
  }

  it('prévient à la fin du repli, jamais au dépli', () => {
    const onFolded = vi.fn()
    const { rerender } = render(
      <Reveal open={false} onFolded={onFolded}>
        <p>Un message</p>
      </Reveal>,
    )
    rerender(
      <Reveal open onFolded={onFolded}>
        <p>Un message</p>
      </Reveal>,
    )
    expect(onFolded).not.toHaveBeenCalled()
    rerender(
      <Reveal open={false} onFolded={onFolded}>
        <p>Un message</p>
      </Reveal>,
    )
    expect(onFolded).toHaveBeenCalledTimes(1)
  })

  it('COUVRE le contenu dans la même image que l’ouverture : jamais de texte avant le cadre', () => {
    // LE DÉFAUT CORRIGÉ : `replie` se calcule au RENDU, donc le rendu qui ouvre la section retire
    // déjà `ds-folded` et `inert` — le contenu redevient visible — alors que c'est l'effet qui pose
    // les marques de dépli. En effet PASSIF, le navigateur peignait entre les deux : une bande de
    // texte à pleine encre apparaissait AVANT que le cadre ne s'ouvre, puis disparaissait, puis
    // revenait avec la première poussée. Et elle se voit : `.ds-reveal` garde un `--shadow-room` de
    // marge sous `overflow: hidden`, soit une ligne de texte entière à hauteur nulle.
    //
    // CE QUE jsdom PEUT TENIR, et c'est la moitié qui compte : qu'au sortir du changement d'état la
    // ligne soit DÉJÀ couverte. L'ordre vis-à-vis de la PEINTURE, lui, n'est pas observable ici —
    // c'est `useLayoutEffect` qui le garantit, et seul lui.
    //
    // LA MISE EN PAGE EST SIMULÉE : c'est d'ailleurs pourquoi les deux tests voisins ne
    // l'attrapaient pas, leur contenu n'ayant jamais eu de ligne à couvrir.
    mesurer()

    const { rerender } = render(
      <Reveal open={false} id="texte">
        <p>Un long message</p>
      </Reveal>,
    )
    rerender(
      <Reveal open id="texte">
        <p>Un long message</p>
      </Reveal>,
    )

    // Le contenu est atteignable (la section est ouverte)…
    const contenu = document.getElementById('texte') as HTMLElement
    expect(contenu).not.toHaveAttribute('inert')
    // …mais sa ligne est COUVERTE : rien à peindre tant que le cadre ne lui a pas fait la place.
    expect(contenu.querySelector('p')).toHaveAttribute('data-fold-hidden')
  })

  it('ne découvre une ligne SANS RELIEF qu’une fois sa place faite, pas au départ de la poussée', () => {
    // LA RÈGLE DU DS, APPLIQUÉE JUSQU'AU BOUT : le cadre pousse pour faire la place d'une ligne,
    // PUIS la ligne paraît. Une commande la respecte déjà sans rien devoir à ce code — elle gît à
    // plat au fond du creux et ne monte qu'une poussée plus tard, par `--pop-delay`. Un TEXTE n'a
    // rien à montrer à plat : découvert au départ de la poussée, il paraissait à pleine encre
    // pendant que le cadre s'ouvrait encore, et il se voyait — `.ds-reveal` garde un `--shadow-room`
    // de marge sous `overflow: hidden`, soit une ligne de texte entière à hauteur nulle.
    vi.useFakeTimers()
    mesurer()
    const { rerender } = render(
      <Reveal open={false} id="texte">
        <p>Un long message</p>
      </Reveal>,
    )
    rerender(
      <Reveal open id="texte">
        <p>Un long message</p>
      </Reveal>,
    )
    const ligne = document.querySelector('#texte p') as HTMLElement

    // La poussée part après la marge de 50 ms ; la ligne reste couverte pendant toute sa durée.
    act(() => void vi.advanceTimersByTime(60))
    expect(ligne).toHaveAttribute('data-fold-hidden')
    act(() => void vi.advanceTimersByTime(PUSH_S * 1000 - 20))
    expect(ligne).toHaveAttribute('data-fold-hidden')

    // Sa place faite — une poussée, exactement le retard du pop —, elle paraît.
    act(() => void vi.advanceTimersByTime(40))
    expect(ligne).not.toHaveAttribute('data-fold-hidden')
    vi.useRealTimers()
  })

  it('découvre TOUT DE SUITE une ligne qui a un relief : elle gît à plat au fond du creux', () => {
    // LE PENDANT, et c'est lui qui empêche de « corriger » le test précédent en retardant TOUT : une
    // commande à plat (`--pop: 0`) montre le fond du trou qu'on est en train de creuser, et ce temps
    // d'attente FAIT PARTIE de l'effet. Retarder sa découverte la ferait surgir toute montée.
    vi.useFakeTimers()
    mesurer()
    const { rerender } = render(
      <Reveal open={false} id="commandes">
        <button type="button" className="ds-button">
          Supprimer
        </button>
      </Reveal>,
    )
    rerender(
      <Reveal open id="commandes">
        <button type="button" className="ds-button">
          Supprimer
        </button>
      </Reveal>,
    )
    const ligne = document.querySelector('#commandes button') as HTMLElement

    act(() => void vi.advanceTimersByTime(60))
    expect(ligne).not.toHaveAttribute('data-fold-hidden')
    // Et elle est à plat : c'est `--pop-delay` qui la fera monter, pas ce code.
    expect(ligne.dataset.fold).toBe('pop')
    vi.useRealTimers()
  })

  it("se déplie et se replie au gré de l'état, sans intitulé ni chevron", () => {
    const { rerender } = render(
      <Reveal open={false} id="actions">
        <button type="button">Supprimer</button>
      </Reveal>,
    )
    // Repliée : ni bouton pour la commander, et un contenu hors d'atteinte.
    const contenu = document.getElementById('actions')
    expect(contenu).toHaveAttribute('inert')
    expect(screen.queryByRole('button', { name: /déplier/i })).not.toBeInTheDocument()

    rerender(
      <Reveal open id="actions">
        <button type="button">Supprimer</button>
      </Reveal>,
    )
    expect(contenu).not.toHaveAttribute('inert')

    rerender(
      <Reveal open={false} id="actions">
        <button type="button">Supprimer</button>
      </Reveal>,
    )
    expect(contenu).toHaveAttribute('inert')
  })
})

describe('Sélection', () => {
  function Liste() {
    const [choisis, setChoisis] = useState<Set<string>>(new Set())
    const basculer = (id: string) =>
      setChoisis((avant) => {
        const apres = new Set(avant)
        if (apres.has(id)) apres.delete(id)
        else apres.add(id)
        return apres
      })
    return (
      <ul>
        {['a', 'b'].map((id) => (
          <Selectable as="li" key={id} selected={choisis.has(id)} data-testid={`bloc-${id}`}>
            Opération {id}
            <SelectToggle selected={choisis.has(id)} onToggle={() => basculer(id)} label={`Sélectionner ${id}`} />
          </Selectable>
        ))}
      </ul>
    )
  }

  it("enfonce le bloc choisi, du même geste que son bouton à bascule", async () => {
    render(<Liste />)
    const bouton = screen.getByRole('button', { name: 'Sélectionner a' })
    const bloc = screen.getByTestId('bloc-a')

    // Au repos : le bouton en relief, la case vide ; le bloc à plat.
    expect(bloc.tagName).toBe('LI')
    expect(bloc).toHaveClass('ds-selectable')
    expect(bloc).not.toHaveAttribute('data-selected')
    expect(bouton).toHaveAttribute('aria-pressed', 'false')
    expect(bouton).not.toHaveClass('ds-active')
    expect(bouton.querySelector('.nf-md-checkbox_blank_outline')).toBeInTheDocument()

    await userEvent.click(bouton)

    // Choisi : le bouton ENFONCÉ, la case cochée ; le bloc enfoncé — et lui seul.
    expect(bouton).toHaveAttribute('aria-pressed', 'true')
    expect(bouton).toHaveClass('ds-active')
    expect(bouton.querySelector('.nf-md-checkbox_marked_outline')).toBeInTheDocument()
    expect(bloc).toHaveAttribute('data-selected')
    expect(screen.getByTestId('bloc-b')).not.toHaveAttribute('data-selected')

    await userEvent.click(bouton)
    expect(bloc).not.toHaveAttribute('data-selected')
  })

  it('prend la balise demandée, une ligne de tableau comprise', () => {
    render(
      <table>
        <tbody>
          <Selectable as="tr" selected data-testid="ligne">
            <td>Fonds euros</td>
          </Selectable>
        </tbody>
      </table>,
    )
    const ligne = screen.getByTestId('ligne')
    expect(ligne.tagName).toBe('TR')
    expect(ligne).toHaveAttribute('data-selected')
  })
})

describe('Button', () => {
  it('porte les classes du DS : forme, ton, taille, état', () => {
    render(
      <Button tone="danger" size="sm" active icon="delete">
        Effacer
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Effacer' })
    expect(button).toHaveClass('ds-button', 'ds-text', 'ds-small', 'ds-danger', 'ds-active')
    expect(button.querySelector('.nf-md-delete')).toBeInTheDocument()
    expect(button).toHaveAttribute('type', 'button')
  })

  it("un toucher bref reste enfoncé jusqu'au premier sommet du rebond", () => {
    vi.useFakeTimers()
    render(<Button>Sauvegarder</Button>)
    const button = screen.getByRole('button', { name: 'Sauvegarder' })
    fireEvent.pointerDown(button)
    fireEvent.pointerUp(button)
    expect(button).toHaveClass('ds-pressed')
    act(() => vi.advanceTimersByTime(PRESS_HOLD_MS))
    expect(button).not.toHaveClass('ds-pressed')
    vi.useRealTimers()
  })

  it('bouton-icône : un nom accessible, pas de texte', () => {
    render(<IconButton icon="close" label="Fermer" large />)
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveClass('ds-icon', 'ds-large')
  })
})

describe('ImageButton', () => {
  it('sertie : image dans un chaton, bascule enfoncée quand elle est prise', () => {
    render(<ImageButton name="Lagune" src="lagune.png" pressed />)
    const button = screen.getByRole('button', { name: 'Lagune' })
    expect(button).toHaveClass('ds-image-set', 'ds-active')
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(button.querySelector('.ds-well > img.ds-image')).toBeInTheDocument()
  })

  it("montre les initiales quand l'image manque ou ne charge pas", () => {
    const { rerender } = render(<ImageButton variant="chip" name="Braise Plus" />)
    expect(screen.getByText('BP')).toHaveClass('ds-image-fallback')
    rerender(<ImageButton variant="chip" name="Braise Plus" src="x.png" />)
    fireEvent.error(document.querySelector('img')!)
    expect(screen.getByText('BP')).toBeInTheDocument()
  })

  it('logo et nom : le nom est écrit, et nomme le bouton', () => {
    render(<ImageButton variant="label" name="Clarté" pressed={false} />)
    expect(screen.getByRole('button', { name: /Clarté/ })).toHaveClass('ds-image-label')
  })

  it('logo serti et nom : le logo dans un chaton, le nom écrit', () => {
    render(<ImageButton variant="label-set" name="Lagune" src="lagune.png" pressed />)
    const button = screen.getByRole('button', { name: /Lagune/ })
    expect(button).toHaveClass('ds-image-label', 'ds-image-label-set')
    expect(button.querySelector('.ds-well > img.ds-image')).toBeInTheDocument()
    expect(button).toHaveTextContent('Lagune')
  })

  it("prend l'état de la grille dépliante", () => {
    render(<ImageButton name="Nocturne" fold={{ folded: false, motion: 'pop', popDelay: 0.3 }} />)
    const button = screen.getByRole('button', { name: 'Nocturne' })
    expect(button).toHaveClass('is-popping')
    expect(button.style.getPropertyValue('--pop-delay')).toBe('0.3s')
  })
})

describe('SetImage', () => {
  it("sertie hors bouton : l'image dans un chaton, nommée, à la taille voulue", () => {
    render(<SetImage name="Ada Lovelace" src="ada.jpg" size={44} />)
    const image = screen.getByRole('img', { name: 'Ada Lovelace' })
    expect(image).toHaveClass('ds-well', 'ds-set-image')
    expect(image.style.getPropertyValue('--set-image-size')).toBe('44px')
    expect(image.querySelector('img.ds-image')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it("montre les initiales quand l'image ne charge pas ; décorative, elle se tait", () => {
    render(<SetImage name="Ada Lovelace" src="ada.jpg" decorative />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    fireEvent.error(document.querySelector('img')!)
    expect(screen.getByText('AL')).toHaveClass('ds-image-fallback')
  })
})

describe('Select et Checkbox', () => {
  it('sélecteur sans habillage natif, chevron du DS', () => {
    const change = vi.fn()
    render(<Select aria-label="Région" value="FR" onChange={(event) => change(event.target.value)} options={[{ value: 'BE', label: 'Belgique' }, { value: 'FR', label: 'France' }]} />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Région' }), { target: { value: 'BE' } })
    expect(change).toHaveBeenCalledWith('BE')
    expect(document.querySelector('.ds-select .nf-md-chevron_down')).toBeInTheDocument()
  })

  it('case à cocher du DS', () => {
    render(<Checkbox aria-label="Vu" defaultChecked />)
    expect(screen.getByRole('checkbox', { name: 'Vu' })).toHaveClass('ds-checkbox')
  })
})

describe('SearchField', () => {
  it("n'offre Effacer que s'il y a à effacer", async () => {
    function Harness() {
      const [value, setValue] = useState('')
      return <SearchField aria-label="Rechercher" value={value} onChange={setValue} onClear={() => setValue('')} />
    }
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.queryByRole('button', { name: 'Effacer la recherche' })).not.toBeInTheDocument()
    await user.type(screen.getByRole('searchbox', { name: 'Rechercher' }), 'dune')
    await user.click(screen.getByRole('button', { name: 'Effacer la recherche' }))
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })
})

describe('MenuBar', () => {
  it('situe la destination courante et en change', async () => {
    const select = vi.fn()
    const user = userEvent.setup()
    render(
      <MenuBar
        label="Sections"
        active="search"
        onSelect={select}
        items={[
          { id: 'home', icon: 'home', label: 'Accueil' },
          { id: 'search', icon: 'magnify', label: 'Recherche' },
        ]}
      />,
    )
    const nav = screen.getByRole('navigation', { name: 'Sections' })
    expect(nav.querySelector('.ds-active')).toHaveAccessibleName('Recherche')
    expect(screen.getByRole('button', { name: 'Recherche' })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('button', { name: 'Accueil' }))
    expect(select).toHaveBeenCalledWith('home')
  })

  it("garde l'ancienne destination allumée le temps que la pastille la quitte", () => {
    vi.useFakeTimers()
    const items = [
      { id: 'home', icon: 'home', label: 'Accueil' },
      { id: 'search', icon: 'magnify', label: 'Recherche' },
    ] as const
    const { rerender } = render(<MenuBar label="Sections" active="search" onSelect={() => {}} items={items} />)
    rerender(<MenuBar label="Sections" active="home" onSelect={() => {}} items={items} />)
    const old = screen.getByRole('button', { name: 'Recherche' })
    expect(old).toHaveClass('ds-active', 'ds-trail')
    expect(old).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'Accueil' })).toHaveAttribute('aria-current', 'page')
    act(() => vi.advanceTimersByTime(MENU_RELEASE_DELAY_MS))
    expect(old).not.toHaveClass('ds-active')
    vi.useRealTimers()
  })
})

describe('FoldingGrid', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `P${i}`, mine: i === 5 }))
  const grid = (keep?: (item: (typeof items)[number]) => boolean) => (
    <FoldingGrid
      items={items}
      getKey={(item) => item.id}
      keepVisible={keep}
      toggleLabel="Tout voir"
      renderItem={(item, fold) => <ImageButton name={item.name} fold={fold} />}
    />
  )
  const shown = () => screen.getAllByRole('button').filter((button) => button.title && !button.hasAttribute('inert'))

  it("repliée, une ligne ; le chevron déplie tout et reste enfoncé, puis replie", async () => {
    const user = userEvent.setup()
    render(grid())
    expect(shown()).toHaveLength(FALLBACK_COLUMNS)
    const toggle = screen.getByRole('button', { name: 'Tout voir' })
    await user.click(toggle)
    expect(shown()).toHaveLength(items.length)
    expect(toggle).toHaveClass('ds-active')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await user.click(toggle)
    expect(shown()).toHaveLength(FALLBACK_COLUMNS)
  })

  it('garde visibles, repliée, les lignes des éléments à montrer', () => {
    render(grid((item) => item.mine))
    expect(shown()).toHaveLength(2 * FALLBACK_COLUMNS)
  })
})

describe('Screen', () => {
  it("pose l'en-tête, le corps qui défile et le pied", () => {
    const { container } = render(
      <Screen>
        <Header>haut</Header>
        <Body>milieu</Body>
        <Footer>bas</Footer>
      </Screen>,
    )
    const screen = container.firstElementChild as HTMLElement
    expect(screen).toHaveClass('ds-screen')
    expect([...screen.children].map((child) => `${child.tagName.toLowerCase()}.${child.className}`)).toEqual([
      'header.ds-header',
      'div.ds-body',
      'footer.ds-footer',
    ])
  })

  // `data-fits` est ce que le CSS attend pour cesser de couper et rendre leur fond à l'en-tête et
  // au pied : sans lui, un bouton posé au ras du pied perd son ombre, tranchée sur sa ligne.
  it('dit que le corps TIENT dans sa place quand rien ne déborde', () => {
    const { container } = render(
      <Screen>
        <Body>milieu</Body>
      </Screen>,
    )
    expect(container.querySelector('.ds-body')).toHaveAttribute('data-fits')
  })

  it('ne le dit PAS quand le corps déborde : là, le découpage retient le contenu', () => {
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(500)
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(200)
    const { container } = render(
      <Screen>
        <Body>milieu</Body>
      </Screen>,
    )
    expect(container.querySelector('.ds-body')).not.toHaveAttribute('data-fits')
    vi.restoreAllMocks()
  })
})

describe('Slides', () => {
  const trois = (
    <Slides at={1}>
      <div>un</div>
      <div>deux</div>
      <div>trois</div>
    </Slides>
  )

  it('pose les écrans côte à côte et glisse le ruban sur l’écran courant', () => {
    const { container } = render(trois)
    const track = container.querySelector<HTMLElement>('.ds-slides-track')!
    expect(track.style.getPropertyValue('--slides-at')).toBe('1')
    expect(track.children).toHaveLength(3)
    // tous MONTÉS : une carte garde son contexte, une liste sa position
    expect(track.textContent).toBe('undeuxtrois')
  })

  it('rend INERTES les écrans qu’on ne regarde pas (ni doigt, ni focus, ni lecteur d’écran)', () => {
    const { container } = render(trois)
    const slides = [...container.querySelectorAll('.ds-slide')]
    expect(slides.map((slide) => slide.hasAttribute('inert'))).toEqual([true, false, true])
  })

  it('borne l’index : un écran hors liste ne déraille pas le ruban', () => {
    const { container } = render(
      <Slides at={9}>
        <div>un</div>
        <div>deux</div>
      </Slides>,
    )
    expect(container.querySelector<HTMLElement>('.ds-slides-track')!.style.getPropertyValue('--slides-at')).toBe('1')
  })
})

describe('ButtonBar', () => {
  it('répartit ses commandes sur la largeur, et se nomme quand on le lui demande', () => {
    const { container } = render(
      <ButtonBar label="Commandes de la vue">
        <button type="button">un</button>
        <button type="button">deux</button>
      </ButtonBar>,
    )
    const bar = container.firstElementChild as HTMLElement
    expect(bar).toHaveClass('ds-button-bar')
    expect(bar).toHaveAttribute('role', 'group')
    expect(bar).toHaveAccessibleName('Commandes de la vue')
    expect(bar.children).toHaveLength(2)
  })

  it("sans libellé, ce n'est qu'une boîte : ce sont les boutons qui se nomment", () => {
    const { container } = render(
      <ButtonBar>
        <button type="button">seul</button>
      </ButtonBar>,
    )
    const bar = container.firstElementChild as HTMLElement
    expect(bar).not.toHaveAttribute('role')
    expect(bar).not.toHaveAttribute('aria-label')
  })
})

describe('FlatSelector', () => {
  it('coche le choix courant, montre tous les libellés, et en change', async () => {
    const change = vi.fn()
    const user = userEvent.setup()
    render(
      <FlatSelector
        label="Plage"
        value="today"
        onChange={change}
        options={[
          { id: 'today', label: "Aujourd'hui" },
          { id: 'week', label: '7j' },
        ]}
      />,
    )
    const group = screen.getByRole('radiogroup', { name: 'Plage' })
    expect(group).toHaveClass('ds-menu', 'ds-flat-selector')
    expect(screen.getByRole('radio', { name: "Aujourd'hui" })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '7j' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('radio', { name: '7j' })).toHaveClass('ds-plain')
    await user.click(screen.getByRole('radio', { name: '7j' }))
    expect(change).toHaveBeenCalledWith('week')
    // Sur une ligne par défaut.
    expect(group).not.toHaveClass('ds-multiline')
  })

  it('multiligne, replie ses choix et reste un groupe de boutons radio', async () => {
    const change = vi.fn()
    const user = userEvent.setup()
    const pays = ['Allemagne', 'Belgique', 'Canada', 'Espagne', 'France', 'Italie', 'Japon', 'Suisse']
    render(
      <FlatSelector
        label="Pays"
        multiline
        value="France"
        onChange={change}
        options={pays.map((name) => ({ id: name, label: name }))}
      />,
    )
    const group = screen.getByRole('radiogroup', { name: 'Pays' })
    expect(group).toHaveClass('ds-menu', 'ds-flat-selector', 'ds-multiline')
    expect(screen.getAllByRole('radio')).toHaveLength(pays.length)
    expect(screen.getByRole('radio', { name: 'France' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('radio', { name: 'Japon' }))
    expect(change).toHaveBeenCalledWith('Japon')
  })
})

describe('DeleteButton', () => {
  afterEach(() => vi.useRealTimers())

  it('arme au premier appui, poubelle au rouge, et supprime au second', () => {
    const onDelete = vi.fn()
    render(<DeleteButton label="Supprimer Eau" onDelete={onDelete} />)
    const bouton = screen.getByRole('button', { name: 'Supprimer Eau' })
    expect(bouton.classList.contains('ds-armed')).toBe(false)
    expect(bouton.querySelector('.nf-md-delete')).not.toBeNull()

    fireEvent.click(bouton)
    expect(onDelete).not.toHaveBeenCalled()
    expect(bouton.classList.contains('ds-armed')).toBe(true)
    expect(bouton.getAttribute('aria-label')).toBe('Confirmer : Supprimer Eau')

    fireEvent.click(bouton)
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(bouton.classList.contains('ds-armed')).toBe(false)
  })

  it('reste à l’encre des commandes au repos : ni ton de danger, ni bouton à bascule', () => {
    render(<DeleteButton label="Supprimer" onDelete={() => {}} />)
    const bouton = screen.getByRole('button', { name: 'Supprimer' })
    expect(bouton.classList.contains('ds-danger')).toBe(false)
    expect(bouton.classList.contains('ds-momentary')).toBe(true)
    expect(bouton.hasAttribute('aria-pressed')).toBe(false)
  })

  it('désarme de lui-même au bout du délai', () => {
    vi.useFakeTimers()
    const onDelete = vi.fn()
    render(<DeleteButton label="Supprimer" onDelete={onDelete} />)
    const bouton = screen.getByRole('button', { name: 'Supprimer' })
    fireEvent.click(bouton)
    act(() => vi.advanceTimersByTime(DELETE_ARM_MS + 10))
    expect(bouton.classList.contains('ds-armed')).toBe(false)
    // Le prochain appui réarme, il ne supprime pas.
    fireEvent.click(bouton)
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('désarme quand on touche ailleurs', () => {
    const onDelete = vi.fn()
    render(
      <div>
        <DeleteButton label="Supprimer" onDelete={onDelete} />
        <button type="button">Ailleurs</button>
      </div>,
    )
    const bouton = screen.getByRole('button', { name: 'Supprimer' })
    fireEvent.click(bouton)
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Ailleurs' }))
    expect(bouton.classList.contains('ds-armed')).toBe(false)
    fireEvent.click(bouton)
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('avec son libellé : la poubelle et le nom, armés ensemble, puis la suppression', () => {
    const onDelete = vi.fn()
    render(<DeleteButton label="Tout effacer" withLabel onDelete={onDelete} />)
    const bouton = screen.getByRole('button', { name: 'Tout effacer' })
    expect(bouton.textContent).toBe('Tout effacer')
    expect(bouton.classList.contains('ds-text')).toBe(true)
    expect(bouton.querySelector('.nf-md-delete')).not.toBeNull()

    fireEvent.click(bouton)
    expect(bouton.classList.contains('ds-armed')).toBe(true)
    expect(bouton.getAttribute('aria-label')).toBe('Confirmer : Tout effacer')
    // Le libellé ne change pas : le bouton garde sa largeur.
    expect(bouton.textContent).toBe('Tout effacer')

    fireEvent.click(bouton)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('n’arme pas quand il est désactivé', () => {
    const onDelete = vi.fn()
    render(<DeleteButton label="Supprimer" onDelete={onDelete} disabled />)
    const bouton = screen.getByRole('button', { name: 'Supprimer' })
    fireEvent.click(bouton)
    fireEvent.click(bouton)
    expect(onDelete).not.toHaveBeenCalled()
  })
})
