import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Checkbox, Input, Select } from '../components/Field'
import { SearchField } from '../components/SearchField'

const meta = {
  title: 'Commandes/Champs',
  parameters: {
    docs: { description: { component: 'Des commandes, pas des zones : en relief au repos, creusées une fois engagées, avec le rebond. Texte à 16 px (pas de zoom iOS).' } },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function Search() {
  const [value, setValue] = useState('')
  return (
    <div style={{ maxWidth: 420 }}>
      <SearchField aria-label="Rechercher" placeholder="Film ou série" value={value} onChange={setValue} onClear={() => setValue('')} />
    </div>
  )
}

export const Recherche: Story = { render: () => <Search /> }

export const Saisie: Story = { render: () => <Input aria-label="Nom" placeholder="Nom" style={{ width: 280 }} /> }

function Region() {
  const [value, setValue] = useState('FR')
  return (
    <div style={{ maxWidth: 360 }}>
      <Select aria-label="Région" value={value} onChange={(event) => setValue(event.target.value)} options={[{ value: 'BE', label: 'Belgique' }, { value: 'FR', label: 'France' }, { value: 'CH', label: 'Suisse' }]} />
    </div>
  )
}

export const Sélecteur: Story = { render: () => <Region /> }

export const Case: Story = {
  render: () => (
    <label style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}>
      <Checkbox defaultChecked /> Épisode vu
    </label>
  ),
}
