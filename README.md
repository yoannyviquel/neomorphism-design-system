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
  `--neu-density`**, l'amplitude du relief de l'échelle en cours (1 au doigt, **2/3** à la souris).
  k n'a jamais dépendu que de la taille de l'élément : une commande plus petite ne porte pas
  l'ombre d'une grande, et la règle n'est pas cassée, elle est précisée. Marge autour d'une
  commande : **72 px × k**, soit 24 / 36 px au doigt et **16 / 24 px à la souris**. Elle couvre :
  mesurée dans Chrome, l'ombre d'un bouton porte à 14 px à la souris et 21 au doigt, celle d'un
  cadre (k = 1/2) à 21 et 31. Un élément enfoncé garde son rebord : son ombre en relief.
- **Le rebond.** Les boutons s'enfoncent et se relâchent avec la courbe réglée dans l'atelier « Pop
  du bouton » (`--sink-ease`) : dépassement ×1,8, creux, second rebond, posé, en 1 s. Les
  animations passent par des nombres enregistrés (`@property --sink`, `--pop`, `--menu-at`) :
  Safari n'interpole pas des listes d'ombres écrites en variables.
- **Deux échelles, choisies par le POINTEUR.** Le DS a été dessiné pour le pouce ; à la souris, qui
  vise au pixel, la même maquette est trop grosse. L'échelle **compacte** (commande de
  **33 px**) est donc le **défaut**, et l'échelle **confortable** (**50 px**, la maquette au pixel
  près) revient sur `@media (pointer: coarse)` — doigt, stylet. Pas de `resolution` / `dppx` : un
  écran Retina est un écran de bureau, et se vise à la souris. `data-density="compact"` ou
  `"comfortable"` sur `<html>` force l'une ou l'autre, comme `data-theme` force le thème.

  Six jetons littéraux par échelle, **tout le reste en découle** :

  | jeton | confortable (doigt) | compact (souris) |
  |---|---|---|
  | `--control-height` (= `-lg`) | 50 | 33 |
  | `--control-pad` — la marge d'un cadre | 8 | 5 |
  | `--control-icon` — le glyphe d'une commande | 20 | 18 |
  | `--control-check` — la case à cocher | 22 | 18 |
  | `--control-radius` | 14 | 9 |
  | `--neu-density` — l'amplitude du relief | 1 | `calc(2 / 3)` |
  | *dérivé* `--control-inner` (hauteur − 2 marges) | 34 | 23 |
  | *dérivé* `--control-radius-inner` (rayon − marge) | 6 | 4 |
  | *dérivé* `--shadow-room` / `-lg` | 24 / 36 | 16 / 24 |

  **Le rapport est 2/3, pas la moitié.** Une commande de 25 px faisait trop petit à l'écran. Et
  les deux tiers sont le seul rapport simple qui rende `--shadow-room` **entier aux deux k**
  (72 × 1/3 × 2/3 = 16, 72 × 1/2 × 2/3 = 24), ce que ni 0,625 ni 0,66 ne font : ce n'est pas une
  ombre mais une **gouttière de mise en page**, posée en marge et en `gap` par les apps, elle doit
  tomber juste. D'où `calc(2 / 3)`, écrit en fraction et non en décimale.

  **La typographie ne bouge pas** : 14 / 15 / 16 px restent lisibles à 60 cm, et c'est pourquoi
  l'échelle n'est pas un simple multiplicateur. Les glyphes ne suivent pas non plus le rapport des
  boîtes (18, et non 13) : ils vivent avec un texte resté à 14 px.

  Les jetons dérivés sont déclarés **sur le même élément** que les primitives : une densité par
  sous-arbre n'est pas supportée (le `calc()` y serait déjà substitué). La densité est une affaire
  de racine.
