import { useEffect, useState, type ReactNode } from 'react'
import { Button, IconButton } from '../src/components/Button'
import { Notice, Spinner, Zone } from '../src/components/Feedback'
import { Checkbox, Input, Select } from '../src/components/Field'
import { FoldingGrid } from '../src/components/FoldingGrid'
import { Icon } from '../src/components/Icon'
import { ICONS } from '../src/components/icons'
import { ImageButton, type ImageButtonVariant } from '../src/components/ImageButton'
import { MenuBar, type MenuItem } from '../src/components/MenuBar'
import { SearchField } from '../src/components/SearchField'
import { LOGOS } from './logos'
import pkg from '../package.json'

type Theme = 'system' | 'dark' | 'light'

const THEMES: { id: Theme; label: string }[] = [
  { id: 'system', label: "De l'appareil" },
  { id: 'dark', label: 'Sombre' },
  { id: 'light', label: 'Clair' },
]

const SECTIONS = [
  { id: 'fondations', title: 'Fondations' },
  { id: 'boutons', title: 'Boutons' },
  { id: 'images', title: 'Boutons à image' },
  { id: 'champs', title: 'Champs' },
  { id: 'menu', title: 'Barre de menu' },
  { id: 'grille', title: 'Grille dépliante' },
  { id: 'retours', title: 'Zones et messages' },
]

function Demo({ id, title, intro, children }: { id: string; title: string; intro: string; children: ReactNode }) {
  return (
    <section className="demo" id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      <p>{intro}</p>
      {children}
    </section>
  )
}

function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('ds-theme') as Theme | null) ?? 'system'
    } catch {
      return 'system'
    }
  })
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
    try {
      localStorage.setItem('ds-theme', theme)
    } catch {
      // Sans stockage, le thème vaut pour la visite.
    }
  }, [theme])
  return [theme, setTheme]
}

function SoundToggle() {
  const [on, setOn] = useState(true)
  return (
    <Button active={on} aria-pressed={on} icon={on ? 'volume_high' : 'volume_off'} onClick={() => setOn(!on)}>
      {on ? 'Sons activés' : 'Sons coupés'}
    </Button>
  )
}

function ImageRow({ variant }: { variant: ImageButtonVariant }) {
  const [on, setOn] = useState<Record<string, boolean>>({ Clarté: true, Braise: true })
  return (
    <div className="row">
      {LOGOS.map((logo) => (
        <ImageButton
          key={logo.name}
          variant={variant}
          name={logo.name}
          src={logo.src}
          pressed={!!on[logo.name]}
          onClick={() => setOn({ ...on, [logo.name]: !on[logo.name] })}
        />
      ))}
      <ImageButton variant={variant} name="Sans Image" pressed={false} />
    </div>
  )
}

function Fields() {
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('FR')
  return (
    <div className="stack">
      <SearchField aria-label="Rechercher" placeholder="Film ou série" value={query} onChange={setQuery} onClear={() => setQuery('')} />
      <Input aria-label="Nom" placeholder="Nom" />
      <Select
        aria-label="Région"
        value={region}
        onChange={(event) => setRegion(event.target.value)}
        options={[
          { value: 'BE', label: 'Belgique' },
          { value: 'FR', label: 'France' },
          { value: 'CH', label: 'Suisse' },
        ]}
      />
      <label className="row" style={{ gap: 12 }}>
        <Checkbox defaultChecked /> Épisode vu
      </label>
    </div>
  )
}

const MENU: MenuItem<'home' | 'search' | 'profile'>[] = [
  { id: 'home', icon: 'home', label: 'Accueil' },
  { id: 'search', icon: 'magnify', label: 'Recherche' },
  { id: 'profile', icon: 'account', label: 'Profil' },
]

function Menu() {
  const [active, setActive] = useState<'home' | 'search' | 'profile'>('home')
  return (
    <div style={{ maxWidth: 420 }}>
      <MenuBar label="Sections" items={MENU} active={active} onSelect={setActive} />
    </div>
  )
}

const PLATFORMS = Array.from({ length: 22 }, (_, i) => ({ id: i, name: `${LOGOS[i % 4].name} ${i + 1}`, src: LOGOS[i % 4].src }))

function Platforms() {
  const [picked, setPicked] = useState(() => new Set([0, 1, 2, 3, 4]))
  return (
    <div style={{ maxWidth: 380 }}>
      <FoldingGrid
        items={PLATFORMS}
        getKey={(item) => item.id}
        keepVisible={(item) => picked.has(item.id)}
        toggleLabel={`Toutes les plateformes (${PLATFORMS.length})`}
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
      <p className="after-fold">La suite de la page, poussée par le dépli.</p>
    </div>
  )
}

const COLORS = ['--color-bg', '--color-text', '--color-muted', '--color-primary', '--color-danger', '--color-border', '--grad-solar-to', '--grad-fern-to']

