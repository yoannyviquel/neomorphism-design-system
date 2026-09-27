import type { Meta, StoryObj } from '@storybook/react-vite'
import { Notice, Spinner, Zone } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { ICONS } from '../components/icons'

const meta = {
  title: 'Fondations',
  parameters: {
    docs: {
      description: {
        component:
          "Ombres : une réduction de la maquette (shadow 2 en relief, shadow 4 en creux) par k — 1/3 pour les commandes ordinaires, 1/2 pour les grandes, 1/9 pour les creux fixes. Marge autour d'une commande : 72 px × k. L'ombre ne dit que l'interaction ; une zone porte une bordure fine.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const swatch = (shadow: string, label: string, size = 96) => (
  <figure style={{ margin: 0, display: 'grid', gap: 16, justifyItems: 'center' }}>
    <div style={{ width: size, height: size, borderRadius: 16, background: 'var(--color-bg)', boxShadow: shadow }} />
    <figcaption style={{ fontSize: 13, color: 'var(--color-muted)' }}>{label}</figcaption>
  </figure>
)

export const Ombres: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 56 }}>
      {swatch('var(--neu-raised)', 'Relief, k = 1/3')}
      {swatch('var(--neu-inset)', 'Creux, k = 1/3')}
      {swatch('var(--neu-raised-lg)', 'Relief, k = 1/2')}
      {swatch('var(--neu-inset-lg)', 'Creux, k = 1/2')}
    </div>
  ),
}

const COLORS = ['--color-bg', '--color-text', '--color-muted', '--color-primary', '--color-danger', '--color-border', '--grad-solar-to', '--grad-fern-to']

export const Couleurs: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 20 }}>
      {COLORS.map((name) => (
        <div key={name} style={{ display: 'grid', gap: 8 }}>
          <div style={{ height: 56, borderRadius: 12, background: `var(${name})`, border: '1px solid var(--color-border)' }} />
          <code style={{ fontSize: 12, color: 'var(--color-muted)' }}>{name}</code>
        </div>
      ))}
    </div>
  ),
}

export const Icônes: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
      {ICONS.map((name) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
          <Icon name={name} style={{ fontSize: 22 }} /> <code style={{ color: 'var(--color-muted)' }}>{name}</code>
        </div>
      ))}
    </div>
  ),
}

export const ZonesEtMessages: Story = {
  name: 'Zones et messages',
  render: () => (
    <div style={{ display: 'grid', gap: 24, maxWidth: 480 }}>
      <Zone>
        <strong>Une zone</strong> : une bordure fine, jamais d'ombre.
      </Zone>
      <Notice tone="warn" title="Aucune plateforme cochée">
        : tout est en noir et blanc.
      </Notice>
      <Notice tone="ok" title="Sauvegarde restaurée">
        : 12 titres suivis.
      </Notice>
      <Spinner label="Plateformes…" />
    </div>
  ),
}