- **Une hauteur, et un cadre fait ce qu'il loge plus ses deux marges.** C'est tout l'invariant, et
  il n'a qu'une question : *ce qui est dedans, est-ce qu'on le PRESSE ou est-ce qu'on le LIT ?*

  **Ce qu'on presse pour agir est une commande et fait `--control-height`** (33 / 50) — bouton,
  lien d'action, bouton-icône, champ, sélecteur, logo et nom, **destination de la barre de menu,
  choix du sélecteur plat** ; les tuiles à image sont des carrés du même côté. **Ce qu'on lit ou ce
  dans quoi on écrit est un contenu et fait `--control-inner`** (23 / 34).

  Un cadre ne rapetisse donc jamais ce qu'il loge pour s'aligner sur le bouton d'à côté : la cible
  offerte au pointeur passe avant le bord. Les deux cadres qui logent des commandes — barre de menu
  et sélecteur plat — font une hauteur de commande *plus* leurs deux marges, **43 / 66 px**. **Seule
  la recherche loge un contenu** (son champ, où l'on écrit), et c'est le seul cadre qui retombe sur
  `--control-height` tout compris, 33 / 50. Son bouton Effacer n'est pas une exception à la règle :
  il est l'accessoire du champ et prend sa taille, `--control-inner`.

  | | ce qu'il loge | le logé | le cadre |
  |---|---|---|---|
  | `MenuBar` | des destinations, des **commandes** | `--control-height` | 43 / 66 |
  | `FlatSelector` | des choix, des **commandes** | `--control-height` | 43 / 66 |
  | `SearchField` | un champ, du **contenu** (+ son bouton Effacer) | `--control-inner` | 33 / 50 |
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
  et posé sous `@media (pointer: coarse)`. À la souris, les commandes font 33 px et la case 18, sans
  débord : un curseur vise juste. Le débord se déduisant de la case, il suit même un
  `data-density="compact"` forcé sur un écran tactile : case de 18, débord de −13, cible de 44.
- **Un toucher bref se voit** : le bouton reste enfoncé jusqu'au premier sommet du rebond (280 ms),
  puis se relâche avec le sien (`usePress`, classe `ds-pressed`).
- **L'ombre d'un bouton est un élément** (`<span class="ds-shade">`, rendu par les composants ;
  `Shade` pour un bouton écrit à la main), pas un pseudo-élément : il hérite des nombres animés du
  bouton, ce que Safari ne fait pas pour `::after`.
- **Un graphique n'est ni une commande ni une zone.** Son relief tient dans `ChartFilters`.
- **Une marque de graphique est ENTAILLÉE, point** — qu'elle soit un trait, une aire, un symbole de
  nuage, un rectangle de barre ou une part de camembert. On ne choisit pas, marque par marque, entre
  être posé sur la page et y être gravé : toutes les marques d'un graphique disent la même chose,
  elles doivent la dire de la même façon. Et **toutes** les séries, non la seule principale : le
  sillon n'est pas une mise en avant mais l'appartenance d'une donnée à la page. Deux rainures qui se
  croisent se lisent sans peine, la teinte et les tirets les distinguant ; elles ne se confondent un
  peu que là où deux traits courent côte à côte à moins d'un sillon d'écart.
- **…et toutes à la MÊME PROFONDEUR. La géométrie ne change pas d'une marque à l'autre ; l'encre,
  si.** C'est la règle qu'il faut retenir, et elle a deux moitiés :

  **La géométrie est celle de la marque la plus FINE du graphique**, et elle vaut pour toutes. Au-delà
  de la largeur du trait, les parois sortent de la marque et redeviennent deux courbes fantômes :
  c'est un PLAFOND, pas une proportion. On ne redimensionne donc pas la rainure par marque — une barre
  de 30 px porterait une entaille de 30 px à côté d'une courbe entaillée de 2, et les deux ne se
  compareraient plus. Une rainure a **une** profondeur par graphique.

  **L'encre compense ce que la marque PERD de son ombre.** Une ombre portée est la silhouette
  décalée et floutée : une marque mince n'en dépose qu'une part, une marque pleine la dépose entière.
  Mesuré dans Chrome, à rainure constante, l'ombre déposée par pixel de bord rapportée à celle d'une
  marque épaisse :

  | épaisseur de la marque | 1 px | 2 px | 3 px | 6 px | ≥ 9 px |
  |---|---|---|---|---|---|
  | ombre réellement déposée | 27 % | **40 %** | 89 % | 99 % | **100 %** |

  Une marque cesse donc de perdre son ombre **dès 3 px**. D'où deux encres et un seul seuil :
  un **trait** (1 à 2 px) prend l'encre dense `--neu-data` / `--neu-data-light`, qui lui rend les
  trois cinquièmes que sa minceur lui coûte ; une **marque pleine** (3 px et plus) prend la même
  encre **à 40 %** (`--neu-data-fill` / `--neu-data-fill-light`), n'ayant rien à compenser. Sans
  cette correction, une barre dépose **2,4 fois** l'ombre de la courbe d'à côté ; avec elle,
  exactement la sienne — rapport **1,00** pour une barre de 14 px comme de 30 px, dans les **deux
  thèmes**. Recoupement : en thème clair, `--neu-dark` / `--neu-data` vaut **0,38**. L'encre du
  relief d'une surface *est*, à deux points près, l'encre d'une donnée à 40 % — `--neu-data` n'a
  jamais été une encre à part, c'est l'encre du relief divisée par ce qu'un trait en perd.
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
- **Ce qui se déplie se déplie comme la grille.** Une `Disclosure` reprend le système de la
  `FoldingGrid` pour un contenu quelconque : un intitulé toujours visible, le contenu replié, et
  dessous le même chevron, enfoncé tant que tout est affiché. Le dépli va ligne par ligne — le
  cadre pousse la page pour faire la place d'une ligne, puis ses commandes poppent, pendant que la
  suivante se découvre —, et le repli est le dépli à l'envers, depuis le bas. Les lignes d'un
  formulaire ne sont pas données comme celles d'une grille : elles sont relevées dans la mise en
  page (`foldLines`) — un titre, un champ avec son libellé, une note, ou une rangée de commandes
  côte à côte, qui poppent ensemble. Un texte se découvre sans popper : seul ce qui s'actionne a
  un relief à reprendre. Au-delà de quatre lignes, les poussées se resserrent pour que le dépli
  entier tienne dans le temps de quatre lignes de grille (`foldPush`) : trente poussées de 0,3 s
  feraient neuf secondes.
- **Ce qui paraît se déplie, il ne surgit pas.** Quand c'est l'état qui fait paraître un
  contenu — les actions d'une sélection, un message —, il se déplie comme une section dépliante
  dont l'état tiendrait le chevron : `Reveal`, la section dépliante cachée, qui est aussi le
  moteur de `Disclosure`. Il garde ce qu'il affichait le temps de son repli : une barre
  d'actions qui s'en va n'annonce pas « 0 sélectionnée ».
- **Ce qui est choisi s'enfonce, il ne se teint pas.** Le relief dit l'état, ici comme ailleurs :
  un élément choisi (`Selectable`) se creuse dans la page, du même geste et du même rebond que le
  bouton qui le choisit (`SelectToggle`, un bouton-icône à bascule — case vide, puis cochée et
  enfoncée). Le creux seul, sans le rebord en relief d'un bouton pressé : au repos l'élément est
  à plat, ce n'est pas une commande, et c'est une région de la page qui s'enfonce, pas une touche.
  Il porte d'avance la marge et les coins d'un creux : rien ne bouge quand il s'enfonce.
- **Supprimer se fait en deux appuis, sans boîte de dialogue** (`DeleteButton`). Au repos, la
  poubelle est à l'encre des commandes, comme tout bouton-icône : en rouge, chaque ligne d'une
  liste serait une alerte. Le premier appui fait rebondir le bouton, comme tout appui, et
  l'**arme** : la poubelle passe au rouge du danger. Le second supprime. La confirmation est là
  où était le doigt, rien d'autre ne bouge. Armé, il désarme de lui-même au bout de
  `DELETE_ARM_MS` (3 s) ou dès qu'on touche ailleurs, et son nom accessible devient
  « Confirmer : … ». Avec `withLabel`, c'est un bouton à libellé — la poubelle puis le nom —,
  pour une suppression qui doit se lire avant d'être touchée (« Tout effacer ») ; le nom rougit
  avec la poubelle, et ne change pas, pour que le bouton garde sa largeur.
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
| `FlatSelector` | **le sous-menu du DS** : un choix parmi quelques-uns, même cadre et même pastille — *ce qu'on regarde là où l'on est*. Toute bascule entre contenus passe par lui ; `multiline`, ses choix se replient sur plusieurs lignes et remplacent une liste déroulante |
| `ButtonBar` | rangée de commandes répartie sur toute la largeur (l'écart suit le conteneur, pas une constante), qui se replie quand la place manque |
| `FoldingGrid` | grille repliée à une ligne, dépliée ligne par ligne avec le pop des boutons |
| `DeleteButton` | le bouton qui supprime : poubelle à l'encre des commandes, armée au premier appui (rebond, poubelle rouge), qui supprime au second et désarme seule au bout de 3 s ou d'un appui ailleurs ; `withLabel`, un bouton à libellé (poubelle et nom) |
| `Selectable`, `SelectToggle` | la sélection : un bloc (ou une ligne de tableau, `as="tr"`) qui s'enfonce quand il est choisi, et le bouton à bascule qui le choisit, case vide puis cochée |
| `Reveal` | la section dépliante cachée : le dépli d'une `Disclosure`, sans intitulé ni chevron, commandé par l'état — les actions d'une sélection, un message qui s'impose |
| `Disclosure` | section dépliante, sur le système de la grille : un intitulé, le chevron dessous, un dépli ligne par ligne où chaque commande poppe |
| `ChartFilters` | le relief d'un graphique, en filtres SVG : la rainure d'un trait (`#ds-chart-groove`, k = 1/24 pour 2 px), **la même rainure pour une marque pleine** (`#ds-chart-groove-fill` : même géométrie, encre à 40 %) et le sertissage du graphique entier (`#ds-chart-set`, k = 1/3). `#ds-chart-shadow` est **déprécié** — plus aucune marque ne s'en sert |
| `Screen`, `Header`, `Body`, `Footer` | l'écran d'une app : en-tête et pied fixes, corps qui défile — **et qui ne coupe que s'il défile** : quand il tient dans sa place, le corps laisse déborder les ombres de ses boutons, l'en-tête et le pied rendent leur fond |
| `Slides` | les écrans côte à côte : changer de destination fait glisser le ruban à gauche ou à droite, tous restés montés, les autres `inert` ; chaque écran porte son `Body`, qui défile seul et garde sa position |
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
**identique au pixel** à celui de la maquette (`pointer: coarse` ⇒ échelle confortable) ; ce qui
change d'une version à l'autre, c'est le rendu sur un **navigateur de bureau**, à l'échelle
compacte — en 0.6.0 elle passe de 25 à 33 px, d'où une mineure : tout consommateur en est changé.
Une app qui veut l'échelle de la maquette partout pose `data-density="comfortable"` sur `<html>`, une
app de bureau tactile (borne, écran de salle) peut au contraire forcer `"compact"` ; l'attribut a
toujours le dernier mot sur la détection.

Les **graphiques** font exception à la règle « un composant, un rendu » : le DS n'en dessine aucun,
il n'en règle que le relief. `ChartFilters` se rend une fois par page — ses identifiants sont fixes
—, puis n'importe quel SVG les cite, recharts compris :

```tsx
<ChartFilters />
{/* un TRAIT : la rainure, encre dense */}
<Line stroke={VALUE_COLOR} strokeWidth={2} filter="url(#ds-chart-groove)" />
{/* des MARQUES PLEINES : la même rainure, encre à 40 % */}
<Bar dataKey="waiting" filter="url(#ds-chart-groove-fill)" />
<Scatter data={points} filter="url(#ds-chart-groove-fill)" />
<Pie data={parts} innerRadius="58%" outerRadius="86%" filter="url(#ds-chart-groove-fill)" />
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
(onglet Actions, « Run workflow ») : il publie alors la version inscrite dans `package.json`, puis
pose le tag `v<version>` s'il manque. Le champ « commit » vise un commit antérieur ; une version
déjà publiée n'est pas republiée, seul son tag est posé.
