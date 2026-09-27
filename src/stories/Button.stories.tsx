import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button, IconButton } from '../components/Button'

const meta = {
  title: 'Commandes/Bouton',
  component: Button,
  args: { children: 'Sauvegarder', icon: 'tray_arrow_down', tone: 'default', size: 'md', active: false },
  argTypes: {
    tone: { control: 'inline-radio', options: ['default', 'primary', 'danger', 'link'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          "En relief au repos, enfoncé pressé ou actif, avec le rebond : le creux dépasse sa profondeur (×1,8), rebondit et se pose ; relâché, le bouton jaillit au-dessus de son repos, puis se pose. Le rebord reste en place.",
      },
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Libellé: Story = {}

export const Tons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      <Button icon="tray_arrow_down">Sauvegarder</Button>
      <Button tone="primary" icon="check">
        Suivre
      </Button>
      <Button tone="danger" icon="delete">
        Effacer
      </Button>
      <Button tone="link">Choisir mes plateformes</Button>
      <Button size="sm">Petit</Button>
      <Button disabled>Indisponible</Button>
    </div>
  ),
}

function Toggle() {
  const [on, setOn] = useState(true)
  return (
    <Button active={on} aria-pressed={on} icon={on ? 'volume_high' : 'volume_off'} onClick={() => setOn(!on)}>
      {on ? 'Sons activés' : 'Sons coupés'}
    </Button>
  )
}

export const Bascule: Story = { render: () => <Toggle /> }

export const Icônes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24 }}>
      <IconButton icon="chevron_down" label="Déplier" />
      <IconButton icon="close" label="Fermer" large />
      <IconButton icon="refresh" label="Rafraîchir" active />
    </div>
  ),
}
