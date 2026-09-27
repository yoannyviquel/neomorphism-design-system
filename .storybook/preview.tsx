import type { Decorator, Preview } from '@storybook/react-vite'
import { ThemeFrame } from './ThemeFrame'
import '../src/styles/index.css'

const withTheme: Decorator = (Story, context) => (
  <ThemeFrame theme={context.globals.theme as 'system' | 'dark' | 'light'}>
    <Story />
  </ThemeFrame>
)

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Thème',
      toolbar: {
        title: 'Thème',
        icon: 'contrast',
        items: [
          { value: 'system', title: "Celui de l'appareil" },
          { value: 'dark', title: 'Sombre' },
          { value: 'light', title: 'Clair' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'dark' },
  decorators: [withTheme],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
  },
}

export default preview
