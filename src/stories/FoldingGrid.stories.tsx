import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { FoldingGrid } from '../components/FoldingGrid'
import { ImageButton } from '../components/ImageButton'
import { LOGOS } from './logos'

const meta = {
  title: 'Collections/Grille dépliante',
  parameters: {
    docs: {
      description: {
        component:
          "Repliée, une ligne (ou celles des éléments à toujours montrer). Le dépli va ligne par ligne : le cadre pousse la suite de la page, puis les boutons de la ligne poppent — montée du fond au-delà du relief, rebond, pose, image apparue à la redescente — pendant que la ligne suivante se découvre. Le repli est le dépli joué à l'envers.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const ITEMS = Array.from({ length: 22 }, (_, i) => ({ id: i, name: `${LOGOS[i % 4].name} ${i + 1}`, src: LOGOS[i % 4].src }))

function Demo() {
  const [picked, setPicked] = useState(() => new Set([0, 1, 2, 3, 4]))
  return (
    <div style={{ maxWidth: 360 }}>
      <FoldingGrid
        items={ITEMS}
        getKey={(item) => item.id}
        keepVisible={(item) => picked.has(item.id)}
        toggleLabel={`Toutes les plateformes (${ITEMS.length})`}
        renderItem={(item, fold) => (
          <ImageButton
            name={item.name}
            src={item.src}
            pressed={picked.has(item.id)}
            fold={fold}
            onClick={() => {
              const next = new Set(picked)
              if (next.has(item.id)) next.delete(item.id)
              else next.add(item.id)
              setPicked(next)
            }}
          />
        )}
      />
      <p style={{ marginTop: 36, color: 'var(--color-muted)' }}>La suite de la page, poussée par le dépli.</p>
    </div>
  )
}

export const Plateformes: Story = { render: () => <Demo /> }
