import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button, IconButton } from './Button'
import { Checkbox, Select } from './Field'
import { FALLBACK_COLUMNS, FoldingGrid } from './FoldingGrid'
import { ImageButton } from './ImageButton'
import { MenuBar } from './MenuBar'
import { SearchField } from './SearchField'
import { PRESS_HOLD_MS } from './usePress'

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
    expect(nav.style.getPropertyValue('--menu-at')).toBe('1')
    expect(screen.getByRole('button', { name: 'Recherche' })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('button', { name: 'Accueil' }))
    expect(select).toHaveBeenCalledWith('home')
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
