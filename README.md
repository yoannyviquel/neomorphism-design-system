# Neomorphism design system

Le design system néomorphique de mes apps (Follow, Investment, weather-ahead) : les jetons, le CSS
et les composants React, avec une page de démonstration. Publié en privé sur GitHub Packages sous
`@yoannyviquel/neomorphism-design-system`.

## Principes

- **Deux niveaux, deux thèmes.** Au repos, une commande est en relief ; active (pressée, cochée,
  engagée), elle est enfoncée. Le thème suit l'appareil (sombre par défaut) ; `data-theme="dark"`
  ou `"light"` sur `<html>` le force.
- **L'ombre ne dit que l'interaction.** Ce qui se presse a du relief ; une **zone** (panneau,
  liste, message) n'a qu'une bordure fine.
- **Une échelle d'ombres.** Toutes les ombres réduisent la maquette (shadow 2 en relief, shadow 4 en
  creux) d'un facteur k : **1/3** pour les commandes ordinaires, **1/2** pour les grandes (barre de
  menu, recherche), **1/9** pour les creux fixes (le chaton d'un bouton serti) — **multipliés par
  `--neu-density`**, l'amplitude du relief de l'échelle en cours (1 au doigt, 1/2 à la souris). k
  n'a jamais dépendu que de la taille de l'élément : une commande deux fois plus petite ne porte pas
  l'ombre d'une grande, et la règle n'est pas cassée, elle est précisée. Marge autour d'une
  commande : **72 px × k**, soit 24 / 36 px au doigt et **12 / 18 px à la souris**. Un élément
  enfoncé garde son rebord : son ombre en relief.
- **Le rebond.** Les boutons s'enfoncent et se relâchent avec la courbe réglée dans l'atelier « Pop
  du bouton » (`--sink-ease`) : dépassement ×1,8, creux, second rebond, posé, en 1 s. Les
  animations passent par des nombres enregistrés (`@property --sink`, `--pop`, `--menu-at`) :
  Safari n'interpole pas des listes d'ombres écrites en variables.
- **Deux échelles, choisies par le POINTEUR.** Le DS a été dessiné pour le pouce ; à la souris, qui
  vise au pixel, la même maquette est deux fois trop grosse. L'échelle **compacte** (commande de
  **25 px**) est donc le **défaut**, et l'échelle **confortable** (**50 px**, la maquette au pixel
  près) revient sur `@media (pointer: coarse)` — doigt, stylet. Pas de `resolution` / `dppx` : un
  écran Retina est un écran de bureau, et se vise à la souris. `data-density="compact"` ou
  `"comfortable"` sur `<html>` force l'une ou l'autre, comme `data-theme` force le thème.

  Six jetons littéraux par échelle, **tout le reste en découle** :

  | jeton | confortable (doigt) | compact (souris) |
  |---|---|---|
  | `--control-height` (= `-lg`) | 50 | 25 |
  | `--control-pad` — la marge d'un cadre | 8 | 4 |
  | `--control-icon` — le glyphe d'une commande | 20 | 16 |
  | `--control-check` — la case à cocher | 22 | 16 |
  | `--control-radius` | 14 | 7 |
  | `--neu-density` — l'amplitude du relief | 1 | 0,5 |
  | *dérivé* `--control-inner` (hauteur − 2 marges) | 34 | 17 |
  | *dérivé* `--control-radius-inner` (rayon − marge) | 6 | 3 |
  | *dérivé* `--shadow-room` / `-lg` | 24 / 36 | 12 / 18 |

  **La typographie ne bouge pas** : 14 / 15 / 16 px restent lisibles à 60 cm, et c'est pourquoi
  l'échelle n'est pas un simple multiplicateur. Les icônes et la case ne sont pas divisées par deux
  non plus (16, et non 10 ou 11) : ce sont des glyphes, ils vivent avec un texte resté à 14 px.

  Les jetons dérivés sont déclarés **sur le même élément** que les primitives : une densité par
  sous-arbre n'est pas supportée (le `calc()` y serait déjà substitué). La densité est une affaire
  de racine.
