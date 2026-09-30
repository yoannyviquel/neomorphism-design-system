import { useEffect, useState, type ReactNode } from 'react'
import { Button, IconButton } from '../src/components/Button'
import { ChartFilters } from '../src/components/ChartFilters'
import { Notice, Spinner, Zone } from '../src/components/Feedback'
import { Checkbox, Input, Select } from '../src/components/Field'
import { FlatSelector } from '../src/components/FlatSelector'
import { FoldingGrid } from '../src/components/FoldingGrid'
import { ImageButton, type ImageButtonVariant } from '../src/components/ImageButton'
import { Body, ButtonBar, Footer, Header, Screen } from '../src/components/Layout'
import { MenuBar, type MenuItem } from '../src/components/MenuBar'
import { SearchField } from '../src/components/SearchField'
import { SetImage } from '../src/components/SetImage'
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
  { id: 'serties', title: 'Images serties' },
  { id: 'graphiques', title: 'Graphiques' },
  { id: 'champs', title: 'Champs' },
  { id: 'menu', title: 'Barre de menu' },
  { id: 'selecteur', title: 'Sélecteur multiple plat' },
  { id: 'ecran', title: 'Écran' },
  { id: 'rangee', title: 'Rangée de commandes' },
  { id: 'grille', title: 'Grille dépliante' },
  { id: 'retours', title: 'Zones et messages' },
]

/** Une progression de neuf points, en pourcentage : de quoi montrer l'ombre d'une donnée. */
const COURBE = [-1.2, 2.1, 3.8, 5.2, 8.4, 7.2, 12.6, 16.2, 20.4]

/** Quatre parts, dans les teintes des palettes du DS. */
const PARTS: [string, number, string][] = [
  ['Actions', 46, 'var(--grad-glacier-to)'],
  ['Immobilier', 24, 'var(--grad-solar-to)'],
  ['Obligations', 18, 'var(--grad-fern-to)'],
  ['Liquidités', 12, 'var(--grad-dusk-to)'],
]

function Charts() {
  const largeur = 420
  const hauteur = 150
  const points = COURBE.map((valeur, index) => [
    8 + (index * (largeur - 16)) / (COURBE.length - 1),
    hauteur - 14 - ((valeur + 4) * (hauteur - 28)) / 26,
  ])
  // Une courbe lissée : chaque point tire ses tangentes de ses voisins (Catmull-Rom).
  const courbe = points.reduce((chemin, point, index) => {
    if (index === 0) return `M ${point[0].toFixed(1)} ${point[1].toFixed(1)}`
    const avant = points[index - 2] ?? points[index - 1]
    const depuis = points[index - 1]
    const apres = points[index + 1] ?? point
    const c1 = [depuis[0] + (point[0] - avant[0]) / 6, depuis[1] + (point[1] - avant[1]) / 6]
    const c2 = [point[0] - (apres[0] - depuis[0]) / 6, point[1] - (apres[1] - depuis[1]) / 6]
    return `${chemin} C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${point[0].toFixed(1)} ${point[1].toFixed(1)}`
  }, '')

  const centre = 90
  const dehors = 78
  const dedans = 52
  // L'angle de départ de chaque part se lit dans ce qui la précède : rien à reporter d'un rendu à l'autre.
  const avantChaque = PARTS.map((_, rang) => PARTS.slice(0, rang).reduce((total, [, part]) => total + part, 0))

  return (
    <>
      <ChartFilters />
      <div className="row charts-demo">
        <figure className="charts-demo-courbe">
          <svg viewBox={`0 0 ${largeur} ${hauteur}`} role="img" aria-label="Une progression de neuf points">
            <line className="charts-demo-axe" x1="8" y1={hauteur - 14} x2={largeur - 8} y2={hauteur - 14} />
            <path className="charts-demo-trait" d={courbe} filter="url(#ds-chart-shadow)" />
          </svg>
          <figcaption>L'ombre d'une donnée, k = 1/9, à l'encre des données.</figcaption>
        </figure>

        <figure className="charts-demo-parts">
          <svg viewBox="0 0 180 180" role="img" aria-label="Une répartition en quatre parts">
            <g filter="url(#ds-chart-set)">
              {PARTS.map(([nom, part, teinte], rang) => {
                const delta = (part / 100) * Math.PI * 2
                const depart = -Math.PI / 2 + (avantChaque[rang] / 100) * Math.PI * 2
                const fin = depart + delta
                const bord = (rayon: number, a: number) =>
                  `${(centre + rayon * Math.cos(a)).toFixed(1)} ${(centre + rayon * Math.sin(a)).toFixed(1)}`
                const grand = delta > Math.PI ? 1 : 0
                return (
                  <path
                    key={nom}
                    className="charts-demo-part"
                    fill={teinte}
                    d={`M ${bord(dehors, depart)} A ${dehors} ${dehors} 0 ${grand} 1 ${bord(dehors, fin)} L ${bord(dedans, fin)} A ${dedans} ${dedans} 0 ${grand} 0 ${bord(dedans, depart)} Z`}
                  >
                    <title>{`${nom} · ${part} %`}</title>
                  </path>
                )
              })}
            </g>
          </svg>
          <figcaption>Le sertissage, k = 1/3 — l'ombre du creux seule, sur les deux bords.</figcaption>
        </figure>
      </div>
    </>
  )
}

