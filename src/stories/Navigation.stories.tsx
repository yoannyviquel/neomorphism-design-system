import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { MenuBar, type MenuItem } from '../components/MenuBar'

const meta = {
  title: 'Navigation/Barre de menu',
  parameters: {
    docs: { description: { component: 'Un cadre creusé ; une seule pastille en relief glisse sous la destination courante, qui s’étire pour montrer son libellé.' } },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const ITEMS: MenuItem<'home' | 'search' | 'profile'>[] = [
  { id: 'home', icon: 'home', label: 'Accueil' },
  { id: 'search', icon: 'magnify', label: 'Recherche' },
  { id: 'profile', icon: 'account', label: 'Profil' },
]

function Demo() {
  const [active, setActive] = useState<'home' | 'search' | 'profile'>('home')
  return (
    <div style={{ maxWidth: 420 }}>
      <MenuBar label="Sections" items={ITEMS} active={active} onSelect={setActive} />
    </div>
  )
}

export const Menu: Story = { render: () => <Demo /> }