- **Une hauteur** : `--control-height` pour **toute commande** — bouton, lien d'action,
  bouton-icône, champ, sélecteur, logo et nom, **et destination de la barre de menu** ; les tuiles à
  image sont des carrés du même côté. Un **cadre** qui *loge* une commande (la recherche, le
  sélecteur plat) ne la rapetisse pas pour rien : il la pose à `--control-inner` et retombe ainsi
  lui-même sur `--control-height`, si bien qu'il s'aligne sur le bouton posé à côté de lui. La
  **barre de menu** est la seule exception, et c'est une exception de FOND, pas de forme : une
  destination n'est pas un contenu logé mais une **commande à part entière** — on la vise, on la
  presse, c'est la cible la plus sollicitée de l'app. Elle garde donc `--control-height`, et la
  barre fait une hauteur de commande *plus* ses deux marges (66 / 33 px). Elle le peut : seule au
  pied de l'écran, elle n'a rien à aligner à côté d'elle.

  | | ce qu'il loge | le logé | le cadre |
  |---|---|---|---|
  | `SearchField` | un champ, du contenu | `--control-inner` | `--control-height` |
  | `FlatSelector` | des choix, du contenu | `--control-inner` | `--control-height` |
  | `MenuBar` | des destinations, des **commandes** | `--control-height` | `--control-height` + 2 marges |
- **Un sous-menu, c'est `FlatSelector`.** Toute bascule entre contenus d'un même écran — Build /
  Run, Courant / Priorisation, une période, un mode d'affichage — **se fait avec le sélecteur
  multiple plat du DS, et avec rien d'autre** : pas de « segmented toggle » maison, pas de rangée de
  boutons dont on allume le courant. La règle de partage est simple : **`MenuBar` dit où l'on est
  dans l'app, `FlatSelector` dit ce qu'on regarde là où l'on est.** Les deux partagent la même
  mécanique (`PillBar`) — cadre creusé, pastille en relief qui s'étire jusqu'au nouveau choix puis
  se rétracte de l'ancien —, si bien qu'un sous-menu refait à la main ne sera jamais que cette
  mécanique en moins bien : pastille qui glisse au lieu de s'étirer, hauteurs hors échelle, relief
  hors facteur k, et une seconde grammaire à maintenir à côté de la première.
- **Un rayon** : `--control-radius`, celui des boutons-icônes, pour tout ce qui fait la hauteur
  d'une commande (cadres de la recherche et du menu compris) ; rayon − marge de cadre pour ce qui y
  est logé (`--control-radius-inner`), si bien que les arrondis restent parallèles.
- **Une cible tactile fait 44 px — sur pointeur grossier**, et c'est là que la règle s'applique. Les
  commandes y sont par leur hauteur (50 px) ; la case à cocher, seule exception à 22 px, y arrive
  par un débord invisible de sa zone sensible, déduit de sa taille (`(44px - --control-check) / -2`)
  et posé sous `@media (pointer: coarse)`. À la souris, les commandes font 25 px et la case 16, sans
  débord : un curseur vise juste.
- **Un toucher bref se voit** : le bouton reste enfoncé jusqu'au premier sommet du rebond (280 ms),
  puis se relâche avec le sien (`usePress`, classe `ds-pressed`).
- **L'ombre d'un bouton est un élément** (`<span class="ds-shade">`, rendu par les composants ;
  `Shade` pour un bouton écrit à la main), pas un pseudo-élément : il hérite des nombres animés du
  bouton, ce que Safari ne fait pas pour `::after`.
- **Un graphique n'est ni une commande ni une zone.** Son relief tient en trois filtres SVG
  (`ChartFilters`) : la **rainure** d'une courbe, le **sertissage** d'une surface, et l'**ombre
  d'une donnée** que la rainure a remplacée sur les courbes. Une courbe est *entaillée* dans la page
  comme un camembert y est serti — les deux disent la même chose de la même façon, ce que l'ombre,
  qui posait la courbe par-dessus, ne savait pas faire. **Toutes** les séries d'un graphique, et non
  la seule principale : le sillon n'est pas une mise en avant mais l'appartenance d'une donnée à la
  page. Deux rainures qui se croisent se lisent sans peine, la teinte et les tirets les distinguant ;
  elles ne se confondent un peu que là où deux traits courent côte à côte à moins d'un sillon
  d'écart.
