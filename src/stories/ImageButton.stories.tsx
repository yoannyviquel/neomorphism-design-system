import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ImageButton, type ImageButtonVariant } from '../components/ImageButton'
import { LOGOS } from './logos'

const meta = {
  title: 'Commandes/Bouton à image',
  component: ImageButton,
  args: { name: 'Lagune', src: LOGOS[3].src, variant: 'set', pressed: true },
  argTypes: { variant: { control: 'inline-radio', options: ['chip', 'set', 'label'] } },
  parameters: {
    docs: {
      description: {
        component:
          "Le bouton reste une surface du DS, l'image en est le contenu, posée au-dessus de ses ombres : le creux se dessine autour d'elle, jamais par-dessus. `chip`, la pastille ; `set`, sertie bord à bord dans un chaton, sous son ombre ; `label`, l'image en icône suivie du nom. Éteinte tant que la bascule n'est pas enfoncée.",
      },
    },
  },
} satisfies Meta<typeof ImageButton>

export default meta
type Story = StoryObj<typeof meta>

export const Un: Story = {}

function Row({ variant }: { variant: ImageButtonVariant }) {
  const [on, setOn] = useState<Record<string, boolean>>({ Clarté: true, Braise: true })
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      {LOGOS.map((logo) => (
        <ImageButton key={logo.name} variant={variant} name={logo.name} src={logo.src} pressed={!!on[logo.name]} onClick={() => setOn({ ...on, [logo.name]: !on[logo.name] })} />
      ))}
      <ImageButton variant={variant} name="Sans Image" pressed={false} />
    </div>
  )
}

export const Sertie: Story = { render: () => <Row variant="set" /> }
export const Pastille: Story = { render: () => <Row variant="chip" /> }
export const LogoEtNom: Story = { name: 'Logo et nom', render: () => <Row variant="label" /> }