export function App() {
  const [theme, setTheme] = useTheme()
  return (
    <main className="site">
      <header className="site-head">
        <h1>Neomorphism design system</h1>
        <p>
          Les jetons, les styles et les composants partagés par Follow, Investment et weather-ahead — version {pkg.version}. Touchez les commandes :
          l'enfoncement, le pop et la pastille du menu s'animent comme dans les apps.
        </p>
        <div className="site-toolbar" role="group" aria-label="Thème">
          {THEMES.map((option) => (
            <Button key={option.id} size="sm" active={theme === option.id} aria-pressed={theme === option.id} onClick={() => setTheme(option.id)}>
              {option.label}
            </Button>
          ))}
        </div>
        <nav className="site-nav" aria-label="Sections">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.title}
            </a>
          ))}
        </nav>
      </header>

      <Demo
        id="fondations"
        title="Fondations"
        intro="Toutes les ombres réduisent la maquette (shadow 2 en relief, shadow 4 en creux) d'un facteur k : 1/3 pour les commandes ordinaires, 1/2 pour les grandes, 1/9 pour les creux fixes. Autour d'une commande, une marge de 72 px × k."
      >
        <div className="row">
          {[
            ['var(--neu-raised)', 'Relief, k = 1/3'],
            ['var(--neu-inset)', 'Creux, k = 1/3'],
            ['var(--neu-raised-lg)', 'Relief, k = 1/2'],
            ['var(--neu-inset-lg)', 'Creux, k = 1/2'],
          ].map(([shadow, label]) => (
            <figure className="swatch" key={label}>
              <div className="swatch-box" style={{ boxShadow: shadow }} />
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
        <h3>Couleurs</h3>
        <div className="colors">
          {COLORS.map((name) => (
            <div className="color" key={name}>
              <div className="color-chip" style={{ background: `var(${name})` }} />
              <code>{name}</code>
            </div>
          ))}
        </div>
        <h3>Icônes</h3>
        <div className="icons">
          {ICONS.map((name) => (
            <div key={name}>
              <Icon name={name} /> <code>{name}</code>
            </div>
          ))}
        </div>
      </Demo>

      <Demo
        id="boutons"
        title="Boutons"
        intro="En relief au repos, enfoncés pressés ou actifs, avec le rebond : le creux dépasse sa profondeur, rebondit et se pose ; relâché, le bouton jaillit au-dessus de son repos, puis se pose."
      >
        <div className="row">
          <Button icon="tray_arrow_down">Sauvegarder</Button>
          <Button tone="primary" icon="check">
            Suivre
          </Button>
          <Button tone="danger" icon="delete">
            Effacer
          </Button>
          <Button tone="link">Choisir mes plateformes</Button>
          <Button disabled>Indisponible</Button>
        </div>
        <h3>Bascule</h3>
        <div className="row">
          <SoundToggle />
        </div>
        <h3>Icônes</h3>
        <div className="row">
          <IconButton icon="chevron_down" label="Déplier" />
          <IconButton icon="close" label="Fermer" large />
          <IconButton icon="refresh" label="Rafraîchir" active />
        </div>
      </Demo>

      <Demo
        id="images"
        title="Boutons à image"
        intro="Le bouton reste une surface du DS, l'image en est le contenu, posée au-dessus de ses ombres. Éteinte tant que la bascule n'est pas enfoncée."
      >
        <h3>Sertie</h3>
        <ImageRow variant="set" />
        <h3>Pastille</h3>
        <ImageRow variant="chip" />
        <h3>Logo et nom</h3>
        <ImageRow variant="label" />
      </Demo>

      <Demo id="champs" title="Champs" intro="Des commandes, pas des zones : en relief au repos, creusées une fois engagées, avec le rebond. Texte à 16 px, pour qu'iOS ne zoome pas.">
        <Fields />
      </Demo>

      <Demo id="menu" title="Barre de menu" intro="Un cadre creusé ; une seule pastille en relief glisse sous la destination courante, qui s'étire pour montrer son libellé.">
        <Menu />
      </Demo>

      <Demo
        id="grille"
        title="Grille dépliante"
        intro="Repliée, une ligne, ou celles des éléments cochés. Le dépli va ligne par ligne : le cadre pousse la suite, puis les boutons poppent pendant que la ligne suivante se découvre. Le repli est le dépli à l'envers."
      >
        <Platforms />
      </Demo>

      <Demo id="retours" title="Zones et messages" intro="Une zone porte une bordure fine, jamais d'ombre : la profondeur est réservée aux commandes.">
        <div className="stack">
          <Zone>
            <strong>Une zone</strong> : une bordure fine.
          </Zone>
          <Notice tone="warn" title="Aucune plateforme cochée">
            : tout est en noir et blanc.
          </Notice>
          <Notice tone="ok" title="Sauvegarde restaurée">
            : 12 titres suivis.
          </Notice>
          <Spinner label="Plateformes…" />
        </div>
      </Demo>
    </main>
  )
}