- **Le flou d'une rainure vaut la largeur du trait.** Un creux se loge dans une surface, où il range
  ses deux ombres internes ; un trait n'a pas d'intérieur où les ranger, et la rainure les met donc
  dehors, de part et d'autre. Ses deux parois sont alors séparées par le trait lui-même : plus
  larges que lui, elles se recouvrent et s'annulent. Le flou du creux valant 48 k, la règle est
  **k = largeur / 48** — 1/24 pour un trait de 2 px, 1/48 pour 1 px, 1/12 pour 4 px, qui donnent la
  même image à l'échelle près. Le modèle d'ombre n'est pas touché : c'est le creux, retourné, à
  l'échelle que sa largeur commande.
- **Un trait ne retient qu'un tiers de son ombre.** Le pic d'une ombre floutée vaut la largeur de ce
  qui la porte divisée par σ√2π : sous un trait de 2 px, l'encre du relief tombe au seuil du visible,
  et sous 16 % — le thème clair — disparaît. Les parois d'une rainure ont donc leurs encres à elles,
  `--neu-data` et `--neu-data-light`, plus denses (95 % et 30 % en sombre, 42 % et 100 % en clair) —
  une paroi de deux pixels ne retient pas plus un rehaut qu'une ombre. Le sertissage garde l'encre du
  relief : une surface la retient entière. En thème clair, la paroi éclairée reste invisible malgré
  tout — sur un fond déjà presque blanc, il n'y a pas de place au-dessus. C'est alors le SENS de la
  paroi sombre qui dit la rainure : au-dessus du trait pour une gravure, en dessous pour un objet
  posé, comme sur le papier.
- **Un filtre se cite en attribut, jamais par une règle CSS.** WebKit résout le fragment d'un
  `url(#…)` écrit dans une feuille séparée contre l'URL de la feuille et non contre celle du
  document : le filtre disparaît alors sans la moindre erreur.
- **Les images ne remplacent jamais la surface d'un bouton.** Elles en sont le contenu, posées
  au-dessus de ses ombres : pastille, sertie, logo et nom, ou logo serti et nom.

## Contenu