/** La même rangée dans deux largeurs : c'est l'ÉCART qui change, pas les boutons. */
function ButtonBarDemo() {
  const boutons = ['sun_thermometer', 'weather_sunny', 'leaf', 'weather_windy', 'water'] as const
  const rangee = (
    <ButtonBar label="Catégories">
      {boutons.map((icon) => (
        <IconButton key={icon} icon={icon} label={icon} />
      ))}
    </ButtonBar>
  )
  return (
    <div className="bar-widths">
      <div style={{ width: '100%' }}>{rangee}</div>
      <div style={{ width: '62%' }}>{rangee}</div>
      <div style={{ width: '38%' }}>{rangee}</div>
    </div>
  )
}

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

function RangeDemo() {
  const [range, setRange] = useState('today')
  return (
    <div style={{ maxWidth: 420 }}>
      <FlatSelector
        label="Plage"
        value={range}
        onChange={setRange}
        options={[
          { id: 'today', label: "Aujourd'hui" },
          { id: 'tomorrow', label: 'Demain' },
          { id: 'week', label: '7j' },
          { id: 'fortnight', label: '14j' },
        ]}
      />
    </div>
  )
}

function ScreenDemo() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<'home' | 'search' | 'profile'>('search')
  return (
    <div className="screen-frame">
      <Screen>
        <Header>
          <SearchField aria-label="Rechercher" placeholder="Film ou série" value={query} onChange={setQuery} onClear={() => setQuery('')} />
        </Header>
        <Body>
          <div className="screen-cards">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="screen-card">
                {LOGOS[i % 4].name}
              </div>
            ))}
          </div>
        </Body>
        <Footer>
          <MenuBar label="Sections" items={MENU} active={active} onSelect={setActive} />
        </Footer>
      </Screen>
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
        <h3>Logo serti et nom</h3>
        <ImageRow variant="label-set" />
      </Demo>

      <Demo
        id="serties"
        title="Images serties"
        intro="Une image qu'on montre sans rien commander, un portrait : incrustée dans le chaton d'un bouton serti, sans la surface du bouton autour. Ce qui ne se touche pas n'a pas de relief."
      >
        <h3>Taille du chaton</h3>
        <div className="row">
          {LOGOS.map((logo) => (
            <SetImage key={logo.name} name={logo.name} src={logo.src} />
          ))}
          <SetImage name="Sans Image" />
        </div>
        <h3>Portrait et nom</h3>
        <ul className="cast-demo">
          {LOGOS.slice(0, 2).map((logo) => (
            <li key={logo.name}>
              <SetImage name={logo.name} src={logo.src} size={44} decorative />
              <span>
                <strong>{logo.name}</strong>
                <br />
                <span className="cast-demo-role">Rôle</span>
              </span>
            </li>
          ))}
        </ul>
      </Demo>

      <Demo
        id="graphiques"
        title="Graphiques"
        intro="Un graphique n'est ni une commande ni une zone : deux filtres lui suffisent. L'ombre d'une donnée, à l'échelle des plus petits éléments, sur un trait — à l'encre des données, plus dense, car un trait de 2 px ne retient qu'un tiers de l'ombre qu'il porte ; le sertissage, à l'échelle d'une surface, pour loger le graphique dans la page — l'ombre du creux seule, sans son reflet clair, qui délaverait les teintes."
      >
        <Charts />
      </Demo>

      <Demo id="champs" title="Champs" intro="Des commandes, pas des zones : en relief au repos, creusées une fois engagées, avec le rebond. Texte à 16 px, pour qu'iOS ne zoome pas.">
        <Fields />
      </Demo>

      <Demo id="menu" title="Barre de menu" intro="Un cadre creusé ; une pastille en relief sous la destination courante, qui montre son libellé. D'une destination à l'autre, la pastille s'étire puis se rétracte. Chaque destination est une commande de 50 px.">
        <Menu />
      </Demo>

      <Demo
        id="selecteur"
        title="Sélecteur multiple plat"
        intro="Un choix parmi quelques-uns, côte à côte dans un cadre creusé : la pastille en relief s'étire jusqu'au nouveau choix puis se rétracte de l'ancien, comme la barre de menu, dans la hauteur d'une commande."
      >
        <RangeDemo />
      </Demo>

      <Demo
        id="ecran"
        title="Écran"
        intro="Un en-tête et un pied fixes, un corps qui seul défile entre eux et passe dessous en s'effaçant en fondu (8 px). Le même écart, la place d'une ombre, sous l'en-tête et au-dessus du pied."
      >
        <ScreenDemo />
      </Demo>

      <Demo
        id="rangee"
        title="Rangée de commandes"
        intro="Des commandes réparties sur toute la largeur qu'on leur donne : la place libre se partage à parts égales entre elles et aux deux bouts. L'écart est une mesure du conteneur, pas une constante — la même rangée, ici, dans trois largeurs. Quand la place manque, l'écart tombe à la marge des ombres, puis la rangée se replie."
      >
        <ButtonBarDemo />
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
