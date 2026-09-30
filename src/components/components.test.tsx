import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button, IconButton } from './Button'
import { ChartFilters } from './ChartFilters'
import { Checkbox, Select } from './Field'
import { FALLBACK_COLUMNS, FoldingGrid } from './FoldingGrid'
import { ImageButton } from './ImageButton'
import { FlatSelector } from './FlatSelector'
import { Body, Footer, Header, Screen } from './Layout'
import { MENU_RELEASE_DELAY_MS, MenuBar } from './MenuBar'
import { SearchField } from './SearchField'
import { SetImage } from './SetImage'
import { PRESS_HOLD_MS } from './usePress'

describe('ChartFilters', () => {
  it("rend les deux filtres d'un graphique, chacun à son échelle", () => {
    const { container } = render(<ChartFilters />)

    // L'ombre d'une donnée : le relief à k = 1/9 (28 et 50 réduits).
    expect(container.querySelector('#ds-chart-shadow feDropShadow')).toHaveAttribute('dx', '3.11')
    expect(container.querySelector('#ds-chart-shadow feDropShadow')).toHaveAttribute('stdDeviation', '2.78')

    // Le sertissage : le creux à k = 1/3 (26 et 48 réduits), sans reflet clair ni rebord.
    expect(container.querySelector('#ds-chart-set feOffset')).toHaveAttribute('dx', '8.67')
    expect(container.querySelector('#ds-chart-set feGaussianBlur')).toHaveAttribute('stdDeviation', '8')
    expect(container.querySelectorAll('#ds-chart-set feFlood')).toHaveLength(1)

    // Le porteur ne s'annonce pas : il n'existe que pour ses définitions.
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
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
  })
})