| Composant | Rôle |
| --- | --- |
| `Button`, `IconButton` | bouton à libellé (tons défaut, primaire, danger, lien) et bouton-icône |
| `ImageButton` | bouton à image : `chip` (pastille), `set` (sertie), `label` (logo et nom), `label-set` (logo serti et nom) |
| `SetImage` | image sertie hors bouton (un portrait) : le chaton seul, sans relief, initiales à défaut d'image |
| `Input`, `Select`, `Checkbox` | champs, en relief au repos, creusés engagés |
| `SearchField` | champ de recherche, loupe qui s'allume, bouton Effacer |
| `MenuBar` | barre de menu creusée, pastille qui glisse sous la destination courante — *où l'on est dans l'app* |
| `FlatSelector` | **le sous-menu du DS** : un choix parmi quelques-uns, même cadre et même pastille — *ce qu'on regarde là où l'on est*. Toute bascule entre contenus passe par lui |
| `ButtonBar` | rangée de commandes répartie sur toute la largeur (l'écart suit le conteneur, pas une constante), qui se replie quand la place manque |
| `FoldingGrid` | grille repliée à une ligne, dépliée ligne par ligne avec le pop des boutons |
| `ChartFilters` | le relief d'un graphique, en filtres SVG : la rainure d'une courbe (`#ds-chart-groove`, k = 1/24 pour un trait de 2 px), le sertissage d'une surface (`#ds-chart-set`, k = 1/3) et l'ombre d'une donnée (`#ds-chart-shadow`, k = 1/9), que la rainure a remplacée sur les courbes |
| `Screen`, `Header`, `Body`, `Footer` | l'écran d'une app : en-tête et pied fixes, corps qui défile |
| `Slides` | les écrans côte à côte : changer de destination fait glisser le ruban à gauche ou à droite, tous restés montés, les autres `inert` |
| `Spinner`, `Notice`, `Zone`, `Icon` | chargement, message, zone bordée, icônes (Symbols Nerd Font) |

## Utiliser le paquet dans une app

1. Un jeton GitHub (classic) avec le droit `read:packages`, dans l'environnement : `NODE_AUTH_TOKEN`.
2. Un `.npmrc` à la racine de l'app :

   ```
   @yoannyviquel:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
   ```

3. `npm install @yoannyviquel/neomorphism-design-system`, puis :

   ```tsx
   import '@yoannyviquel/neomorphism-design-system/styles.css'
   import { Button, FoldingGrid, ImageButton } from '@yoannyviquel/neomorphism-design-system'
   ```

Le build d'une app (Cloudflare, CI) a besoin du même `NODE_AUTH_TOKEN` dans ses variables.

**L'app n'a rien à faire pour la densité** : le DS lit le pointeur. Sur **téléphone**, le rendu est
**identique au pixel** à celui d'avant (`pointer: coarse` ⇒ échelle confortable) ; ce qui change,
c'est l'aperçu sur un **navigateur de bureau**, qui passe à l'échelle compacte — c'est l'objet de la
version. Une app qui veut l'ancien rendu partout pose `data-density="comfortable"` sur `<html>`, une
app de bureau tactile (borne, écran de salle) peut au contraire forcer `"compact"` ; l'attribut a
toujours le dernier mot sur la détection.

Les **graphiques** font exception à la règle « un composant, un rendu » : le DS n'en dessine aucun,
il n'en règle que le relief. `ChartFilters` se rend une fois par page — ses identifiants sont fixes
—, puis n'importe quel SVG les cite, recharts compris :

```tsx
<ChartFilters />
<Line stroke={VALUE_COLOR} strokeWidth={2} filter="url(#ds-chart-groove)" />
<Pie data={parts} innerRadius="58%" outerRadius="86%" filter="url(#ds-chart-set)" />
```

Les valeurs des filtres sont en unités de tracé, qui sont les pixels de l'écran dans un graphique
rendu à l'échelle 1. Sur un SVG mis à l'échelle par sa `viewBox`, les diviser par le facteur.

## Développer

```bash
npm install          # npm 11 (npm 10 bute sur la résolution des dépendances pair)
npm run site         # la page de démonstration, http://localhost:5173
npm test
npm run build        # dist/index.js, dist/types, dist/styles
```

## Page de démonstration

`site/` est une app Vite toute simple, bâtie sur les composants du paquet : chaque famille en
situation, avec un sélecteur de thème (appareil, sombre, clair) et un sélecteur de **densité**
(pointeur, compacte, confortable). Attention, `pointer: coarse` **ne se déclenche pas** en
redimensionnant la fenêtre : il faut l'émulation d'appareil de DevTools — ou le sélecteur. Pas de
Storybook : sur iPhone,
Safari n'y jouait pas les animations (rebond, pop), alors qu'une page ordinaire les joue, comme
les apps.

Un Worker Cloudflare la sert (`wrangler.jsonc`), déployée à chaque poussée sur `main` par
l'intégration Git de Cloudflare :

| Réglage du build | Valeur |
| --- | --- |
| Commande de build | `npm run build-site` |
| Commande de déploiement | `npx wrangler deploy` |

Le build de ce Worker n'a besoin d'aucun jeton. L'adresse `*.workers.dev` est publique : pour
garder la page privée, la protéger par Cloudflare Access (Zero Trust → Access → Applications,
une règle sur son adresse e-mail).

## Publier une version

```bash
npm version minor    # ou patch, major : met à jour package.json et crée le tag
git push --follow-tags
```

Le workflow « Publier » construit et publie le tag sur GitHub Packages. Il se lance aussi à la main
(onglet Actions, « Run workflow ») et publie alors la version inscrite dans `package.json`.
